/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

var should = require("should");
var sinon = require("sinon");
var url = require('url');
var googleNode = require("../../google/google.js");
var helper = require("node-red-node-test-helper");
var nock = require("nock");

describe('google nodes', function() {

    beforeEach(function (done) { helper.startServer(done); });

    afterEach(function(done) {
        if (nock) { nock.cleanAll(); }
        helper.unload();
        helper.stopServer(done);
    });

    describe("google credentials", function() {
        if (!nock) {
        	return;
        }
        it("should complete oauth dance", function(done) {
            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"},
            ], function() {
                var scope = nock('https://accounts.google.com:443')
                    .post('/o/oauth2/token',
                        "grant_type=authorization_code&code=CODE&client_id=CLIENT&client_secret=SECRET&redirect_uri=http%3A%2F%2Flocalhost%3A1880%2Fgoogle-credentials%2Fauth%2Fcallback")
                    .reply(200, {"access_token":"ACCESS","token_type":"Bearer","expires_in":3600,"id_token":"TOKEN","refresh_token":"REFRESH"}, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                nock('https://www.googleapis.com:443')
                    .get('/plus/v1/people/me')
                    .reply(200, {
                        "displayName" : "Foo Bar"
                    }, {
                        date: 'Mon, 10 Nov 2014 08:21:31 GMT',
                        'content-type': 'application/json; charset=UTF-8'
                    });
                helper.request()
                    .get('/google-credentials/auth?id=google-config&clientId=CLIENT&clientSecret=SECRET&callback=http://localhost:1880/google-credentials/auth/callback')
                    .expect(302)
                    .expect('Location', /https:\/\/accounts\.google\.com\/o\/oauth2\/auth\?response_type=code&client_id=CLIENT&state=([^&]*)&access_type=offline&approval_prompt=force&scope=profile%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fcalendar%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.login%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fplus.me%20https%3A%2F%2Fwww.googleapis.com%2Fauth%2Fuserinfo.profile&redirect_uri=http%3A%2F%2Flocalhost%3A1880%2Fgoogle-credentials%2Fauth%2Fcallback/)
                    .end(function(err, res) {
                        if (err) {
                        	return done(err);
                        }
                        var location = url.parse(res.headers.location, true);
                        var state = location.query.state;
                        helper.request()
                            .get('/google-credentials/auth/callback?code=CODE&state='+state)
                            .expect(200)
                            .end(function(err, res) {
                                if (err) {
                                	return done(err);
                                }
                                helper.credentials.get("google-config")
                                    .should.have.property('displayName','Foo Bar');
                                done();
                            });
                    });
            });
        });

        it("should refresh oauth token", function(done) {
            var nowSeconds = (new Date()).getTime()/1000;
            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"}
            ], {
                "google-config": {
                    clientId: "ID",
                    clientSecret: "SECRET",
                    accessToken: "TOKEN",
                    refreshToken: "REFRESH",
                    expireTime: nowSeconds-1000
                }
            }, function() {
                nock('https://accounts.google.com:443')
                    .post('/o/oauth2/token',
                        "grant_type=refresh_token&client_id=ID&client_secret=SECRET&refresh_token=REFRESH")
                    .reply(200, {
                        access_token: "ACCESS",
                        token_type: "Bearer",
                        expires_in: 3600,
                        id_token: "TOKEN",
                        refresh_token: "REFRESH"
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                var google = helper.getNode("google-config");
                google.should.have.property('id', 'google-config');
                var cred = helper.credentials.get("google-config");
                cred.should.have.property('expireTime').below(nowSeconds);
                google.refreshToken(function() {
                    var cred = helper.credentials.get("google-config");
                    cred.should.have.property('expireTime').above(nowSeconds);
                    done();
                });
            });
        });

        it("should refresh oauth token before request", function(done) {
            var nowSeconds = (new Date()).getTime()/1000;
            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"}
            ], {
                "google-config": {
                    clientId: "ID",
                    clientSecret: "SECRET",
                    accessToken: "TOKEN",
                    refreshToken: "REFRESH",
                    expireTime: nowSeconds-1000
                }
            }, function() {
                nock('https://accounts.google.com:443')
                    .post('/o/oauth2/token',
                        "grant_type=refresh_token&client_id=ID&client_secret=SECRET&refresh_token=REFRESH")
                    .reply(200, {
                        access_token: "ACCESS",
                        token_type: "Bearer",
                        expires_in: 3600,
                        id_token: "TOKEN",
                        refresh_token: "REFRESH"
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                nock('https://www.googleapis.com:443')
                    .get('/calendar/v3/users/me/calendarList')
                    .reply(200, {
                        kind: "calendar#calendarList"
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                var google = helper.getNode("google-config");
                google.should.have.property('id', 'google-config');
                var cred = helper.credentials.get("google-config");
                cred.should.have.property('expireTime').below(nowSeconds);
                google.request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function (err, data) {
                    var cred = helper.credentials.get("google-config");
                    cred.should.have.property('expireTime').above(nowSeconds);
                    data.should.have.property('kind', "calendar#calendarList");
                    done();
                });
            });
        });

        it("should report failed token refresh to the caller", function(done) {
            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"}
            ], {
                "google-config": {
                    clientId: "ID",
                    clientSecret: "SECRET",
                    accessToken: "TOKEN",
                    refreshToken: "REFRESH",
                    expireTime: 0
                }
            }, function() {
                nock('https://accounts.google.com:443')
                    .persist()
                    .post('/o/oauth2/token',
                        "grant_type=refresh_token&client_id=ID&client_secret=SECRET&refresh_token=REFRESH")
                    .reply(500, {
                        error: "Service temporary unavailable."
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                var google = helper.getNode("google-config");
                var clock = sinon.useFakeTimers({'toFake': ['setTimeout', 'Date']});
                google.eventEmitter.on('retry', function(delay) {
                    clock.tick(delay);
                });
                google.request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function (err, data) {
                    should.exist(err);
                    clock.restore();
                    done();
                });
            });
        });

        it("should retry failed token refresh multiple times, using exponential backoff strategy", function(done) {
            // API calls should be retried after these delays. In worst case, it will take 82 seconds to retry
            // calling the API last time (5th times in the series).
            var backoffTimes = [0, 100, 900, 8100, 72900];

            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"}
            ], {
                "google-config": {
                    clientId: "ID",
                    clientSecret: "SECRET",
                    accessToken: "TOKEN",
                    refreshToken: "REFRESH",
                    expireTime: 0
                }
            }, function() {
                nock('https://accounts.google.com:443')
                    .persist()
                    .post('/o/oauth2/token',
                        "grant_type=refresh_token&client_id=ID&client_secret=SECRET&refresh_token=REFRESH")
                    .reply(500, function() {
                        apiCalls.push(Date.now());
                        return {
                            error: "Service temporary unavailable."
                        };
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                var google = helper.getNode("google-config");
                var clock = sinon.useFakeTimers({'toFake': ['setTimeout', 'Date']});
                var apiCalls = [], startTime = Date.now();
                var roundTo = function(n, digits) {
                    var multiplicator = Math.pow(10, digits);
                    return Math.round(n / multiplicator) * multiplicator;
                };
                google.eventEmitter.on('retry', function() {
                    clock.tick(backoffTimes[apiCalls.length]);
                });
                google.request('https://accounts.google.com/o/oauth2/token', function (err, data) {
                    var diffInMilliseconds = [];
                    apiCalls.forEach(function(timestamp) {
                        diffInMilliseconds.push(roundTo(timestamp - startTime, 2));
                        startTime = timestamp;
                    });
                    backoffTimes.should.be.eql(diffInMilliseconds);
                    clock.restore();
                    done();
                });
            });

        });

        it("should retry failed api requests multiple times, using exponential backoff strategy", function(done) {
            // API calls should be retried after these delays. In worst case, it will take 82 seconds to retry
            // calling the API last time (5th times in the series).
            var backoffTimes = [0, 100, 900, 8100, 72900];

            helper.load(googleNode, [
                {id:"google-config", type:"google-credentials"}
            ], {
                "google-config": {
                    clientId: "ID",
                    clientSecret: "SECRET",
                    accessToken: "TOKEN",
                    refreshToken: "REFRESH",
                    expireTime: Date.now() + 2000
                }
            }, function() {
                nock('https://www.googleapis.com:443')
                    .persist()
                    .get('/any-resource')
                    .reply(500, function() {
                        apiCalls.push(Date.now());
                        return {
                            error: "Service temporary unavailable."
                        };
                    }, {
                        'content-type': 'application/json; charset=utf-8',
                        date: 'Mon, 10 Nov 2014 08:21:30 GMT',
                        'transfer-encoding': 'chunked'
                    });
                var google = helper.getNode("google-config");
                var clock = sinon.useFakeTimers({'toFake': ['setTimeout', 'Date']});
                var apiCalls = [], startTime = Date.now();
                var roundTo = function(n, digits) {
                    var multiplicator = Math.pow(10, digits);
                    return Math.round(n / multiplicator) * multiplicator;
                };
                google.eventEmitter.on('retry', function() {
                    clock.tick(backoffTimes[apiCalls.length]);
                });
                google.request('https://www.googleapis.com/any-resource', function (err, data) {
                    var diffInMilliseconds = [];
                    apiCalls.forEach(function(timestamp) {
                        diffInMilliseconds.push(roundTo(timestamp - startTime, 2));
                        startTime = timestamp;
                    });
                    backoffTimes.should.be.eql(diffInMilliseconds);
                    clock.restore();
                    data.error.message.should.be.eql({error: 'Service temporary unavailable.'});
                    done();
                });
            });

        });

    });
});
