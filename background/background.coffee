HTTPCache.counter = new HTTPCache 'counterCache', {
  expire : 60 * 15
  seriarizer: 'JSON',
  #json: true,
  createURL: (url) ->
    "http://feeds.delicious.com/v2/json/urlinfo/#{hex_md5 url}"
  beforeSetFilter: (data) ->
    data?[0]?.total_posts
}

Manager =
  updateTab: (tabId) ->
    chrome.tabs.get tabId, (tab) =>
      @updateBookmarkCounter tab
  updateBookmarkCounter: (tab) ->
    if tab and tab.url?.indexOf 'http' == 0
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

chrome.tabs.onUpdated.addListener (tabId, opt) ->
  if opt.status is 'loading'
    Manager.updateTab(tabId)

