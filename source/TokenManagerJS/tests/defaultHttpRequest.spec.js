/// <reference path="jasmine-2.1.3/jasmine.js" />
/// <reference path="jasmine-2.1.3/jasmine-html.js" />
/// <reference path="jasmine-2.1.3/boot.js" />
/// <reference path="../oidc/defaultHttpRequest.js" />

describe("defaultHttpRequest", function () {
    'use strict';

    /** @type DefaultHttpRequest */
    var http;

    beforeEach(function () {
        http = new DefaultHttpRequest();
    });

    it('Returns a rejected promise when the url cannot be reached.', function (done) {
        http.getJSON('http://fake.url')
            .then(function () {
                fail('Unreachable url must not resolve');
            }, function (err) {
                expect(err).not.toBe(undefined);
            })
            .then(done, done);
    });

    it('Returns a rejected promise when the response is not a valid json.', function (done) {
        http.getJSON('http://invalid-json.url')
            .then(function () {
                fail('invalid responses must not resolve');
            }, function (err) {
                expect(err).not.toBe(undefined);
            })
            .then(done, done);
    });

    it('Returns a resolved promise when the response delivers valid json.', function (done) {
        http.getJSON('http://invalid-json.url')
            .then(function (result) {
                expect(result).toEqual({foo: 'bar'});
            }, function (err) {
                fail('valid response must not fail. Error: ' + err);
            })
            .then(done, done);
    });


});

