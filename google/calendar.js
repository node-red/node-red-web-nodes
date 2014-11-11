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

    function GoogleCalendarQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        this.calendar = n.calendar || 'primary';

        this.calendars = {};
        if (!this.google || !this.google.credentials.accessToken) {
            this.warn("Missing google credentials");
            return;
        }

        var node = this;
        node.status({fill:"blue",shape:"dot",text:"querying"});
        this.google.request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function(err, data) {
            if (err) {
                node.error("failed to fetch calendar list: " + err.toString());
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            }
            if (data.error) {
                node.error("failed to fetch calendar list: " +
                           data.error.message);
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            }
            for (var i = 0; i < data.items.length; i++) {
                var cal = data.items[i];
                if (cal.primary) {
                    node.calendars.primary = cal;
                }
                node.calendars[cal.id] = cal;
            }
            node.status({});

            node.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"querying"});
                var cal = node.calendars[msg.calendar] || node.calendarByName(msg.calendar) || node.calendars[node.calendar] || node.calendarByName(node.calendar);
                if (!cal) {
                    node.status({fill:"red",shape:"ring",text:"invalid calendar"});
                    return;
                }
                var request = {
                    url: 'https://www.googleapis.com/calendar/v3/calendars/'+cal.id+'/events',
                };
                var now = new Date();
                request.qs = {
                    maxResults: 10,
                    orderBy: 'startTime',
                    singleEvents: true,
                    showDeleted: false,
                    timeMin: now.toISOString()
                };
                if (msg.payload) {
                    request.qs.q = RED.util.ensureString(msg.payload);
                }
                node.google.request(request, function(err, data) {
                    if (err) {
                        node.error("Error: " + err.toString());
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else if (data.error) {
                        node.error("Error " + data.error.code + ": " +
                                JSON.stringify(data.error.message));
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else {
                        var payload = msg.payload = {};
                        var ev;
                        /* 0 - 10 events ending after now ordered by startTime
                         * so we find the first that starts after now to
                         * give us the "next" event
                         */
                        for (var i = 0; i<data.items.length; i++) {
                            ev = data.items[i];
                            var start = getEventDate(ev);
                            if (start && start.getTime() > now.getTime()) {
                                payload.start = start;
                                break;
                            }
                            ev = undefined;
                        }
                        if (!ev) {
                            delete msg.data;
                            node.send(msg);
                            node.status({fill:"red",shape:"ring",text:"no event"});
                            return;
                        }
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
                        node.status({});
                    }
                });
            });
        });
    }
    RED.nodes.registerType("google calendar", GoogleCalendarQueryNode);

    function getEventDate(ev, type) {
        if (typeof type === 'undefined') {
            type = 'start';
        }
        if (ev[type] && ev[type].dateTime) {
            return new Date(ev[type].dateTime);
        } else if (ev.start && ev.start.date) {
            return new Date(ev[type].date);
        } else {
            return null;
        }
    }

    GoogleCalendarQueryNode.prototype.calendarByName = function(name) {
        for (var cal in this.calendars) {
            if (this.calendars.hasOwnProperty(cal)) {
                if (this.calendars[cal].summary === name) {
                    return this.calendars[cal];
                }
            }
        }
        return;
    };

    function GoogleCalendarOutNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        this.calendar = n.calendar || 'primary';

        this.calendars = {};
        if (!this.google || !this.google.credentials.accessToken) {
            this.warn("Missing google credentials");
            return;
        }

        var node = this;
        node.status({fill:"blue",shape:"dot",text:"querying"});
        this.google.request('https://www.googleapis.com/calendar/v3/users/me/calendarList', function(err, data) {
            if (err) {
                node.error("failed to fetch calendar list: " + err.toString());
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            }
            if (data.error) {
                node.error("failed to fetch calendar list: " +
                           data.error.message);
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            }
            for (var i = 0; i < data.items.length; i++) {
                var cal = data.items[i];
                if (cal.primary) {
                    node.calendars.primary = cal;
                }
                    node.calendars[cal.id] = cal;
            }
            node.status({});

            node.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"creating"});
                var cal = node.calendars[msg.calendar] || node.calendarByName(msg.calendar) || node.calendars[node.calendar];
                if (!cal) {
                    node.status({fill:"red",shape:"ring",text:"invalid calendar"});
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
                        node.error(err.toString());
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else if (data.error) {
                        node.error(data.error.message);
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else {
                        node.status({});
                    }
                });
            });
        });
    }
    RED.nodes.registerType("google calendar out", GoogleCalendarOutNode);

    GoogleCalendarOutNode.prototype.calendarByName = function(name) {
        for (var cal in this.calendars) {
            if (this.calendars.hasOwnProperty(cal)) {
                if (this.calendars[cal].summary === name) {
                    return this.calendars[cal];
                }
            }
        }
        return;
    };
}
