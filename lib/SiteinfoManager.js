// Original source code is as follow:
//   https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/lib/10-SiteinfoManager.js

var SiteinfoManager = $({});

$.extend(SiteinfoManager, {
    init: function SM_init() {
        // console.log('SiteinfoManager loaded');
        var self = SiteinfoManager;
        self.updateTimer = setInterval(self.updateSiteinfos, 10 * 60 * 1000);
    },

    getSiteinfoForURL: function SM_getSiteinfoForURL(url) {
        var self = SiteinfoManager;
        var list = self.siteinfosList;
        for (var i = 0; i < list.length; i++) {
            var siteinfos = list[i].data;
            for (var j = 0, n = siteinfos.length; j < n; j++) {
                var siteinfo = siteinfos[j];
                var pattern = siteinfo.domainPattern;
                if (!pattern) {
                    try {
                        pattern = siteinfo.domainPattern =
                            new RegExp(siteinfo.domain);
                    } catch (ex) {
                        siteinfos.splice(j, 1);
                        j--;
                        n--;
                        continue;
                    }
                }
                if (pattern.test(url))
                    return siteinfo;
            }
        }
        return null;
    },

    getSiteinfosWithXPath: function SM_getSiteinfosWithXPath() {
        var self = SiteinfoManager;
        var a = [];
        return a.concat.apply(a, self.siteinfosList.map(function (details) {
            return details.xpathData || a;
        }));
    },

    sendSiteinfoForURL: function SM_sendSiteinfoForURL(url, port) {
        console.log('received siteinfo request for ' + url);
        var self = SiteinfoManager;
        port.postMessage({
            message: 'siteinfo_for_url',
            siteinfo: self.getSiteinfoForURL(url),
        });
    },

    sendSiteinfosWithXPath: function SM_sendSiteinfosWithXPath(port) {
        var self = SiteinfoManager;
        port.postMessage({
            message: 'siteinfos_with_xpath',
            siteinfos: self.getSiteinfosWithXPath(),
        });
    },

    siteinfosList: [],
    storage: localStorage,

    CACHE_KEY_PREFIX: 'SiteinfoCache.',

    addSiteinfos: function SM_addSiteinfos(details) {
        var self = SiteinfoManager;
        if (details.key) {
            var cache = self.storage[self.CACHE_KEY_PREFIX + details.key];
            if (cache) {
                console.log(details.key + ' cache size: ' + cache.length);
                cache = JSON.parse(cache);
                details.data = cache.data;
                details.lastUpdated = cache.lastUpdated;
                if (cache.xpathData)
                    details.xpathData = cache.xpathData;
                console.log('load siteinfo from cache ' + details.key);
            }
        }
        if (!details.data)
            details.data = [];
        self.siteinfosList.push(details);
        self.updateSiteinfos();
    },

    UPDATE_INTERVAL: 24 * 60 * 60 * 1000,

    updateSiteinfos: function SM_updateSiteinfos() {
        var self = SiteinfoManager;
        self.siteinfosList.forEach(function (details) {
            if (!details.urls) return;
            if (!details.lastUpdated ||
                details.lastUpdated + self.UPDATE_INTERVAL < Date.now())
                self.fetchSiteinfos(details.urls.concat(), details);
        });
    },

    REQUEST_TIMEOUT: 3 * 60 * 1000,

    fetchSiteinfos: function SM_fetchSiteinfos(urls, details) {
        if (details.isLoading) return;
        details.isLoading = true;
        var self = SiteinfoManager;
        var url = urls.shift();
        $.get(url).next(function (data) {
            console.log('success')
            data = JSON.parse(data);
            console.log('load siteinfo from ' + url);
            details.isLoading = false;
            if (details.converter)
                data = details.converter.convert(data, details);
            details.data = data;
            details.lastUpdated = Date.now();
            if (details.key) {
                self.storage[self.CACHE_KEY_PREFIX + details.key] =
                    JSON.stringify(details);
            }
        }).error(function (e) {
            console.log('Siteinfos fetch error: ' + e) // XXX
            details.isLoading = false;
            if (urls.length)
                self.fetchSiteinfos(urls, details);
        });
    },
});


SiteinfoManager.LDRizeConverter = {
    convert: function SM_LDR_convert(data, details) {
        var urlPatternPattern = /^\^?http(?:s\??)?:/;
        var evaluator = new XPathEvaluator();
        details.xpathData = [];
        return data.map(function (detaildData) {
            return detaildData.data;
        }).filter(function (data) {
            if (!data.domain) return false;
            if (urlPatternPattern.test(data.domain)) return true;
            try {
                evaluator.createExpression(data.domain, null);
                details.xpathData.push(data);
                return false;
            } catch (ex) {}
            try {
                new RegExp(data.domain);
                return true;
            } catch (ex) {}
            return false;
        });
    },
};


SiteinfoManager.init();
