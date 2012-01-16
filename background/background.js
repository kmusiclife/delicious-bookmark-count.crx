var Manager;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
HTTPCache.counter = new HTTPCache('counterCache', {
  expire: 60 * 15,
  seriarizer: 'JSON',
  createURL: function(url) {
    return "http://feeds.delicious.com/v2/json/urlinfo/" + (hex_md5(url));
  },
  beforeSetFilter: function(data) {
    var _ref;
    return data != null ? (_ref = data[0]) != null ? _ref.total_posts : void 0 : void 0;
  }
});
Manager = {
  updateTab: function(tabId) {
    return chrome.tabs.get(tabId, __bind(function(tab) {
      return this.updateBookmarkCounter(tab);
    }, this));
  },
  updateBookmarkCounter: function(tab) {
    var _ref;
    if (tab && ((_ref = tab.url) != null ? _ref.indexOf('http' === 0) : void 0)) {
      return HTTPCache.counter.get(tab.url).next(function(count) {
        switch (count) {
          case null:
            chrome.browserAction.setBadgeText({
              tabId: tab.id,
              text: ''
            });
            return chrome.browserAction.setBadgeBackgroundColor({
              tabId: tab.id,
              color: [99, 99, 99, 255]
            });
          case void 0:
            chrome.browserAction.setBadgeText({
              tabId: tab.id,
              text: '-'
            });
            return chrome.browserAction.setBadgeBackgroundColor({
              tabId: tab.id,
              color: [99, 99, 99, 255]
            });
          default:
            chrome.browserAction.setBadgeText({
              tabId: tab.id,
              text: "" + count
            });
            return chrome.browserAction.setBadgeBackgroundColor({
              tabId: tab.id,
              color: [96, 255, 0, 200]
            });
        }
      });
    } else {
      chrome.browserAction.setBadgeText({
        tabId: tab.id,
        text: ''
      });
      return chrome.browserAction.setBadgeBackgroundColor({
        tabId: tab.id,
        color: [99, 99, 99, 255]
      });
    }
  }
};
chrome.tabs.onUpdated.addListener(function(tabId, opt) {
  if (opt.status === 'loading') {
    return Manager.updateTab(tabId);
  }
});