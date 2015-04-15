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
var calendarNode = require("../../google/calendar.js");
var googleNode = require("../../google/google.js");
var helper = require('../helper.js');
var nock = helper.nock;

function TimeOffset(offsetSeconds) {
    if (!offsetSeconds) {
     offsetSeconds = 0;
    }
    return (new Date((new Date()).getTime()+offsetSeconds*1000));
}

function ISOTimeString(offsetSeconds) {
    return new TimeOffset(offsetSeconds).toISOString();
}

describe('google calendar nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe('input node', function() {
        if (!nock) { return; }
        it('injects message for calendar entry', function(done) {
            var oneMinuteAgo = new TimeOffset(-60); // definitely passed
            var now = new TimeOffset();
            var oneSecondFromNow = new TimeOffset(1);
            var oneMinuteFromNow = new TimeOffset(60);
            var oneMinuteOneSecondFromNow = new TimeOffset(61);
            var twoMinutesFromNow = new TimeOffset(120);
            var scope = nock('https://www.googleapis.com:443')
                .filteringPath(function(path) {
                    path = path.replace(/\.\d\d\dZ$/g, '.000Z');
                    path =
                        path.replace(
                            'timeMin=' + encodeURIComponent(oneMinuteAgo.toISOString()),
                            'timeMin=oneMinuteAgo');
                    [now, oneSecondFromNow].forEach(function(t) {
                        path =
                            path.replace(
                                'timeMin='+
                                    encodeURIComponent(t.toISOString())
                                        .replace(/\.\d\d\dZ$/, '.000Z'),
                                'timeMin=now');
                    });
                    [oneMinuteFromNow, oneMinuteOneSecondFromNow].forEach(function(t) {
                        path =
                            path.replace(
                                'timeMax='+encodeURIComponent(t.toISOString())
                                    .replace(/\.\d\d\dZ$/, '.000Z'),
                                'timeMax=oneMinuteFromNow');
                    });
                    return path;
                })
                .get('/calendar/v3/users/me/calendarList')
                .reply(200, {
                    kind : "calendar#calendarList",
                    items : [
                        { id: "bob", summary: "Bob", primary: true },
                        { id: "work", summary: "Work" },
                        { id: "home", summary: "Home" }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=now')
                .reply(200, {
                    kind: "calendar#events",
                    items: [
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "confirmed",
                            kind: "calendar#event",
                            summary: "Coffee",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "needsAction",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: oneMinuteFromNow.toISOString()
                            },
                            end: {
                                dateTime: twoMinutesFromNow.toISOString()
                            }
                        }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=oneMinuteAgo&timeMax=oneMinuteFromNow')
                .reply(200, {
                    kind: "calendar#events",
                    items: [
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "confirmed",
                            kind: "calendar#event",
                            summary: "Meeting",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "needsAction",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: now.toISOString()
                            },
                            end: {
                                dateTime: oneMinuteFromNow.toISOString()
                            }
                        }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=now')
                .reply(200, {
                    kind: "calendar#events",
                    items: []
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                });
            helper.load([googleNode, calendarNode], [
                {id:"google-config", type:"google-credentials",
                    displayName: "Bob"},
                {id:"calendar", type:"google calendar in",
                    google: "google-config", wires:[["output"]]},
                {id:"output", type:"helper"}
            ], {
                "google-config": {
                    clientId: "id",
                    clientSecret: "secret",
                    accessToken: "access",
                    refreshToken: "refresh",
                    expireTime: 1000+(new Date().getTime()/1000),
                    displayName: "Bob"
                },
            }, function() {
                var calendar = helper.getNode("calendar");
                calendar.should.have.property('id', 'calendar');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                output.on("input", function(msg) {
                    msg.should.have.property('title', 'Meeting');
                    scope.isDone();
                    done();
                });

                // wait for calendar.status({}) to be called twice
                var count = 0;
                var stub = sinon.stub(calendar, 'status', function(status) {
                    if (Object.getOwnPropertyNames(status).length === 0) {
                        count++;
                        if (count == 2) {
                            stub.restore();
                            // hack last check time back a minute
                            calendar.last = oneMinuteAgo;
                            calendar.should.have.property('timeout');
                            calendar.emit('input',{});
                        }
                    }
                });
            });
        });

        it('injects message for calendar entry based on end time', function(done) {
            var oneMinuteAgo = new TimeOffset(-60); // definitely passed
            var now = new TimeOffset();
            var oneSecondFromNow = new TimeOffset(1);
            var oneMinuteFromNow = new TimeOffset(60);
            var oneMinuteOneSecondFromNow = new TimeOffset(61);
            var twoMinutesFromNow = new TimeOffset(120);
            var scope = nock('https://www.googleapis.com:443')
                .filteringPath(function(path) {
                    path = path.replace(/\.\d\d\dZ$/g, '.000Z');
                    path =
                        path.replace(
                            'timeMin=' + encodeURIComponent(oneMinuteAgo.toISOString()),
                            'timeMin=oneMinuteAgo');
                    [now, oneSecondFromNow].forEach(function(t) {
                        path =
                            path.replace(
                                'timeMin='+
                                    encodeURIComponent(t.toISOString())
                                        .replace(/\.\d\d\dZ$/, '.000Z'),
                                'timeMin=now');
                    });
                    [oneMinuteFromNow, oneMinuteOneSecondFromNow].forEach(function(t) {
                        path =
                            path.replace(
                                'timeMax='+encodeURIComponent(t.toISOString())
                                    .replace(/\.\d\d\dZ$/, '.000Z'),
                                'timeMax=oneMinuteFromNow');
                    });
                    return path;
                })
                .get('/calendar/v3/users/me/calendarList')
                .reply(200, {
                    kind : "calendar#calendarList",
                    items : [
                        { id: "bob", summary: "Bob", primary: true },
                        { id: "work", summary: "Work" },
                        { id: "home", summary: "Home" }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=now')
                .reply(200, {
                    kind: "calendar#events",
                    items: [
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "confirmed",
                            kind: "calendar#event",
                            summary: "Coffee",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "needsAction",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: oneMinuteFromNow.toISOString()
                            },
                            end: {
                                dateTime: twoMinutesFromNow.toISOString()
                            }
                        }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=oneMinuteAgo&timeMax=oneMinuteFromNow')
                .reply(200, {
                    kind: "calendar#events",
                    items: [
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "confirmed",
                            kind: "calendar#event",
                            summary: "Meeting",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "needsAction",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: oneMinuteAgo.toISOString()
                            },
                            end: {
                                dateTime: now.toISOString()
                            }
                        }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=now')
                .reply(200, {
                    kind: "calendar#events",
                    items: []
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                });
            helper.load([googleNode, calendarNode], [
                {id:"google-config", type:"google-credentials",
                    displayName: "Bob"},
                {id:"calendar", type:"google calendar in",
                    offsetFrom: "end",
                    google: "google-config", wires:[["output"]]},
                {id:"output", type:"helper"}
            ], {
                "google-config": {
                    clientId: "id",
                    clientSecret: "secret",
                    accessToken: "access",
                    refreshToken: "refresh",
                    expireTime: 1000+(new Date().getTime()/1000),
                    displayName: "Bob"
                },
            }, function() {
                var calendar = helper.getNode("calendar");
                calendar.should.have.property('id', 'calendar');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                output.on("input", function(msg) {
                    msg.should.have.property('title', 'Meeting');
                    scope.isDone();
                    done();
                });

                // wait for calendar.status({}) to be called twice
                var count = 0;
                var stub = sinon.stub(calendar, 'status', function(status) {
                    if (Object.getOwnPropertyNames(status).length === 0) {
                        count++;
                        if (count == 2) {
                            stub.restore();
                            // hack last check time back a minute
                            calendar.last = oneMinuteAgo;
                            calendar.should.have.property('timeout');
                            calendar.emit('input',{});
                        }
                    }
                });
            });
        });
    });

    describe('query node', function() {
        if (!nock) { return; }
        it('returns calendar entry', function(done) {
            var oneHourAgo = new TimeOffset(-3600);
            var oneHourFromNow = new TimeOffset(3600);
            var twoHoursFromNow = new TimeOffset(7200);
            nock('https://www.googleapis.com:443')
                .get('/calendar/v3/users/me/calendarList')
                .reply(200, {
                    kind : "calendar#calendarList",
                    items : [
                        { id: "bob", summary: "Bob", primary: true },
                        { id: "work", summary: "Work" },
                        { id: "home", summary: "Home" }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .filteringPath(/timeMin=\d[^&]*/g, 'timeMin=now')
                .get('/calendar/v3/calendars/bob/events?maxResults=10&orderBy=startTime&singleEvents=true&showDeleted=false&timeMin=now')
                .reply(200, {
                    kind: "calendar#events",
                    items: [
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "confirmed",
                            kind: "calendar#event",
                            summary: "Coffee",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "needsAction",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: oneHourAgo.toISOString()
                            },
                            end: {
                                dateTime: oneHourFromNow.toISOString()
                            }
                        },
                        {
                            creator: {
                                email: "foo@example.com",
                                self: true,
                                displayName: "Bob Foo"
                            },
                            status: "tentative",
                            kind: "calendar#event",
                            summary: "Meeting",
                            attendees: [
                                {
                                    email: "foo@example.com",
                                    responseStatus: "accepted",
                                    organizer: true,
                                    self: true,
                                    displayName: "Bob Foo"
                                }
                            ],
                            start: {
                                dateTime: oneHourFromNow.toISOString()
                            },
                            end: {
                                dateTime: twoHoursFromNow.toISOString()
                            }
                        }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                });
            helper.load([googleNode, calendarNode], [
                {id:"google-config", type:"google-credentials",
                    displayName: "Bob"},
                {id:"calendar", type:"google calendar",
                    google: "google-config", wires:[["output"]]},
                {id:"output", type:"helper"}
            ], {
                "google-config": {
                    clientId: "id",
                    clientSecret: "secret",
                    accessToken: "access",
                    refreshToken: "refresh",
                    expireTime: 1000+(new Date().getTime()/1000),
                    displayName: "Bob"
                },
            }, function() {
                var calendar = helper.getNode("calendar");
                calendar.should.have.property('id', 'calendar');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                output.on("input", function(msg) {
                    msg.should.have.property('title', 'Meeting');
                    done();
                });

                // wait for calendar.on("input", ...) to be called
                var onFunction = calendar.on;
                var onStub = sinon.stub(calendar, 'on', function() {
                    var res = onFunction.apply(calendar, arguments);
                    onStub.restore();
                    calendar.emit('input', {}); // trigger poll
                    return res;
                });
            });
        });
    });

    describe('out node', function() {
        if (!nock) { return; }
        it('creates entry with quickAdd', function(done) {
            nock('https://www.googleapis.com:443')
                .get('/calendar/v3/users/me/calendarList')
                .reply(200, {
                    kind : "calendar#calendarList",
                    items : [
                        { id: "bob", summary: "Bob", primary: true },
                        { id: "work", summary: "Work" },
                        { id: "home", summary: "Home" }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .post('/calendar/v3/calendars/bob/events/quickAdd',
                    "text=11%3A00%20coffee%20at%20Starbucks")
                .reply(200, {
                    creator: {
                        email: "foo@example.com",
                        self: true,
                        displayName: "Bob Foo"
                    },
                    status: "confirmed",
                    kind: "calendar#event",
                    summary: "Coffee",
                    location: "Starbucks",
                    start: {
                        dateTime: "2014-11-12T11:00:00Z"
                    },
                    end: {
                        dateTime: "2014-11-12T12:00:00Z"
                    }
                }, {
                    date: 'Tue, 12 Nov 2014 8:02:29 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                });
            helper.load([googleNode, calendarNode], [
                {id:"google-config", type:"google-credentials",
                    displayName: "Bob"},
                {id:"calendar", type:"google calendar out",
                    google: "google-config"}
            ], {
                "google-config": {
                    clientId: "id",
                    clientSecret: "secret",
                    accessToken: "access",
                    refreshToken: "refresh",
                    expireTime: 1000+(new Date().getTime()/1000),
                    displayName: "Bob"
                },
            }, function() {
                var calendar = helper.getNode("calendar");
                calendar.should.have.property('id', 'calendar');

                var stub = sinon.stub(calendar, 'status', function(status) {
                    if (Object.getOwnPropertyNames(status).length === 0) {
                        stub.restore();
                        done();
                    }
                    return;
                });

                // wait for calendar.on("input", ...) to be called
                var onFunction = calendar.on;
                var onStub = sinon.stub(calendar, 'on', function() {
                    var res = onFunction.apply(calendar, arguments);
                    onStub.restore();
                    calendar.emit('input', {
                        payload: "11:00 coffee at Starbucks"
                    });
                    return res;
                });
            });
        });

        it('creates entry with quickAdd', function(done) {
            nock('https://www.googleapis.com:443')
                .get('/calendar/v3/users/me/calendarList')
                .reply(200, {
                    kind : "calendar#calendarList",
                    items : [
                        { id: "bob", summary: "Bob", primary: true },
                        { id: "work", summary: "Work" },
                        { id: "home", summary: "Home" }
                    ]
                }, {
                    date: 'Tue, 11 Nov 2014 10:53:24 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                })
                .post('/calendar/v3/calendars/work/events', {
                    start: { dateTime: "2014-11-12T11:00:00Z" },
                    end: { dateTime: "2014-11-12T12:00:00Z" },
                    location: "Starbucks",
                    summary: "coffee"
                })
                .reply(200, {
                    creator: {
                        email: "foo@example.com",
                        self: true,
                        displayName: "Bob Foo"
                    },
                    status: "confirmed",
                    kind: "calendar#event",
                    summary: "Coffee",
                    location: "Starbucks",
                    start: {
                        dateTime: "2014-11-12T11:00:00Z"
                    },
                    end: {
                        dateTime: "2014-11-12T12:00:00Z"
                    }
                }, {
                    date: 'Tue, 12 Nov 2014 8:02:29 GMT',
                    'content-type': 'application/json; charset=UTF-8'
                });
            helper.load([googleNode, calendarNode], [
                {id:"google-config", type:"google-credentials",
                    displayName: "Bob"},
                {id:"calendar", type:"google calendar out", calendar: "Work",
                    google: "google-config"}
            ], {
                "google-config": {
                    clientId: "id",
                    clientSecret: "secret",
                    accessToken: "access",
                    refreshToken: "refresh",
                    expireTime: 1000+(new Date().getTime()/1000),
                    displayName: "Bob"
                },
            }, function() {
                var calendar = helper.getNode("calendar");
                calendar.should.have.property('id', 'calendar');

                var stub = sinon.stub(calendar, 'status', function(status) {
                    if (Object.getOwnPropertyNames(status).length === 0) {
                        stub.restore();
                        done();
                    }
                    return;
                });

                // wait for calendar.on("input", ...) to be called
                var onFunction = calendar.on;
                var onStub = sinon.stub(calendar, 'on', function() {
                    var res = onFunction.apply(calendar, arguments);
                    onStub.restore();
                    calendar.emit('input', {
                        payload: {
                            start: { dateTime: "2014-11-12T11:00:00Z" },
                            end: { dateTime: "2014-11-12T12:00:00Z" },
                            location: "Starbucks",
                            summary: "coffee"
                        }
                    });
                    return res;
                });
            });
        });
    });
});
