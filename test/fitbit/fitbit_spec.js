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
var sinon = require('sinon');
var fitbitNode = require("../../fitbit/fitbit.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('fitbit nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    describe('out node', function() {

        if (nock) {

            it('can do oauth dance', function(done) {
                helper.load(fitbitNode, [{id:"n1", type:"helper", wires:[["n2"]]},{id:"n4", type:"fitbit-credentials"},{id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],dataType:"sleep"},{id:"n3", type:"helper"}], function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .post('/oauth/request_token')
                        // TODO check request headers
                        .reply(200, "oauth_token=0123&oauth_token_secret=4567&oauth_callback_confirmed=true",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '70',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               })
                        .post('/oauth/access_token')
                    // TODO check request headers
                        .reply(200, "oauth_token=01234&oauth_token_secret=56789&encoded_user_id=foobar",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '65',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               })
                        .get('/1/user/-/profile.json')
                        .reply(200, {
                            "user" : {
                                "startDayOfWeek" : "SUNDAY",
                                "locale" : "en_GB",
                                "fullName" : "Foo Bar",
                            }
                        }, {
                            'fitbit-rate-limit-limit': '150',
                            'fitbit-rate-limit-remaining': '148',
                            'fitbit-rate-limit-reset': '2216',
                            'content-type': 'application/json;charset=UTF-8',
                            'content-language': 'en',
                            'date': 'Mon, 29 Sep 2014 21:23:03 GMT',
                            'connection': 'close' });
                    helper.request()
                        .get('/fitbit-credentials/n4/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/n4/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) return done(err);
                            helper.request()
                                .get('/fitbit-credentials/n4/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) return done(err);
                                    helper.credentials.get("n4")
                                        .should.have.property('username',
                                                              'Foo Bar');
                                    done();
                                });
                        });
                });
            });

            it('can fetch sleep data', function(done) {
                helper.load(fitbitNode,
                            [{id:"n1", type:"helper", wires:[["n2"]]},
                             {id:"n4", type:"fitbit-credentials", username: "Bob"},
                             {id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],
                              dataType:"sleep"},
                             {id:"n3", type:"helper"}],
                            {
                                "n4": { client_key: "fade",
                                        client_secret: "face",
                                        access_token: "beef",
                                        access_token_secret: "feed",
                                        username: "Bob",
                                      },
                            }, function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .get('/1/user/-/sleep/date/2014-09-29.json')
                        .reply(200, {
                            "sleep": [ {
                            "duration": 25560000,
                            "efficiency": 96,
                            "isMainSleep": true,
                            "logId": 254,
                            "startTime": "2014-09-28T23:22:00.000",
                        }],
                        "summary": {
                            "totalMinutesAsleep": 399,
                            "totalSleepRecords": 1,
                            "totalTimeInBed": 426
                        }
                    }, {
                        'fitbit-rate-limit-limit': '150',
                        'fitbit-rate-limit-remaining': '148',
                        'fitbit-rate-limit-reset': '2216',
                        'content-type': 'application/json;charset=UTF-8',
                        'content-language': 'en',
                        'date': 'Mon, 29 Sep 2014 21:23:03 GMT',
                        'connection': 'close' });
                    var n1 = helper.getNode("n1");
                    var n2 = helper.getNode("n2");
                    var n3 = helper.getNode("n3");
                    n2.should.have.property('id', 'n2');
                    n1.send({ date: "2014-09-29" });
                    n3.on('input', function(msg) {
                        var sleep = msg.payload;
                        sleep.should.have.property("duration", 25560000);
                        sleep.should.have.property("efficiency", 96);
                        sleep.should.have.property("isMainSleep", true);
                        should.deepEqual(sleep, msg.data.sleep[0]);
                        done();
                    });
               });
            });

            it('can fetch badge data', function(done) {
                helper.load(fitbitNode,
                            [{id:"n1", type:"helper", wires:[["n2"]]},
                             {id:"n4", type:"fitbit-credentials", username: "Bob"},
                             {id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],
                              dataType:"badges"},
                             {id:"n3", type:"helper"}],
                            {
                                "n4": { client_key: "fade",
                                        client_secret: "face",
                                        access_token: "beef",
                                        access_token_secret: "feed",
                                        username: "Bob",
                                      },
                            }, function() {
                var scope = nock('https://api.fitbit.com:443')
                    .get('/1/user/-/badges.json')
                    .reply(200, {
                        "badges" : [
                            {
                                "timesAchieved" : 6,
                                "value" : 5000,
                                "name" : "daily 5,000 step",
                                "dateTime" : "2014-09-29",
                                "marketingDescription" : "You walked over 5,000 steps today! Congrats on earning your first step badge! You're halfway to earning the next one.",
                                "badgeType" : "DAILY_STEPS",
                                "earnedMessage" : "Congrats on earning your first daily 5,000 steps badge!",
                            },
                            {
                                "timesAchieved" : 3,
                                "value" : 10000,
                                "name" : "daily 10,000 step",
                                "dateTime" : "2014-09-28",
                                "marketingDescription" : "Congrats! You've walked 10,000 steps today! Way to go, that's the recommended number of daily steps! Think you could make it to 15,000 for another badge?",
                                "badgeType" : "DAILY_STEPS",
                                "earnedMessage" : "Congrats on earning your first daily 10,000 steps badge!",
                            }
                        ],
                        "summary": {
                            "totalMinutesAsleep": 399,
                            "totalSleepRecords": 1,
                            "totalTimeInBed": 426
                        }
                    }, {
                        'fitbit-rate-limit-limit': '150',
                        'fitbit-rate-limit-remaining': '148',
                        'fitbit-rate-limit-reset': '2216',
                        'content-type': 'application/json;charset=UTF-8',
                        'content-language': 'en',
                        'date': 'Mon, 29 Sep 2014 21:23:03 GMT',
                        'connection': 'close',
                    });
                    var n1 = helper.getNode("n1");
                    var n2 = helper.getNode("n2");
                    var n3 = helper.getNode("n3");
                    n2.should.have.property('id', 'n2');
                    n1.send({ date: "2014-09-29" });
                    n3.on('input', function(msg) {
                        var badge = msg.payload.badges[0];
                        badge.should.have.property("value", 5000);
                        badge.should.have.property("name", "daily 5,000 step");
                        badge.should.have.property("timesAchieved", 6);
                        badge.should.have.property("badgeType", "DAILY_STEPS");
                        done();
                    });
                });
            });

            it('sets appropriate status on error', function(done) {
                helper.load(fitbitNode,
                            [{id:"n1", type:"helper", wires:[["n2"]]},
                             {id:"n4", type:"fitbit-credentials", username: "Bob"},
                             {id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],
                              dataType:"badges"},
                             {id:"n3", type:"helper"}],
                            {
                                "n4": { client_key: "fade",
                                    client_secret: "face",
                                        access_token: "beef",
                                        access_token_secret: "feed",
                                        username: "Bob",
                                      },
                            }, function() {
                var scope = nock('https://api.fitbit.com:443')
                    .get('/1/user/-/badges.json')
                    .reply(404);
                    var n1 = helper.getNode("n1");
                    var n2 = helper.getNode("n2");
                    var n3 = helper.getNode("n3");
                    var expected = [
                        {"fill":"blue","shape":"dot","text":"querying"},
                        {"fill":"red","shape":"ring","text":"failed"},
                    ];
                    sinon.stub(n2, 'status', function(status) {
                        should.deepEqual(status, expected.shift());
                        if (expected.length === 0) {
                            done();
                        }
                    });
                    n1.send({ date: "2014-09-29" });
                });
            });

            it('fails oauth dance if client key is invalid', function(done) {
                helper.load(fitbitNode, [{id:"n1", type:"helper", wires:[["n2"]]},{id:"n4", type:"fitbit-credentials"},{id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],dataType:"sleep"},{id:"n3", type:"helper"}], function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .post('/oauth/request_token')
                        .reply(401, '{"errors":[{"errorType":"oauth","fieldName":"oauth_consumer_key","message":"Invalid consumer key: sadsa"}],"success":false}');
                    helper.request()
                        .get('/fitbit-credentials/n4/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/n4/auth/callback')
                        .expect(200)
                        .end(function(err, res) {
                            if (err) return done(err);
                            res.text.should.containEql('Oh no');
                            done();
                        });
                });
            });

            it('fails if access token request fails', function(done) {
                helper.load(fitbitNode, [{id:"n1", type:"helper", wires:[["n2"]]},{id:"n4", type:"fitbit-credentials"},{id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],dataType:"sleep"},{id:"n3", type:"helper"}], function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .post('/oauth/request_token')
                        // TODO check request headers
                        .reply(200, "oauth_token=0123&oauth_token_secret=4567&oauth_callback_confirmed=true",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '70',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               })
                        .post('/oauth/access_token')
                        // TODO check request headers
                        .reply(401, "oauth_problem=permission_denied",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '31',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               });
                    helper.request()
                        .get('/fitbit-credentials/n4/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/n4/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) return done(err);
                            helper.request()
                                .get('/fitbit-credentials/n4/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) return done(err);
                                    res.text.should.containEql('Oh no');
                                    res.text.should.containEql('oauth_problem=permission_denied');
                                    done();
                                });
                        });
                });
            });

            it('fails if profile can\'t be retrieved', function(done) {
                helper.load(fitbitNode, [{id:"n1", type:"helper", wires:[["n2"]]},{id:"n4", type:"fitbit-credentials"},{id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],dataType:"sleep"},{id:"n3", type:"helper"}], function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .post('/oauth/request_token')
                        // TODO check request headers
                        .reply(200, "oauth_token=0123&oauth_token_secret=4567&oauth_callback_confirmed=true",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '70',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               })
                        .post('/oauth/access_token')
                        // TODO check request headers
                        .reply(200, "oauth_token=01234&oauth_token_secret=56789&encoded_user_id=foobar",
                               {
                                   'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
                                   'content-language': 'en-US',
                                   'content-length': '65',
                                   'date': 'Tue, 30 Sep 2014 07:43:02 GMT',
                                   'connection': 'close',
                               })
                        .get('/1/user/-/profile.json')
                        .reply(401, '{"errors":[{"errorType":"validation","fieldName":"userId","message":"No user found"}]}', {
                            'fitbit-rate-limit-limit': '150',
                            'fitbit-rate-limit-remaining': '148',
                            'fitbit-rate-limit-reset': '2216',
                            'content-type': 'application/json;charset=UTF-8',
                            'content-language': 'en',
                            'date': 'Mon, 29 Sep 2014 21:23:03 GMT',
                            'connection': 'close' });
                    helper.request()
                        .get('/fitbit-credentials/n4/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/n4/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) return done(err);
                            helper.request()
                                .get('/fitbit-credentials/n4/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) return done(err);
                                    res.text.should.containEql('Oh no');
                                    res.text.should.containEql('No user found');
                                    done();
                                });
                        });
                });
            });

        }

        it('can be loaded without credentials', function(done) {
            helper.load(fitbitNode,
                        [{id:"f1",type:"fitbit",dataType:"sleep"}], function() {
                var n = helper.getNode("f1");
                n.should.have.property('id', 'f1');
                done();
            });
        });

        it('fails to fetch invalid data type', function(done) {
            helper.load(fitbitNode,
                        [{id:"n1", type:"helper", wires:[["n2"]]},
                         {id:"n4", type:"fitbit-credentials", username: "Bob"},
                         {id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],
                          dataType:"foobar"},
                         {id:"n3", type:"helper"}],
                        {
                            "n4": { client_key: "fade",
                                    client_secret: "face",
                                    access_token: "beef",
                                    access_token_secret: "feed",
                                    username: "Bob",
                                  },
                        }, function() {
                var n1 = helper.getNode("n1");
                var n2 = helper.getNode("n2");
                var n3 = helper.getNode("n3");
                var expected = [
                    {"fill":"blue","shape":"dot","text":"querying"},
                    {"fill":"red","shape":"ring","text":"invalid type"},
                ];
                sinon.stub(n2, 'status', function(status) {
                    should.deepEqual(status, expected.shift());
                    if (expected.length === 0) {
                        done();
                    }
                });
                n1.send({ date: "2014-09-29" });
            });
        });

        it('fails oauth dance if no client secret is supplied', function(done) {
            helper.load(fitbitNode, [{id:"n1", type:"helper", wires:[["n2"]]},{id:"n4", type:"fitbit-credentials"},{id:"n2", type:"fitbit", fitbit: "n4", wires:[["n3"]],dataType:"sleep"},{id:"n3", type:"helper"}], function() {
                helper.request()
                    .get('/fitbit-credentials/n4/auth?client_key=0123')
                    .expect(400)
                    .end(function(err, res) {
                        if (err) return done(err);
                        done();
                    });
            });
        });
    });
});
