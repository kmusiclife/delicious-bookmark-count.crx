// Original source code is as follow:
//   https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/lib/02-Utils.js
//   https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/lib/03-Timer.js
//   https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/lib/03-ExpireCache.js
//   https://github.com/hatena/hatena-bookmark-googlechrome-extension/blob/master/src/lib/04-HTTPCache.js


var $K = function(i) { return function() { return i } };

var p = function() {
    console.log(JSON.stringify(Array.prototype.slice.call(arguments, 0, arguments.length)));
}


var Timer = {
    get now() {
        return (new Date).getTime();
    },
    create: function(interval, repeatCount, Global) {
        var currentCount = 0;
        var interval = interval || 60; // ms
        var repeatCount = repeatCount || 0;
        if (!Global) Global = window;
        var _running = false;
        var sid;

        var timer = $({});
        jQuery.extend(timer, {
            start: function() {
                sid = Global.setInterval(function() {
                    timer.loop();
                }, interval);
            },
            reset: function() {
                timer.stop();
                currentCount = 0;
            },
            stop: function() {
                if (sid) Global.clearInterval(sid);
                sid = null;
            },
            get running() { return !!sid },
            loop: function() {
                if (!timer.running) return;

                currentCount++;
                if (repeatCount && currentCount >= repeatCount) {
                    timer.stop();
                    timer.trigger('timer', [currentCount]);
                    timer.trigger('timerComplete', [currentCount]);
                    return;
                }
                timer.trigger('timer', currentCount);
            },
        });
        return timer;
    }
}


var ExpireCache = function(key, defaultExpire, seriarizer, sweeperDelay) {
    this.key = key || 'default-key';
    this.defaultExpire = defaultExpire || 60 * 30; // 30分
    this.seriarizer = ExpireCache.Seriarizer[seriarizer];
    if (!sweeperDelay)
        sweeperDelay = 60 * 60 * 4; // 四時間
    this.sweeper = Timer.create(1000 * sweeperDelay);
    var self = this;
    this.sweeper.bind('timer', function() {
        self.sweepHandler();
    });
    this.sweeper.start();
}

ExpireCache.__defineGetter__('now', function() { return new Date-0 });

ExpireCache.shared = {};
ExpireCache.clearAllCaches = function() { ExpireCache.shared = {} };
ExpireCache.Seriarizer = {};
ExpireCache.Seriarizer.JSON = {
    seriarize: function(value) { return JSON.stringify(value) },
    deseriarize: function(value) { return JSON.parse(value) },
}

ExpireCache.prototype = {
    sweepHandler: function() {
        for (var key in this.cache) {
            this._update(key);
        }
    },
    get key() { return this._key },
    set key(value) {
        this._key = value || 'global';
        if (!ExpireCache.shared[this.sharedKey])
            ExpireCache.shared[this.sharedKey] = {};
    },
    get sharedKey() { return '_cache_' + this._key },
    get cache() {
        var c = ExpireCache.shared[this.sharedKey];
        if (c) {
            return c;
        } else {
            return (ExpireCache.shared[this.sharedKey] = {});
        }
    },
    deseriarize: function ExpireCache_deseriarize(value) {
        if (!this.seriarizer) return value;

        return this.seriarizer.deseriarize(value);
    },
    seriarize: function ExpireCache_seriarize(value) {
        if (!this.seriarizer) return value;

        return this.seriarizer.seriarize(value);
    },
    get: function ExpireCache_get (key) {
        return this.has(key) ? this.deseriarize(this.cache[key][0]) : null;
    },
    _update: function ExpireCache__update(key) {
        if (!this.cache[key]) return;
        var tmp = this.cache[key];
        if (ExpireCache.now >= tmp[1]) {
            delete this.cache[key]
        }
    },
    has: function ExpireCache_has(key) {
        this._update(key);
        return !!this.cache[key];
    },
    clear: function ExpireCache_clear(key) {
        if (this.cache[key]) {
            delete this.cache[key];
            return true;
        } else {
            return false;
        }
    },
    clearAll: function ExpireCache_clearAll() {
        delete ExpireCache.shared[this.sharedKey];
        ExpireCache.shared[this.sharedKey] = {};
    },
    set: function ExpireCache_set(key, value, expire) {
        if (!expire) expire = this.defaultExpire;
        var e = ExpireCache.now + (expire * 1000);
        this.cache[key] = [this.seriarize(value), e];
    },
}


var HTTPCache = function(key, options) {
    if (!options) options = {};
    this.options = options;
    this.cache = new ExpireCache('http-' + key, options.expire, options.seriarizer);
}

HTTPCache.prototype = {
    createURL: function HTTPCache_createURL (url) {
        if (this.options.encoder)
            url = this.options.encoder(url);

        if (this.options.createURL) {
            return this.options.createURL(url);
        } else {
            return (this.options.baseURL || '') + url;
        }
    },
    isValid: function(url) {
        return true;
    },
    get: function HTTPCache_get(url) {
        if (!this.isValid(url)) {
            return Deferred.next($K(null));
        }

        var cache = this.cache;
        if (cache.has(url)) {
            var val = cache.get(url);
            return Deferred.next($K(val));
        } else {
            var self = this;
            var d = new Deferred();
            $.get(this.createURL(url)).next(function(res) {
                d.call(self.setResCache(url, res));
            }).error(function(e) {
                cache.set(url, null);
                d.call(null);
            });
            return d;
        }
    },
    setResCache: function HTTPCache_setResCache(url, res) {
        var cache = this.cache;
        var val = res;
        if (this.options.json) {
            // ({foo: 'bar'}) な JSON 対策
            if (val.indexOf('(') == 0) {
                val = val.substring(1);
               val = val.substr(0, val.lastIndexOf(')'));
            }
            val = JSON.parse(val);
        }
        if (this.options.beforeSetFilter) {
            cache.set(url, this.options.beforeSetFilter(val));
        } else {
            cache.set(url, val);
        }
        p('http not using cache: ' + url);
        return cache.get(url);
    },
    clear: function HTTPCache_clear (url) {
        p('http cache clear: ' + url);
        return this.cache.clear(url);
    },
    clearAll: function HTTPCache_clearAll () {
        return this.cache.clearAll();
    },
    has: function HTTPCache_has (url) {
        return this.cache.has(url);
    }
}
