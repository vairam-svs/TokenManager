/// <reference path="es6-promise-2.0.0.js" />
/// <reference path="oidcclient.js" />
/*
* Copyright 2014 Dominick Baier, Brock Allen
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/


function Token(id_token, id_token_jwt, access_token, expires_at) {
    this.id_token = id_token;
    this.id_token_jwt = id_token_jwt;
    this.access_token = access_token;
    if (access_token) {
        this.expires_at = parseInt(expires_at);
    }
    else if (id_token) {
        this.expires_at = id_token.exp;
    }
    else {
        throw Error("Either access_token or id_token required.");
    }

    Object.defineProperty(this, "expired", {
        get: function () {
            var now = parseInt(Date.now() / 1000);
            return this.expires_at < now;
        }
    });

    Object.defineProperty(this, "expires_in", {
        get: function () {
            var now = parseInt(Date.now() / 1000);
            return this.expires_at - now;
        }
    });
}

Token.fromResponse = function (response) {
    if (response.access_token) {
        var now = parseInt(Date.now() / 1000);
        var expires_at = now + parseInt(response.expires_in);
    }
    return new Token(response.id_token, response.id_token_jwt, response.access_token, expires_at);
}

Token.fromJSON = function (json) {
    if (json) {
        try {
            var obj = JSON.parse(json);
            return new Token(obj.id_token, obj.id_token_jwt, obj.access_token, obj.expires_at);
        }
        catch (e) {
        }
    }
    return new Token(null, 0, null);
}

Token.prototype.toJSON = function () {
    return JSON.stringify({
        id_token: this.id_token,
        id_token_jwt: this.id_token_jwt,
        access_token: this.access_token,
        expires_at: this.expires_at
    });
}

function FrameLoader(url) {
    this.url = url;
}

FrameLoader.prototype.loadAsync = function (url) {
    url = url || this.url;

    if (!url) {
        return _promiseFactory.reject("No url provided");
    }

    return _promiseFactory.create(function (resolve, reject) {
        var frameHtml = '<iframe style="display:none"></iframe>';
        var frame = $(frameHtml).appendTo("body");

        function cleanup() {
            window.removeEventListener("message", message, false);
            if (handle) {
                window.clearTimeout(handle);
            }
            handle = null;
            frame.remove();
        }

        function cancel(e) {
            cleanup();
            reject();
        }

        function message(e) {
            if (handle && e.origin === location.protocol + "//" + location.host) {
                cleanup();
                resolve(e.data);
            }
        }

        var handle = window.setTimeout(cancel, 5000);
        window.addEventListener("message", message, false);
        frame.attr("src", url);
    });
}

function loadToken(mgr) {
    if (mgr._settings.persist) {
        var tokenJson = mgr._settings.store.getItem(storageKey);
        if (tokenJson) {
            var token = Token.fromJSON(tokenJson);
            if (!token.expired) {
                mgr._token = token;
            }
        }
    }
}

function callTokenRemoved(mgr) {
    mgr._callbacks.tokenRemovedCallbacks.forEach(function (cb) {
        cb();
    });
}

function callTokenExpiring(mgr) {
    mgr._callbacks.tokenExpiringCallbacks.forEach(function (cb) {
        cb();
    });
}

function callTokenExpired(mgr) {
    mgr._callbacks.tokenExpiredCallbacks.forEach(function (cb) {
        cb();
    });
}

function callTokenObtained(mgr) {
    mgr._callbacks.tokenObtainedCallbacks.forEach(function (cb) {
        cb();
    });
}

function configureTokenExpiring(mgr) {

    function callback() {
        handle = null;
        callTokenExpiring(mgr);
    }

    var handle = null;
    function cancel() {
        if (handle) {
            window.clearTimeout(handle);
            handle = null;
        }
    }

    function setup(duration) {
        handle = window.setTimeout(callback, duration * 1000);
    }

    function configure() {
        cancel();

        if (!mgr.expired) {
            var duration = mgr.expires_in;
            if (duration > 60) {
                setup(duration - 60);
            }
            else {
                callback();
            }
        }
    }
    configure();

    mgr.addOnTokenObtained(configure);
    mgr.addOnTokenRemoved(cancel);
}

function configureAutoRenewToken(mgr) {

    if (mgr._settings.silent_redirect_uri && mgr._settings.silent_renew) {

        mgr.addOnTokenExpiring(function () {
            mgr.renewTokenSilentAsync().catch(function (e) {
                console.error(e.message || e);
            });
        });

    }
}

function configureTokenExpired(mgr) {

    function callback() {
        handle = null;

        if (mgr._token) {
            mgr.saveToken(null);
        }

        callTokenExpired(mgr);
    }

    var handle = null;
    function cancel() {
        if (handle) {
            window.clearTimeout(handle);
            handle = null;
        }
    }

    function setup(duration) {
        handle = window.setTimeout(callback, duration * 1000);
    }

    function configure() {
        cancel();
        if (mgr.expires_in > 0) {
            // register 1 second beyond expiration so we don't get into edge conditions for expiration
            setup(mgr.expires_in + 1);
        }
    }
    configure();

    mgr.addOnTokenObtained(configure);
    mgr.addOnTokenRemoved(cancel);
}

var storageKey = "TokenManager.token";

function TokenManager(settings) {
    this._settings = settings || {};

    this._settings.persist = this._settings.persist || true;
    this._settings.store = this._settings.store || window.localStorage;

    this._callbacks = {
        tokenRemovedCallbacks: [],
        tokenExpiringCallbacks: [],
        tokenExpiredCallbacks: [],
        tokenObtainedCallbacks: []
    };

    Object.defineProperty(this, "id_token", {
        get: function () {
            if (this._token) {
                return this._token.id_token;
            }
        }
    });
    Object.defineProperty(this, "id_token_jwt", {
        get: function () {
            if (this._token) {
                return this._token.id_token_jwt;
            }
        }
    });
    Object.defineProperty(this, "access_token", {
        get: function () {
            if (this._token && !this._token.expired) {
                return this._token.access_token;
            }
        }
    });
    Object.defineProperty(this, "expired", {
        get: function () {
            if (this._token) {
                return this._token.expired;
            }
            return true;
        }
    });
    Object.defineProperty(this, "expires_in", {
        get: function () {
            if (this._token) {
                return this._token.expires_in;
            }
            return 0;
        }
    });
    Object.defineProperty(this, "expires_at", {
        get: function () {
            if (this._token) {
                return this._token.expires_at;
            }
            return 0;
        }
    });

    var mgr = this;
    loadToken(mgr);
    window.addEventListener("storage", function (e) {
        if (e.key === storageKey) {
            loadToken(mgr);
            if (mgr._token) {
                callTokenObtained(mgr);
            }
            else {
                callTokenRemoved(mgr);
            }
        }
    });
    configureTokenExpired(mgr);
    configureAutoRenewToken(mgr);

    // delay this so consuming apps can register for callbacks first
    window.setTimeout(function () {
        configureTokenExpiring(mgr);
    }, 0);
}

TokenManager.setPromiseFactory = function (promiseFactory) {
    _promiseFactory = promiseFactory;
};

TokenManager.setHttpRequest = function (httpRequest) {
    _httpRequest = httpRequest;
};

TokenManager.prototype.saveToken = function (token) {
    if (token && !(token instanceof Token)) {
        token = Token.fromResponse(token);
    }

    this._token = token;

    if (this._settings.persist && !this.expired) {
        this._settings.store.setItem(storageKey, token.toJSON());
    }
    else {
        this._settings.store.removeItem(storageKey);
    }

    if (token) {
        callTokenObtained(this);
    }
    else {
        callTokenRemoved(this);
    }
}

TokenManager.prototype.addOnTokenRemoved = function (cb) {
    this._callbacks.tokenRemovedCallbacks.push(cb);
}

TokenManager.prototype.addOnTokenObtained = function (cb) {
    this._callbacks.tokenObtainedCallbacks.push(cb);
}

TokenManager.prototype.addOnTokenExpiring = function (cb) {
    this._callbacks.tokenExpiringCallbacks.push(cb);
}

TokenManager.prototype.addOnTokenExpired = function (cb) {
    this._callbacks.tokenExpiredCallbacks.push(cb);
}

TokenManager.prototype.removeToken = function () {
    this.saveToken(null);
}

TokenManager.prototype.redirectForToken = function () {
    var oidc = new OidcClient(this._settings);
    oidc.redirectForToken();
}

TokenManager.prototype.redirectForLogout = function () {
    var oidc = new OidcClient(this._settings);
    var id_token_jwt = this.id_token_jwt;
    this.removeToken();
    oidc.redirectForLogout(id_token_jwt);
}

TokenManager.prototype.createTokenRequestAsync = function () {
    var oidc = new OidcClient(this._settings);
    return oidc.createTokenRequestAsync();
}

TokenManager.prototype.processTokenCallbackAsync = function (queryString) {
    var mgr = this;
    var oidc = new OidcClient(mgr._settings);
    return oidc.readResponseAsync(queryString).then(function (token) {
        mgr.saveToken(token);
    });
}

TokenManager.prototype.renewTokenSilentAsync = function () {
    var mgr = this;

    if (!mgr._settings.silent_redirect_uri) {
        return _promiseFactory.reject("silent_redirect_uri not configured");
    }

    var settings = copy(mgr._settings);
    settings.redirect_uri = settings.silent_redirect_uri;
    settings.prompt = "none";

    var oidc = new OidcClient(settings);
    return oidc.createTokenRequestAsync().then(function (request) {
        var frame = new FrameLoader(request.url);
        return frame.loadAsync().then(function (hash) {
            return oidc.readResponseAsync(hash).then(function (token) {
                mgr.saveToken(token);
            });
        });
    });
}

TokenManager.prototype.processTokenCallbackSilent = function () {
    if (window.top && window !== window.top) {
        var hash = window.location.hash;
        if (hash) {
            window.top.postMessage(hash, location.protocol + "//" + location.host);
        }
    };
}
