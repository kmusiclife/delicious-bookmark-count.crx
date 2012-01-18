TRESHOLD_HIDE_NOCOMMENT = 15
Deferred.debug = true
c = (x) -> console.log x

getRecent = (url) ->
  d = new Deferred
  $.get("http://feeds.delicious.com/v2/json/url/#{hex_md5 url}")
  .next (comments) ->
    keyMap =
      a:  'username'
      n:  'comment'
      t:  'tags'
      dt: 'timestamp'

    fixed =
      comments.map (one) ->
        for key of one
          if keyMap.hasOwnProperty key
            one[keyMap[key]] = one[key] ? ""
          delete one[key]
        one
      .filter (one) ->
        one.username
    d.call fixed
  d

$ ->
  Deferred.chrome.tabs.getSelected(null)
  .next (tab) ->
    getRecent(tab.url)

  .next (comments) ->
    htmlComments =
      if comments.length is 0
        'No comments.'
      else
        comments.map (one) ->
          urlIcon = do ->
            username =
              if one.username.match /\./ then 'kawango' else one.username
            "http://cdn0.www.st-hatena.com/users/#{username.substr(0, 2)}/#{username}/profile_s.gif"

          htmlLine = """
            <li class="userlist #{if one.comment then "" else "nocomment"}">
              <a href="http://delicious.com/#{one.username}/"><img width="16" height="16" title="#{one.username}" alt="#{one.username}" src="#{urlIcon}"></a>
              <a class="username" href="http://delicious.com/#{one.username}/">#{one.username}</a>
              <span class="comment">#{one.comment}</span>
              <span class="timestamp">#{one.timestamp.replace(/(.+)T.+/, '$1')}</span>
            </li>
          """
          htmlLine.replace /^\s+|\n\s+/, ''
          htmlLine.replace /\n/, ''
        .join('')
    $('#comment-list').html htmlComments
    $('a').attr 'target', '_blank'
    if comments.length >= TRESHOLD_HIDE_NOCOMMENT
      $('.nocomment').hide()
