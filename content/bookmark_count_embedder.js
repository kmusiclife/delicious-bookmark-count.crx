var WidgetEmbedder, getBookmarkCount, getEntryURL, httpGet;
Deferred.debug = true;
getEntryURL = function(url) {
  return "http://delicious.com/url/" + (hex_md5(url));
};
httpGet = function(url) {
  var d, req;
  req = new XMLHttpRequest();
  req.open("GET", url, true);
  d = new Deferred;
  req.onreadystatechange = function() {
    var json;
    if (req.readyState === 4) {
      if (req.status === 200) {
        json = (function() {
          try {
            return JSON.parse(req.responseText);
          } catch (e) {
            return {};
          }
        })();
        return d.call(json);
      } else {
        return console.log("fetch failed: (" + req.status + ") " + url);
      }
    }
  };
  req.send(null);
  return d;
};
getBookmarkCount = function(url) {
  return httpGet("http://feeds.delicious.com/v2/json/urlinfo/" + (hex_md5(url))).next(function(data) {
    var _ref;
    return data != null ? (_ref = data[0]) != null ? _ref.total_posts : void 0 : void 0;
  });
};
WidgetEmbedder = (function() {
  function WidgetEmbedder(siteinfo) {
    this.siteinfo = siteinfo;
    this.embedLater(WidgetEmbedder.INITIAL_DELAY);
    document.addEventListener('DOMNodeInserted', this, false);
    document.addEventListener('AutoPagerize_DOMNodeInserted', this, false);
    document.addEventListener('AutoPatchWork.DOMNodeInserted', this, false);
  }
  return WidgetEmbedder;
})();
extend(WidgetEmbedder, {
  INITIAL_DELAY: 20,
  MUTATION_DELAY: 100
});
WidgetEmbedder.messages = {
  SHOW_ENTRY_TEXT: '[Show on Delicious]',
  SHOW_ENTRY_TITLE: 'Show This Entry on Delicious'
};
extend(WidgetEmbedder.prototype, {
  embedLater: function(delay) {
    if (this.timerId) {
      return;
    }
    return this.timerId = setTimeout(function(self) {
      self.embed();
      return self.timerId = 0;
    }, delay, this);
  },
  embed: function() {
    return queryXPathAll(this.siteinfo.paragraph).forEach(this.embedInParagraph, this);
  },
  embedInParagraph: function(paragraph) {
    var link, point;
    if (paragraph._hb_isWidgetEmbedded) {
      return;
    }
    paragraph._hb_isWidgetEmbedded = true;
    link = this.getLink(paragraph);
    if (!link || !/^https?:/.test(link.href)) {
      return;
    }
    point = this.getAnnotationPoint(paragraph, link);
    if (!point) {
      return;
    }
    return this.createWidgets(link).next(function(widgets) {
      point.insertNode(widgets);
      return point.detach();
    });
  },
  getLink: function(paragraph) {
    var a, link, node, url, xpath;
    xpath = this.siteinfo.link || ".";
    if (xpath === "__location__") {
      url = location.href;
      node = paragraph;
      while (node) {
        if (node._hb_baseURL) {
          url = node._hb_baseURL;
          break;
        }
        node = node.parentNode;
      }
      a = document.createElement("a");
      a.href = url;
      return a;
    }
    link = queryXPath(xpath, paragraph);
    if (link && link.href) {
      return link;
    } else {
      return null;
    }
  },
  getAnnotationPoint: function(paragraph, link) {
    var anchor, annotation, existing, point, position;
    existing = this.getExistingWidgets(paragraph, link);
    if (existing.counter) {
      return null;
    }
    point = document.createRange();
    anchor = existing.entry || existing.comments || existing.addButton;
    if (anchor) {
      point.selectNode(anchor);
      point.collapse(anchor !== existing.entry);
      return point;
    }
    annotation = (this.siteinfo.annotation ? queryXPath(this.siteinfo.annotation, paragraph) : link);
    if (!annotation) {
      return null;
    }
    position = (this.siteinfo.annotationPosition || "").toLowerCase();
    if (!position) {
      switch (annotation.localName) {
        case "a":
        case "br":
        case "hr":
        case "img":
        case "canvas":
        case "object":
        case "input":
        case "button":
        case "select":
        case "textarea":
          position = "after";
          break;
        default:
          position = "last";
      }
    }
    if (position === "before" || position === "after") {
      point.selectNode(annotation);
    } else {
      point.selectNodeContents(annotation);
    }
    point.collapse(position === "before" || position === "start");
    return point;
  },
  getExistingWidgets: function(paragraph, link) {
    var widgets;
    return widgets = {
      entry: null,
      counter: null,
      comments: null,
      addButton: null
    };
  },
  createWidgets: function(link) {
    var url;
    url = link.href;
    return getBookmarkCount(url).next(function(count) {
      var widgets, _link;
      widgets = document.createDocumentFragment();
      widgets.appendChild(document.createTextNode(' '));
      _link = E('a', {
        href: getEntryURL(url),
        "class": 'delicious-bookmark-count'
      }, document.createTextNode("" + (count ? count + ' users' : '')));
      if (count >= 5) {
        _link = E('strong', {}, _link);
      } else if (count >= 3) {
        _link = E('em', {}, _link);
      }
      widgets.appendChild(_link);
      return widgets;
    });
  },
  handleEvent: function(event) {
    switch (event.type) {
      case "AutoPagerize_DOMNodeInserted":
      case "AutoPatchWork.DOMNodeInserted":
        document.removeEventListener("DOMNodeInserted", this, false);
        return event.target._hb_baseURL = event.newValue;
      case "DOMNodeInserted":
        return this.embedLater(WidgetEmbedder.MUTATION_DELAY);
    }
  }
});
if (window.top === window.self) {
  SiteinfoRequestor.init();
}