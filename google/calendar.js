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
            //console.log("Calendars: "+require('util').inspect(node.calendars));
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
