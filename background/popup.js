var TRESHOLD_HIDE_NOCOMMENT, c, getRecent;
TRESHOLD_HIDE_NOCOMMENT = 15;
Deferred.debug = true;
c = function(x) {
  return console.log(x);
};
getRecent = function(url) {
  var d;
  d = new Deferred;
  $.get("http://feeds.delicious.com/v2/json/url/" + (hex_md5(url))).next(function(comments) {
    var fixed, keyMap;
    keyMap = {
      a: 'username',
      n: 'comment',
      t: 'tags',
      dt: 'timestamp'
    };
    fixed = comments.map(function(one) {
      var key, _ref;
      for (key in one) {
        if (keyMap.hasOwnProperty(key)) {
          one[keyMap[key]] = (_ref = one[key]) != null ? _ref : "";
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
$(function() {
  return Deferred.chrome.tabs.getSelected(null).next(function(tab) {
    return getRecent(tab.url);
  }).next(function(comments) {
    var htmlComments;
    htmlComments = comments.length === 0 ? 'No comments.' : comments.map(function(one) {
      var htmlLine, urlIcon;
      urlIcon = (function() {
        var username;
        username = one.username.match(/\./) ? 'kawango' : one.username;
        return "http://cdn0.www.st-hatena.com/users/" + (username.substr(0, 2)) + "/" + username + "/profile_s.gif";
      })();
      htmlLine = "<li class=\"userlist " + (one.comment ? "" : "nocomment") + "\">\n  <a href=\"http://delicious.com/" + one.username + "/\"><img width=\"16\" height=\"16\" title=\"" + one.username + "\" alt=\"" + one.username + "\" src=\"" + urlIcon + "\"></a>\n  <a class=\"username\" href=\"http://delicious.com/" + one.username + "/\">" + one.username + "</a>\n  <span class=\"comment\">" + one.comment + "</span>\n  <span class=\"timestamp\">" + (one.timestamp.replace(/(.+)T.+/, '$1')) + "</span>\n</li>";
      htmlLine.replace(/^\s+|\n\s+/, '');
      return htmlLine.replace(/\n/, '');
    }).join('');
    $('#comment-list').html(htmlComments);
    $('a').attr('target', '_blank');
    if (comments.length >= TRESHOLD_HIDE_NOCOMMENT) {
      return $('.nocomment').hide();
    }
  });
});