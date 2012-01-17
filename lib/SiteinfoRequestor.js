// Original Source code is as follow:
//  https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/content/widget_embedder.js

var SiteinfoRequestor = {
    init: function SR_init() {
        var self = SiteinfoRequestor;
        self.port = chrome.extension.connect();
        self.port.onMessage.addListener(self.onMessage);
        self.port.postMessage({
            message: 'get_siteinfo_for_url',
            data: { url: location.href },
        });
    },

    destroy: function SR_destroy() {
        var self = SiteinfoRequestor;
        // XXX Can we remove the listener 'onMessage'?
        self.port = null;
    },

    onMessage: function SR_onMessage(info) {
        var self = SiteinfoRequestor;
        switch (info.message) {
        case 'siteinfo_for_url':
            self.onGotSiteinfo(info.siteinfo);
            break;
        case 'siteinfos_with_xpath':
            self.onGotXPathSiteinfos(info.siteinfos);
            break;
        }
    },

    onGotSiteinfo: function SR_onGotSiteinfo(siteinfo) {
        var self = SiteinfoRequestor;
        if (siteinfo) {
            if (!siteinfo.disable)
                new WidgetEmbedder(siteinfo);
            self.destroy();
            return;
        }
        self.port.postMessage({ message: 'get_siteinfos_with_xpath' });
    },

    onGotXPathSiteinfos: function SR_onGotXPathSiteinfos(siteinfos) {
        var self = SiteinfoRequestor;
        for (var i = 0, n = siteinfos.length; i < n; i++) {
            var siteinfo = siteinfos[i];
            if (queryXPathOfType(siteinfo.domain, document,
                                 XPathResult.BOOLEAN_TYPE)) {
                if (!siteinfo.disable)
                    new WidgetEmbedder(siteinfo);
                break;
            }
        }
        self.destroy();
    },
};
