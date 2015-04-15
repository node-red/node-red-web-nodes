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

function today() {
    var d = new Date();
    var month = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" +
        (month < 10 ? "0" : "") + month + "-" +
            (day < 10 ? "0" : "") + day;
}

function yesterday() {
    var d = new Date();
    d.setDate(d.getDate() - 1);
    var month = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + "-" +
        (month < 10 ? "0" : "") + month + "-" +
            (day < 10 ? "0" : "") + day;
}

describe('fitbit nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe('in node', function() {
        if (!nock) { return; }
        it("should send new badge achievement message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/badges.json')
                .reply(200, {"badges":[{
                    "badgeType":"DAILY_FLOORS",
                    "dateTime":"2014-10-28",
                    "earnedMessage":"Congrats on earning your first daily 50 floors badge!",
                    "marketingDescription":"Whoa! You've climbed 50 floors today! That's like taking the stairs to the top floor of a skyscraper! Can you make it to 75 for the next badge?",
                    "name":"daily 50 floor",
                    "timesAchieved":2,
                    "value":50
                }]}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                })
                .get('/1/user/-/badges.json')
                .reply(200, {"badges":[{
                    "badgeType":"DAILY_FLOORS",
                    "dateTime":"2014-10-28",
                    "earnedMessage":"Congrats on earning your first daily 50 floors badge!",
                    "marketingDescription":"Whoa! You've climbed 50 floors today! That's like taking the stairs to the top floor of a skyscraper! Can you make it to 75 for the next badge?",
                    "name":"daily 50 floor",
                    "timesAchieved":2,
                    "value":50
                }, {
                    "badgeType":"LIFETIME_DISTANCE",
                    "dateTime": today(),
                    "earnedMessage":"Whoa! You've earned the 50 lifetime miles badge!",
                    "marketingDescription":"Excellent! You've walked 50 miles! Congrats on earning your first lifetime distance badge! Keep it up to earn another.",
                    "name":"50 lifetime miles",
                    "timesAchieved":1,
                    "unit":"MILES",
                    "value":50
                }]}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"badges"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            'Whoa! You\'ve earned the 50 lifetime miles badge!');
                        msg.should.have.property('type', 'new');
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });

        it("should send repeat badge achievement message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/badges.json')
                .reply(200, {"badges":[{
                    "badgeType":"DAILY_FLOORS",
                    "dateTime":"2014-10-28",
                    "earnedMessage":"Congrats on earning your first daily 50 floors badge!",
                    "marketingDescription":"Whoa! You've climbed 50 floors today! That's like taking the stairs to the top floor of a skyscraper! Can you make it to 75 for the next badge?",
                    "name":"daily 50 floor",
                    "timesAchieved":2,
                    "value":50
                }]}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                })
                .get('/1/user/-/badges.json')
                .reply(200, {"badges":[{
                    "badgeType":"DAILY_FLOORS",
                    "dateTime":"2014-10-28",
                    "earnedMessage":"Congrats on earning your first daily 50 floors badge!",
                    "marketingDescription":"Whoa! You've climbed 50 floors today! That's like taking the stairs to the top floor of a skyscraper! Can you make it to 75 for the next badge?",
                    "name":"daily 50 floor",
                    "timesAchieved":3,
                    "value":50
                }]}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"badges"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            'Congrats on earning your first daily 50 floors badge!');
                        msg.should.have.property('type', 'repeat');
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });

        it("should send sleep record message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/sleep/date/'+today()+'.json')
                .reply(200, {
                    "sleep": [],
                    "summary": {
                        "totalMinutesAsleep":0,
                        "totalSleepRecords":0,
                        "totalTimeInBed":0,
                    }}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                })
                .get('/1/user/-/sleep/date/'+today()+'.json')
                .reply(200, {
                    "sleep": [
                        {
                            "awakeCount":1,
                            "awakeDuration":7,
                            "awakeningsCount":6,
                            "duration":23040000,
                            "efficiency":97,
                            "isMainSleep":true,
                            "logId":2,
                            "minuteData":[],
                            "minutesAfterWakeup":4,
                            "minutesAsleep":361,
                            "minutesAwake":12,
                            "minutesToFallAsleep":7,
                            "restlessCount":7,
                            "restlessDuration":16,
                            "startTime":"2014-10-28T22:57:00.000",
                            "timeInBed":384
                        }
                    ], "summary": {
                        "totalMinutesAsleep":361,
                        "totalSleepRecords":1,
                        "totalTimeInBed":384,
                    }}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"sleep"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.payload.should.have.property('timeInBed', 384);
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });

        it("should send steps goal message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/activities/date/'+today()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":0,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":57,"veryActiveMinutes":0}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                })
                .get('/1/user/-/activities/date/'+today()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":0,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":10001,"veryActiveMinutes":0}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"goals"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            '10000 steps goal achieved');
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });

        it("should send floors goal message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/activities/date/'+today()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":0,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":57,"veryActiveMinutes":0}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                })
                .get('/1/user/-/activities/date/'+today()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":11,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":57,"veryActiveMinutes":0}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"goals"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            '10 floors goal achieved');
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });

        it("should send active minutes goal message", function(done) {
            nock('https://api.fitbit.com:443')
                .get('/1/user/-/activities/date/'+today()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":0,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":57,"veryActiveMinutes":0}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                })
                .get('/1/user/-/activities/date/'+yesterday()+'.json')
                .reply(200, {"activities":[],"goals":{"activeMinutes":30,"caloriesOut":2184,"distance":8.05,"floors":10,"steps":10000},"summary":{"activeScore":-1,"activityCalories":43,"caloriesBMR":414,"caloriesOut":441,"distances":[{"activity":"total","distance":0.04},{"activity":"tracker","distance":0.04},{"activity":"loggedActivities","distance":0},{"activity":"veryActive","distance":0},{"activity":"moderatelyActive","distance":0},{"activity":"lightlyActive","distance":0.04},{"activity":"sedentaryActive","distance":0}],"elevation":0,"fairlyActiveMinutes":1,"floors":0,"lightlyActiveMinutes":13,"marginalCalories":15,"sedentaryMinutes":33,"steps":57,"veryActiveMinutes":31}}, {
                    'content-type': 'application/json;charset=UTF-8',
                    'content-language': 'en',
                    'content-length': '654',
                    date: 'Wed, 29 Oct 2014 06:08:10 GMT',
                    connection: 'close'
                });

            helper.load(fitbitNode,
                [{id:"fitbit-config", type:"fitbit-credentials",
                  username: "Bob"},
                 {id:"fitbit", type:"fitbit in", fitbit: "fitbit-config",
                  wires:[["output"]], dataType:"goals"},
                 {id:"output", type:"helper"}],
                {
                    "fitbit-config": {
                        client_key: "fade",
                        client_secret: "face",
                        access_token: "beef",
                        access_token_secret: "feed",
                        username: "Bob"
                    },
                }, function() {
                    var fitbit = helper.getNode("fitbit");
                    fitbit.should.have.property('id', 'fitbit');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            '30 active minutes goal achieved');
                        done();
                    });

                    // wait for fitbit.on("input", ...) to be called
                    var onFunction = fitbit.on;
                    var onStub = sinon.stub(fitbit, 'on', function() {
                        var res = onFunction.apply(fitbit, arguments);
                        onStub.restore();
                        /* hack state so it thinks it was yesterdays data
                         * to test that we catch goals achieved in the last
                         * poll interval of the day
                         */
                        fitbit.state.day = yesterday();
                        fitbit.emit('input', {}); // trigger poll
                        return res;
                });
            });
        });
    });

    describe('query node', function() {

        if (nock) {

            it('can do oauth dance', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]], dataType:"sleep"},
                    {id:"output", type:"helper"}], function() {
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
                        .get('/fitbit-credentials/fitbit-config/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/fitbit-config/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) {
                            	return done(err);
                            }
                            helper.request()
                                .get('/fitbit-credentials/fitbit-config/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    helper.credentials.get("fitbit-config")
                                        .should.have.property('username',
                                                              'Foo Bar');
                                    done();
                                });
                        });
                });
            });

            it('can fetch sleep data', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials", username: "Bob"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config", wires:[["output"]],
                     dataType:"sleep"},
                    {id:"output", type:"helper"}],
                    {
                        "fitbit-config": {
                            client_key: "fade",
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
                    var input = helper.getNode("input");
                    var fitbit = helper.getNode("fitbit");
                    var output = helper.getNode("output");
                    fitbit.should.have.property('id', 'fitbit');
                    input.send({ date: "2014-09-29" });
                    output.on('input', function(msg) {
                        var sleep = msg.payload;
                        sleep.should.have.property("duration", 25560000);
                        sleep.should.have.property("efficiency", 96);
                        sleep.should.have.property("isMainSleep", true);
                        should.deepEqual(sleep, msg.data.sleep[0]);
                        done();
                    });
               });
            });

            it('handles empty sleep data', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials",
                     username: "Bob"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]], dataType:"sleep"},
                    {id:"output", type:"helper"}],
                    {
                        "fitbit-config": {
                            client_key: "fade",
                            client_secret: "face",
                            access_token: "beef",
                            access_token_secret: "feed",
                            username: "Bob",
                        },
                    }, function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .get('/1/user/-/sleep/date/2014-09-29.json')
                        .reply(200, {
                            "sleep": [], "summary": {
                                "totalMinutesAsleep": 0,
                                "totalSleepRecords": 0,
                                "totalTimeInBed": 0
                            }
                        }, {
                            'content-type': 'application/json;charset=UTF-8',
                            'content-language': 'en',
                        });
                    var input = helper.getNode("input");
                    var fitbit = helper.getNode("fitbit");
                    var output = helper.getNode("output");
                    fitbit.should.have.property('id', 'fitbit');
                    input.send({ date: "2014-09-29" });
                    var errored = false;
                    setTimeout(function() {
                        if (!errored) {
                            done();
                        }
                    },500);
                    output.on('input', function(msg) {
                        errored = true;
                        done(new Error("Should not receive an msg.error"));
                    });
               });
            });

            it('can fetch badge data', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials",
                     username: "Bob"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]], dataType:"badges"},
                    {id:"output", type:"helper"}],
                    {
                        "fitbit-config": {
                            client_key: "fade",
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
                    }, {
                        'fitbit-rate-limit-limit': '150',
                        'fitbit-rate-limit-remaining': '148',
                        'fitbit-rate-limit-reset': '2216',
                        'content-type': 'application/json;charset=UTF-8',
                        'content-language': 'en',
                        'date': 'Mon, 29 Sep 2014 21:23:03 GMT',
                        'connection': 'close',
                    });
                    var input = helper.getNode("input");
                    var fitbit = helper.getNode("fitbit");
                    var output = helper.getNode("output");
                    fitbit.should.have.property('id', 'fitbit');
                    input.send({ date: "2014-09-29" });
                    output.on('input', function(msg) {
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
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials",
                     username: "Bob"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]], dataType:"badges"},
                    {id:"output", type:"helper"}],
                    {
                        "fitbit-config": {
                            client_key: "fade",
                            client_secret: "face",
                            access_token: "beef",
                            access_token_secret: "feed",
                            username: "Bob",
                        },
                    }, function() {
                        var scope = nock('https://api.fitbit.com:443')
                            .get('/1/user/-/badges.json')
                            .reply(404, '{"errors":[ { "errorType":"foo", "fieldName":"bar", "message":"oops" } ] }');
                        var input = helper.getNode("input");
                        var fitbit = helper.getNode("fitbit");
                        var output = helper.getNode("output");
                        var expected = [
                            {"fill":"blue","shape":"dot","text":"querying"},
                            {"fill":"red","shape":"ring","text":"failed"},
                        ];
                        sinon.stub(fitbit, 'status', function(status) {
                            should.deepEqual(status, expected.shift());
                            if (expected.length === 0) {
                                done();
                            }
                        });
                        input.send({ date: "2014-09-29" });
                    });
            });
            
            it('fails oauth dance if client key is invalid', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]],dataType:"sleep"},
                    {id:"output", type:"helper"}], function() {
                    var scope = nock('https://api.fitbit.com:443')
                        .post('/oauth/request_token')
                        .reply(401, '{"errors":[{"errorType":"oauth","fieldName":"oauth_consumer_key","message":"Invalid consumer key: sadsa"}],"success":false}');
                    helper.request()
                        .get('/fitbit-credentials/fitbit-config/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/fitbit-config/auth/callback')
                        .expect(200)
                        .end(function(err, res) {
                            if (err) {
                            	return done(err);
                            }
                            res.text.should.containEql('Oh no');
                            done();
                        });
                });
            });

            it('fails if access token request fails', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]],dataType:"sleep"},
                    {id:"output", type:"helper"}], function() {
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
                        .get('/fitbit-credentials/fitbit-config/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/fitbit-config/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) {
                            	return done(err);
                            }
                            helper.request()
                                .get('/fitbit-credentials/fitbit-config/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.containEql('Oh no');
                                    res.text.should.containEql('oauth_problem=permission_denied');
                                    done();
                                });
                        });
                });
            });

            it('fails if profile can\'t be retrieved', function(done) {
                helper.load(fitbitNode, [
                    {id:"input", type:"helper", wires:[["fitbit"]]},
                    {id:"fitbit-config", type:"fitbit-credentials"},
                    {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                     wires:[["output"]],dataType:"sleep"},
                    {id:"output", type:"helper"}], function() {
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
                        .get('/fitbit-credentials/fitbit-config/auth?client_key=0123&client_secret=4567&callback=http://localhost:1880/fitbit-credentials/fitbit-config/auth/callback')
                        .expect(302)
                        .expect('Location', 'https://www.fitbit.com/oauth/authorize?oauth_token=0123')
                        .end(function(err, res) {
                            if (err) {
                            	return done(err);
                            }
                            helper.request()
                                .get('/fitbit-credentials/fitbit-config/auth/callback?oauth_verifier=abcdef')
                                .expect(200)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
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

        it('fails oauth dance if no client secret is supplied', function(done) {
            helper.load(fitbitNode, [
                {id:"input", type:"helper", wires:[["fitbit"]]},
                {id:"fitbit-config", type:"fitbit-credentials"},
                {id:"fitbit", type:"fitbit", fitbit: "fitbit-config",
                 wires:[["output"]],dataType:"sleep"},
                {id:"output", type:"helper"}], function() {
                helper.request()
                    .get('/fitbit-credentials/fitbit-config/auth?client_key=0123')
                    .expect(400)
                    .end(function(err, res) {
                        if (err) {
                        	return done(err);
                        }
                        done();
                    });
            });
        });
    });
});
