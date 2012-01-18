// Original Source code is as follow:
//  https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/content/widget_embedder.js

function extend(dest, src) {
    for (var i in src)
        dest[i] = src[i];
    return dest;
}

function queryXPath(xpath, context) {
    return queryXPathOfType(xpath, context,
                            XPathResult.FIRST_ORDERED_NODE_TYPE);
}

function queryXPathAll(xpath, context) {
    return queryXPathOfType(xpath, context,
                            XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE);
}

function queryXPathOfType(xpath, context, type) {
    context = context || document;
    var doc = context.ownerDocument || context;
    var result = doc.evaluate(xpath, context, null, type, null);

    switch (result.resultType) {
    case XPathResult.UNORDERED_NODE_SNAPSHOT_TYPE:
    case XPathResult.ORDERED_NODE_SNAPSHOT_TYPE:
        var nodes = [];
        for (var i = 0, n = result.snapshotLength; i < n; i++)
            nodes.push(result.snapshotItem(i));
        return nodes;
    case XPathResult.ANY_UNORDERED_NODE_TYPE:
    case XPathResult.FIRST_ORDERED_NODE_TYPE:
        return result.singleNodeValue;

    case XPathResult.NUMBER_TYPE:  return result.numberValue;
    case XPathResult.STRING_TYPE:  return result.stringValue;
    case XPathResult.BOOLEAN_TYPE: return result.booleanValue;
    case XPathResult.UNORDERED_NODE_ITERATOR_TYPE:
    case XPathResult.ORDERED_NODE_ITERATOR_TYPE:
        return result;
    }
    throw new Error("Unknown XPath result type.");
}

function E(name, attrs) {
    var element = document.createElement(name);
    for (var a in attrs)
        element.setAttribute(a, attrs[a]);
    for (var i = 2, n = arguments.length; i < n; i++) {
        var child = arguments[i];
        if (!child.nodeType)
            child = document.createTextNode(child);
        element.appendChild(child);
    }
    return element;
}
