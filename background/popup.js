var TRESHOLD_HIDE_NOCOMMENT, c, get_bookmark_count, get_recent;
TRESHOLD_HIDE_NOCOMMENT = 15;
Deferred.debug = true;
c = function(x) {
  return console.log(x);
};
get_recent = function(url) {
  var d;
  d = new Deferred;
  $.get("http://feeds.delicious.com/v2/json/url/" + (hex_md5(url))).next(function(comments) {
    var fixed, key_map;
    key_map = {
      a: 'username',
      n: 'comment',
      t: 'tags',
      dt: 'timestamp'
    };
    fixed = comments.map(function(one) {
      var key, _ref;
      for (key in one) {
        if (key_map.hasOwnProperty(key)) {
          one[key_map[key]] = (_ref = one[key]) != null ? _ref : "";
        }
        delete one[key];
      }
      return one;
    }).filter(function(one) {
      return one.username;
    });
    return d.call(fixed);
  });
  return d;
};
get_bookmark_count = function(url) {
  return $.get("http://feeds.delicious.com/v2/json/urlinfo/" + (hex_md5(url))).next(function(comments) {
    return (comments != null ? comments.total_posts : void 0) || 0;
  });
};
$(function() {
  return Deferred.next(function() {
    var d;
    d = new Deferred;
    chrome.tabs.getSelected(null, function(tab) {
      return d.call(tab.url);
    });
    return d;
  }).next(function(url) {
    return get_recent(url);
  }).next(function(comments) {
    var html_comments;
    html_comments = comments.length === 0 ? 'No comments.' : comments.map(function(one) {
      var html_line, url_icon;
      url_icon = (function() {
        var username;
        username = one.username.match(/\./) ? 'kawango' : one.username;
        return "http://cdn0.www.st-hatena.com/users/" + (username.substr(0, 2)) + "/" + username + "/profile_s.gif";
      })();
      html_line = "<li class=\"userlist " + (one.comment ? "" : "nocomment") + "\">\n  <a href=\"http://delicious.com/" + one.username + "/\"><img width=\"16\" height=\"16\" title=\"" + one.username + "\" alt=\"" + one.username + "\" src=\"" + url_icon + "\"></a>\n  <a class=\"username\" href=\"http://delicious.com/" + one.username + "/\">" + one.username + "</a>\n  <span class=\"comment\">" + one.comment + "</span>\n  <span class=\"timestamp\">" + (one.timestamp.replace(/(.+)T.+/, '$1')) + "</span>\n</li>";
      html_line.replace(/^\s+|\n\s+/, '');
      return html_line.replace(/\n/, '');
    }).join('');
    $('#comment-list').html(html_comments);
    $('a').attr('target', '_blank');
    if (comments.length >= TRESHOLD_HIDE_NOCOMMENT) {
      return $('.nocomment').hide();
    }
  });
});