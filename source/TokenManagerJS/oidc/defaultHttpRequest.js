/**
 * @constructor
 */
function DefaultHttpRequest() {

    /**
     * @name _promiseFactory
     * @type object
     */

    /**
     * @param {XMLHttpRequest} xhr
     * @param {object.<string, string>} headers
     */
    function setHeaders(xhr, headers) {
        var keys = Object.keys(headers);

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var value = headers[key];

            xhr.setRequestHeader(key, value);
        }
    }

    /**
     * @param {string} url
     * @param {{ headers: object.<string, string> }} [config]
     * @returns {Promise}
     */
    this.getJSON = function (url, config) {
        var defer = _promiseFactory.create();

        try {
            var xhr = new XMLHttpRequest();
            xhr.open("GET", url);
            xhr.responseType = "json";

            if (config) {
                if (config.headers) {
                    setHeaders(xhr, config.headers);
                }
            }

            xhr.onload = function () {
                if (xhr.status === 200) {
                    var response = xhr.response;
                    if (typeof response === "string") {
                        response = JSON.parse(response);
                    }
                    defer.resolve(response);
                }
                else {
                    defer.reject(Error(xhr.statusText + "(" + xhr.status + ")"));
                }
            };

            xhr.onerror = function () {
                defer.reject(Error("Network error"));
            };

            xhr.send();

            return defer.promise;
        }
        catch (err) {
            return _promiseFactory.reject(err);
        }
    };

}