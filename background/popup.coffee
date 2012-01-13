TRESHOLD_HIDE_NOCOMMENT = 15
Deferred.debug = true
c = (x) -> console.log x

get_recent = (url) ->
  d = new Deferred
  $.get("http://feeds.delicious.com/v2/json/url/#{hex_md5 url}")
  .next (data) ->
    key_map =
      a:  'username'
      n:  'comment'
      t:  'tags'
      dt: 'timestamp'

    fixed =
      data.map (one) ->
        for key of one
          if key_map[key]?
            one[key_map[key]] = one[key]
          delete one[key]
        one
      .filter (one) ->
        one.username
    d.call fixed
  d

get_bookmark_count = (url) ->
  $.get("http://feeds.delicious.com/v2/json/urlinfo/#{hex_md5 url}")
  .next (data) -> data?.total_posts || 0

$ ->
  Deferred.next ->
    d = new Deferred
    chrome.tabs.getSelected null, (tab) ->
      d.call(tab.url)
    d
  .next (url) ->
    get_recent(url)

  .next (data) ->
    html_comments =
      if data.length is 0
        'No comments.'
      else
        data.map (one) ->
          url_icon = do ->
            username = if one.username.match /\./ then 'kawango' else one.username
            "http://cdn0.www.st-hatena.com/users/#{username.substr(0, 2)}/#{username}/profile_s.gif"

          html_line = """
            <li class="userlist #{if one.comment then "" else "nocomment"}">
              <a href="http://delicious.com/#{one.username}/"><img width="16" height="16" title="#{one.username}" alt="#{one.username}" src="#{url_icon}"></a>
              <a class="username" href="http://delicious.com/#{one.username}/">#{one.username}</a>
              <span class="comment">#{one.comment}</span>
              <span class="timestamp">#{one.timestamp.replace(/(.+)T.+/, '$1')}</span>
            </li>
          """
          html_line.replace /^\s+|\n\s+/, ''
          html_line.replace /\n/, ''
        .join('')
    $('#comment-list').html html_comments
    $('a').attr 'target', '_blank'
    if data.length >= TRESHOLD_HIDE_NOCOMMENT
      $('.nocomment').hide()
