Deferred.debug = true

getEntryURL = (url) ->
  "http://delicious.com/url/#{hex_md5 url}"

httpGet = (url) ->
  req = new XMLHttpRequest()
  req.open "GET", url, true
  d = new Deferred
  req.onreadystatechange = ->
    if req.readyState is 4
      if req.status is 200
        json =
          try
            JSON.parse(req.responseText)
          catch e
            {}
        d.call json
      else
        console.log("fetch failed: (#{req.status}) #{url}")
  req.send null
  d

getBookmarkCount = (url) ->
  httpGet("http://feeds.delicious.com/v2/json/urlinfo/#{hex_md5 url}")
  .next (data) ->
    data?[0]?.total_posts

class WidgetEmbedder
  constructor: (@siteinfo) ->
    @embedLater WidgetEmbedder.INITIAL_DELAY
    document.addEventListener 'DOMNodeInserted',               this, false
    document.addEventListener 'AutoPagerize_DOMNodeInserted',  this, false
    document.addEventListener 'AutoPatchWork.DOMNodeInserted', this, false

extend WidgetEmbedder,
  INITIAL_DELAY:   20,
  MUTATION_DELAY: 100

WidgetEmbedder.messages =
  SHOW_ENTRY_TEXT:  '[Show on Delicious]',
  SHOW_ENTRY_TITLE: 'Show This Entry on Delicious',

extend WidgetEmbedder::,
  embedLater: (delay) ->
    return  if @timerId
    @timerId = setTimeout((self) ->
      self.embed()
      self.timerId = 0
    , delay, this)

  embed: ->
    queryXPathAll(@siteinfo.paragraph).forEach @embedInParagraph, this

  embedInParagraph: (paragraph) ->
    return  if paragraph._hb_isWidgetEmbedded
    paragraph._hb_isWidgetEmbedded = true
    link = @getLink(paragraph)
    return  if not link or not /^https?:/.test(link.href)
    point = @getAnnotationPoint(paragraph, link)
    return  unless point
    @createWidgets(link)
    .next (widgets) ->
      point.insertNode widgets
      point.detach()

  getLink: (paragraph) ->
    xpath = @siteinfo.link or "."
    if xpath is "__location__"
      url = location.href
      node = paragraph

      while node
        if node._hb_baseURL
          url = node._hb_baseURL
          break
        node = node.parentNode
      a = document.createElement("a")
      a.href = url
      return a
    link = queryXPath(xpath, paragraph)
    (if (link and link.href) then link else null)

  getAnnotationPoint: (paragraph, link) ->
    existing = @getExistingWidgets(paragraph, link)
    return null  if existing.counter
    point = document.createRange()
    anchor = existing.entry or existing.comments or existing.addButton
    if anchor
      point.selectNode anchor
      point.collapse anchor isnt existing.entry
      return point
    annotation = (if @siteinfo.annotation then queryXPath(@siteinfo.annotation, paragraph) else link)
    return null  unless annotation
    position = (@siteinfo.annotationPosition or "").toLowerCase()
    unless position
      switch annotation.localName
        when "a", "br", "hr", "img", "canvas", "object", "input", "button", "select", "textarea"
          position = "after"
        else
          position = "last"
    if position is "before" or position is "after"
      point.selectNode annotation
    else
      point.selectNodeContents annotation
    point.collapse position is "before" or position is "start"
    point

  getExistingWidgets: (paragraph, link) ->
    widgets =
      entry:     null
      counter:   null
      comments : null
      addButton: null

  createWidgets: (link) ->
    url = link.href
    getBookmarkCount(url)
    .next (count) ->
      widgets = document.createDocumentFragment()
      widgets.appendChild document.createTextNode(' ')
      div = E 'div'
      _link = E 'a',
        href: getEntryURL url
        class: 'delicious-bookmark-count'
      , document.createTextNode "#{if count then count + ' users' else ''}"
      if      count >= 5
        _link = E 'strong', {}, _link
      else if count >= 3
        _link = E 'em',     {}, _link
      widgets.appendChild _link
      widgets

  handleEvent: (event) ->
    switch event.type
      when "AutoPagerize_DOMNodeInserted", "AutoPatchWork.DOMNodeInserted"
        document.removeEventListener "DOMNodeInserted", this, false
        event.target._hb_baseURL = event.newValue
      when "DOMNodeInserted"
        @embedLater WidgetEmbedder.MUTATION_DELAY

if window.top == window.self
  SiteinfoRequestor.init()
