HTTPCache.counter = new HTTPCache 'counterCache', {
  expire : 60 * 15
  seriarizer: 'JSON',
  #json: true,
  createURL: (url) ->
    "http://feeds.delicious.com/v2/json/urlinfo/#{hex_md5 url}"
  beforeSetFilter: (data) ->
    data?[0]?.total_posts
}

SiteinfoManager.addSiteinfos
    data: [
      # Google Web Search
      {
        domain:     '^https?://www\\.google(?:\\.\\w+){1,2}/search\\?'
        paragraph:  'descendant::div[@id = "res"]/div/div/ol/li[contains(concat(" ", @class, " "), " g ")]'
        link:       'descendant::a[contains(concat(" ", @class, " "), " l ")]'
        annotation: 'descendant::span[contains(concat(" ", @class, " "), " gl ")]'
        annotationPosition: 'after'
      }
      {
        domain:  '^http://b\\.hatena\\.ne\\.jp/'
        disable: true
      }
    ]

SiteinfoManager.addSiteinfos
    urls: [
        'http://wedata.net/databases/LDRize/items.json'
        'http://b.st-hatena.com/file/LDRize.items.json'
    ]
    converter: SiteinfoManager.LDRizeConverter
    key: 'LDRizeSiteinfo'

ConnectMessenger = $ {}

ConnectMessenger.bind "get_siteinfo_for_url",     (event, data, port) ->
  console.log('got request of siteinfo for ' + data.url)
  SiteinfoManager.sendSiteinfoForURL data.url, port

ConnectMessenger.bind "get_siteinfos_with_xpath", (event, data, port) ->
  console.log('got request of siteinfos whose domain is XPath')
  SiteinfoManager.sendSiteinfosWithXPath port

Manager =
  updateTab: (tabId) ->
    chrome.tabs.get tabId, (tab) =>
      @updateBookmarkCounter tab
  updateBookmarkCounter: (tab) ->
    if      tab?.url?.indexOf('https') == 0
      chrome.browserAction.setBadgeText                  tabId: tab.id, text: '-'
      chrome.browserAction.setBadgeBackgroundColor       tabId: tab.id, color: [99,99,99, 255]
    else if tab?.url?.indexOf('http')  == 0
      HTTPCache.counter.get(tab.url)
      .next (count) ->
        switch count
          when null
            chrome.browserAction.setBadgeText            tabId: tab.id, text: ''
            chrome.browserAction.setBadgeBackgroundColor tabId: tab.id, color: [99,99,99, 255]
          when undefined
            chrome.browserAction.setBadgeText            tabId: tab.id, text: '-'
            chrome.browserAction.setBadgeBackgroundColor tabId: tab.id, color: [99,99,99, 255]
          else
            chrome.browserAction.setBadgeText            tabId: tab.id, text: "#{count}",
            chrome.browserAction.setBadgeBackgroundColor tabId: tab.id, color: [96,255,0, 200]
    else
      chrome.browserAction.setBadgeText                  tabId: tab.id, text: ''
      chrome.browserAction.setBadgeBackgroundColor       tabId: tab.id, color: [99,99,99, 255]
  updateCurrentTab: ->
    chrome.tabs.getSelected null, (t) ->
      chrome.windows.getCurrent (w) ->
        if t && w && w.id == t.windowId
          Manager.updateTab t.id

chrome.tabs.onUpdated.addListener (tabId, opt) ->
  if opt.status is 'loading'
    Manager.updateTab tabId

chrome.tabs.onSelectionChanged.addListener (tabId) ->
  Manager.updateCurrentTab()

chrome.self.onConnect.addListener (port, name) ->
  port.onMessage.addListener (info, con) ->
    if info.message
      ConnectMessenger.trigger info.message, [info.data, con]
