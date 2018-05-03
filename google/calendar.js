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

module.exports = function(RED) {
    "use strict";

    function GoogleCalendarInputNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        if (!this.google || !this.google.credentials.accessToken) {
            this.warn(RED._("calendar.warn.no-credentials"));
            return;
        }
        this.calendar = n.calendar || 'primary';
        if (!n.offsetType || n.offsetType === 'at') {
            this.offset = 0;
        } else {
            var plusOrMinus = n.offsetType === 'before' ? 1 : -1;
            var multiplier = {
                seconds: 1000,
                minutes: 60*1000,
                hours: 60*60*1000,
                days: 24*60*60*1000
            }[n.offsetUnits];
            this.offset = plusOrMinus * n.offset * multiplier;
        }

        var setNextTimeout;
        var eventsBetween;
        if (!n.offsetFrom || n.offsetFrom === 'start') {
            setNextTimeout = setNextStartingTimeout;
            eventsBetween = eventsStartingBetween;
        } else {
            setNextTimeout = setNextEndingTimeout;
            eventsBetween = eventsEndingBetween;
        }
        var node = this;
        node.status({fill:"blue",shape:"dot",text:"calendar.status.querying"});
        calendarList(node, function(err) {
            if (err) {
                node.error(err,{});
                node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                return;
            }
            var cal = calendarByNameOrId(node, node.calendar);
            if (!cal) {
                node.status({fill:"red",shape:"ring",text:"calendar.status.invalid-calendar"});
                return;
            }
            node.status({});
            node.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"calendar.status.querying"});
                var now = new Date();
                eventsBetween(node, cal, {}, node.last, now, function(err,events) {
                    setNextTimeout(node, cal, now, function() {
                        node.emit('input', {});
                    });
                    if (err) {
                        node.error(err,msg);
                        node.status({fill:"blue",shape:"dot",text:"calendar.status.failed"});
                    } else {
                        node.status({});
                        events.forEach(function (ev) {
                            sendEvent(node, ev, {});
                        });
                    }
                });
            });
            node.timeout = setNextTimeout(node, cal, new Date(), function() {
                node.emit('input', {});
            });
            node.on("close", function() {
                if (node.timeout !== null) {
                    clearTimeout(node.timeout);
                    delete node.timeout;
                }
            });
        });
    }
    RED.nodes.registerType("google calendar in", GoogleCalendarInputNode);

    function setNextStartingTimeout(node, cal, after, cb) {
        node.status({fill:"blue",shape:"dot",text:"calendar.status.next-event"});
        node.last = new Date(after.getTime());
        after = new Date(after.getTime()+node.offset); // apply offset
        nextStartingEvent(node, cal, {}, after, function(err, ev) {
            var timeout = 900000; // 15 minutes
            node.status({});
            if (!err && ev) {
                var start = getEventDate(ev);
                if (start) {
                    timeout =
                        Math.min(timeout, start.getTime() - after.getTime());
                }
            }
            if (timeout >= 0) {
                node.timeout = setTimeout(cb, timeout);
            } else {
                console.log("timeout invalid");
            }
        });
    }

    function setNextEndingTimeout(node, cal, after, cb) {
        node.status({fill:"blue",shape:"dot",text:"calendar.status.next-event"});
        node.last = new Date(after.getTime());
        after = new Date(after.getTime()+node.offset); // apply offset
        nextEndingEvent(node, cal, {}, after, function(err, ev) {
            var timeout = 900000; // 15 minutes
            node.status({});
            if (!err && ev) {
                var end = getEventDate(ev, 'end');
                if (end) {
                    timeout =
                        Math.min(timeout, end.getTime() - after.getTime());
                }
            }
            if (timeout >= 0) {
                node.timeout = setTimeout(cb, timeout);
            } else {
                console.log("timeout invalid");
            }
        });
    }

    function GoogleCalendarQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        this.calendar = n.calendar || 'primary';
        this.ongoing = n.ongoing || false;

        if (!this.google || !this.google.credentials.accessToken) {
            this.warn(RED._("calendar.warn.no-credentials"));
            return;
        }

        var node = this;
        node.status({fill:"blue",shape:"dot",text:"calendar.status.querying"});
        calendarList(node, function(err) {
            if (err) {
                node.error(err,{});
                node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                return;
            }
            node.status({});

            node.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"calendar.status.querying"});
                var cal = calendarByNameOrId(node, msg.calendar) ||
                    calendarByNameOrId(node, node.calendar);
                if (!cal) {
                    node.error(RED._("calendar.error.invalid-calendar"),msg);
                    node.status({fill:"red",shape:"ring",text:"calendar.status.invalid-calendar"});
                    return;
                }
                nextStartingEvent(node, cal, msg, function(err, ev) {
                    if (err) {
                        node.error(RED._("calendar.error.error", {error:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                        return;
                    }
                    if (!ev) {
                        node.error(RED._("calendar.error.no-event"),msg);
                        node.status({fill:"red",shape:"ring",text:"calendar.status.no-event"});
                    } else {
                        sendEvent(node, ev, msg);
                        node.status({});
                    }
                });
            });
        });
    }
    RED.nodes.registerType("google calendar", GoogleCalendarQueryNode);

    function calendarByName(node, name) {
        if (typeof name === 'undefined') {
            return null;
        }
        for (var cal in node.calendars) {
            if (node.calendars.hasOwnProperty(cal)) {
                if (node.calendars[cal].summary === name) {
                    return node.calendars[cal];
                }
            }
        }
        return null;
    }

    function calendarByNameOrId(node, nameOrId) {
        return node.calendars.hasOwnProperty(nameOrId) ?
            node.calendars[nameOrId] : // an id
            calendarByName(node, nameOrId); // maybe a name
    }

    function calendarList(node, cb) {
        node.calendars = {};
        node.google.request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function(err, data) {
            if (err) {
                cb(RED._("calendar.error.fetch-failed", {message:err.toString()}));
                return;
            }
            if (data.error) {
                cb(RED._("calendar.error.fetch-failed", {message:data.error.message}));
                return;
            }
            for (var i = 0; i < data.items.length; i++) {
                var cal = data.items[i];
                if (cal.primary) {
                    node.calendars.primary = cal;
                }
                node.calendars[cal.id] = cal;
            }
            cb(null);
        });
    }

    function nextStartingEvent(node, cal, msg, after, cb) {
        if (typeof after === 'function') {
            cb = after;
            after = new Date();
        }

        var request = {
            url: 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events'
        };
        request.qs = {
            maxResults: 10,
            orderBy: 'startTime',
            singleEvents: true,
            showDeleted: false,
            timeMin: after.toISOString()
        };
        if (msg.payload) {
            request.qs.q = RED.util.ensureString(msg.payload);
        }
        var handle_response = function(err, data) {
            if (err) {
                cb(RED._("calendar.error.error", {error:err.toString()}), null);
            } else if (data.error) {
                cb(RED._("calendar.error.error-details", {code:data.error.code, message:JSON.stringify(data.error.message)}), null);
            } else {
                var ev;
                /* 0 - 10 events ending after now ordered by startTime
                 * so we find the first that starts after now to
                 * give us the "next" event
                 */
                for (var i = 0; i<data.items.length; i++) {
                    ev = data.items[i];
                    var start = getEventDate(ev);
                    if (node.ongoing || (start && start.getTime() > after.getTime())) {
                        break;
                    }
                    ev = undefined;
                }
                if (!ev && data.hasOwnProperty('nextPageToken')) {
                    request.qs.pageToken = data.nextPageToken;
                    node.google.request(request, handle_response);
                } else {
                    cb(null, ev);
                }
            }
        };
        node.google.request(request, handle_response);
    }

    function nextEndingEvent(node, cal, msg, after, cb) {
        if (typeof after === 'function') {
            cb = after;
            after = new Date();
        }

        var request = {
            url: 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events'
        };
        /* orderby: endTime is not permitted by API so for now this assumes
         * that events are not nested.
         * TODO: support nested events - at least simple, common cases
         * such as an event overlapping an all day event
         */
        request.qs = {
            maxResults: 10,
            orderBy: 'startTime',
            singleEvents: true,
            showDeleted: false,
            timeMin: after.toISOString()
        };
        if (msg.payload) {
            request.qs.q = RED.util.ensureString(msg.payload);
        }
        var handle_response = function(err, data) {
            if (err) {
                cb(RED._("calendar.error.error", {error:err.toString()}), null);
            } else if (data.error) {
                cb(RED._("calendar.error.error-details", {code:data.error.code, message:JSON.stringify(data.error.message)}), null);
            } else {
                var ev;
                /* 0 - 10 events ending after now ordered by startTime
                 * so we find the first that starts after now to
                 * give us the "next" event
                 */
                for (var i = 0; i<data.items.length; i++) {
                    ev = data.items[i];
                    var end = getEventDate(ev, 'end');
                    if (end && end.getTime() > after.getTime()) {
                        break;
                    }
                    ev = undefined;
                }
                if (!ev && data.hasOwnProperty('nextPageToken')) {
                    request.qs.pageToken = data.nextPageToken;
                    node.google.request(request, handle_response);
                } else {
                    cb(null, ev);
                }
            }
        };
        node.google.request(request, handle_response);
    }

    function eventsStartingBetween(node, cal, msg, start, end, results, cb) {
        if (typeof results === 'function') {
            cb = results;
            results = {
                events: []
            };
        }
        start = new Date(start.getTime()+node.offset); // apply offset
        end = new Date(end.getTime()+node.offset); // apply offset
        var request = {
            url: 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events'
        };
        request.qs = {
            maxResults: 10,
            orderBy: 'startTime',
            singleEvents: true,
            showDeleted: false,
            timeMin: start.toISOString(),
            timeMax: (new Date(end.getTime() + 60*1000)).toISOString()
        };
        if (msg.payload) {
            request.qs.q = RED.util.ensureString(msg.payload);
        }
        if (results.hasOwnProperty('nextPageToken')) {
            request.qs.pageToken = results.nextPageToken;
        }
        node.google.request(request, function(err, data) {
            if (err) {
                cb(RED._("calendar.error.error", {error:err.toString()}), null);
            } else if (data.error) {
                cb(RED._("calendar.error.error-details", {code:data.error.code, message:JSON.stringify(data.error.message)}), null);
            } else {
                /* 0 - 10 events ending after now ordered by startTime
                 * so we find the first that starts after now to
                 * give us the "next" event
                 */
                for (var i = 0; i < data.items.length; i++) {
                    var ev = data.items[i];
                    var evStart = getEventDate(ev);
                    if (evStart) {
                         if (evStart.getTime() > end.getTime()) {
                             // timeMax should catch these
                             break;
                         } else if (evStart.getTime() > start.getTime()) {
                             results.events.push(ev);
                         }
                    }
                }
                if (data.hasOwnProperty('nextPageToken')) {
                    results.nextPageToken = data.nextPageToken;
                    eventsStartingBetween(node, cal, msg, start, end, results, cb);
                } else {
                    cb(null, results.events);
                }
            }
        });
    }

    function eventsEndingBetween(node, cal, msg, start, end, results, cb) {
        if (typeof results === 'function') {
            cb = results;
            results = {
                events: []
            };
        }
        start = new Date(start.getTime()+node.offset); // apply offset
        end = new Date(end.getTime()+node.offset); // apply offset
        var request = {
            url: 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events'
        };
        /* orderby: endTime is not permitted by API so for now events are
         * returned in startTime order rather than end time order which
         * would be more natural. This is probably okay for most cases.
         * TODO: post-process events list to order them by end time
         */
        request.qs = {
            maxResults: 10,
            orderBy: 'startTime', // endTime is not permitted by API
            singleEvents: true,
            showDeleted: false,
            timeMin: start.toISOString(),
            timeMax: (new Date(end.getTime() + 60*1000)).toISOString()
        };
        if (msg.payload) {
            request.qs.q = RED.util.ensureString(msg.payload);
        }
        if (results.hasOwnProperty('nextPageToken')) {
            request.qs.pageToken = results.nextPageToken;
        }
        node.google.request(request, function(err, data) {
            if (err) {
                cb(RED._("calendar.error.error", {error:err.toString()}), null);
            } else if (data.error) {
                cb(RED._("calendar.error.error-details", {code:data.error.code, message:JSON.stringify(data.error.message)}), null);
            } else {
                /* 0 - 10 events ending after now ordered by startTime
                 * so we find the first that starts after now to
                 * give us the "next" event
                 */
                for (var i = 0; i < data.items.length; i++) {
                    var ev = data.items[i];
                    var evEnd = getEventDate(ev, 'end');
                    if (evEnd) {
                         if (evEnd.getTime() > end.getTime()) {
                             break;
                         } else if (evEnd.getTime() > start.getTime()) {
                             results.events.push(ev);
                         }
                    }
                }
                if (data.hasOwnProperty('nextPageToken')) {
                    results.nextPageToken = data.nextPageToken;
                    eventsEndingBetween(node, cal, msg, start, end, results, cb);
                } else {
                    cb(null, results.events);
                }
            }
        });
    }

    function sendEvent(node, ev, msg) {
        if (typeof msg === 'undefined') {
            msg = {};
        }
        delete msg.error;
        var payload = msg.payload = {};
        if (ev.summary) {
            payload.title = msg.title = ev.summary;
        }
        if (ev.description) {
            payload.description = msg.description = ev.description;
        } else {
            delete msg.description;
        }
        if (ev.location) {
            /* intentionally the same object so that
             * if a node modifies msg.location (for
             * example by looking up
             * msg.location.description and adding
             * msg.location.{lat,lon} then both copies
             * will be updated.
             */
            payload.location = msg.location = {
                description: ev.location
            };
        } else {
            delete msg.location;
        }
        var start = getEventDate(ev);
        if (start) {
            payload.start = start;
        }
        if (ev.start && ev.start.date) {
            payload.allDayEvent = true;
        }
        var end = getEventDate(ev, 'end');
        if (end) {
            payload.end = end;
        }
        if (ev.creator) {
            payload.creator = {
                name: ev.creator.displayName,
                email: ev.creator.email,
            };
        }
        if (ev.attendees) {
            payload.attendees = [];
            ev.attendees.forEach(function (a) {
                payload.attendees.push({
                    name: a.displayName,
                    email: a.email
                });
            });
        }
        msg.data = ev;
        node.send(msg);
    }

    function getEventDate(ev, type) {
        if (typeof type === 'undefined') {
            type = 'start';
        }
        if (ev[type] && ev[type].dateTime) {
            return new Date(ev[type].dateTime);
        } else if (ev.start && ev.start.date || ev.end && ev.end.date) {
            return new Date(ev[type].date);
        } else {
            return null;
        }
    }

    function GoogleCalendarOutNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        this.calendar = n.calendar || 'primary';

        if (!this.google || !this.google.credentials.accessToken) {
            this.warn(RED._("calendar.warn.no-credentials"));
            return;
        }

        var node = this;
        node.status({fill:"blue",shape:"dot",text:"calendar.status.querying"});
        calendarList(node, function(err) {
            if (err) {
                node.error(err);
                node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                return;
            }
            node.status({});

            node.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"calendar.status.creating"});
                var cal = calendarByNameOrId(node, msg.calendar) ||
                    calendarByNameOrId(node, node.calendar);
                if (!cal) {
                    node.error(RED._("calendar.error.invalid-calendar"),msg);
                    node.status({fill:"red",shape:"ring",text:"calendar.status.invalid-calendar"});
                    return;
                }
                var request = {
                    method: 'POST',
                };
                if (typeof msg.payload === 'object') {
                    request.url = 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events';
                    request.body = msg.payload;
                } else {
                    request.url = 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events/quickAdd';
                    request.form = {
                        text: RED.util.ensureString(msg.payload)
                    };
                }
                if (node.sendNotifications || msg.sendNotifications) {
                    request.query = {
                        sendNotifications: true
                    };
                }
                node.google.request(request, function(err, data) {
                    if (err) {
                        node.error(err.toString(),msg);
                        node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                    } else if (data.error) {
                        node.error(data.error.message,msg);
                        node.status({fill:"red",shape:"ring",text:"calendar.status.failed"});
                    } else {
                        node.status({});
                    }
                });
            });
        });
    }
    RED.nodes.registerType("google calendar out", GoogleCalendarOutNode);
};
