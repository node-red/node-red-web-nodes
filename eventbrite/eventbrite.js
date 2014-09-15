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
    var request = require('request');
    var time = require('time');

    function EventbriteNode(n) {
        RED.nodes.createNode(this, n);
    }
    RED.nodes.registerType("eventbrite-credentials",EventbriteNode,{
        credentials: {
            appKey: { type:"text" },
            apiUserKey: { type: "password" },
        }
    });

    EventbriteNode.prototype.request = function(req, cb) {
        if (typeof req !== 'object') {
            req = { url: "https://www.eventbrite.com/json/" + req };
        }
        req.method = req.method || 'GET';
        req.json = req.json || true;
        req.qs = req.qs || {};
        req.qs.app_key = this.credentials.appKey;
        req.qs.user_key = this.credentials.apiUserKey;
        request(req, function(err, result, data) { cb(err, data); });
    };
    EventbriteNode.prototype.userListTickets = function(cb) {
        this.request('user_list_tickets', function(err, data) {
            if (err || data.error) {
                return cb(err, data);
            }
            /* For response details see:
             * http://developer.eventbrite.com/doc/users/user_list_tickets/
             */
            var res = [];
            var orders = flattenTrivialHashes(data.user_tickets[1].orders);
            for (var i = 0; i< orders.length; i++) {
                var o = orders[i];
                var ev = o.event;
                if (ev.hasOwnProperty('start_date') &&
                    ev.hasOwnProperty('timezone')) {
                    ev.start = new time.Date(ev.start_date, ev.timezone);
                }
                if (ev.hasOwnProperty('start_date') &&
                    ev.hasOwnProperty('timezone')) {
                    ev.end = new time.Date(ev.end_date, ev.timezone);
                }
                if (o.hasOwnProperty('created')) {
                    // no timezone is specified but it appears to be
                    // -0700
                    o.ctime = new time.Date(o.created, o.timezone||'US/Pacific');
                }
                if (o.hasOwnProperty('modified')) {
                    // no timezone is specified but it appears to be
                    // -0700
                    o.mtime = new time.Date(o.modified, o.timezone||'US/Pacific');
                }
                res.push(o);
            }
            cb(null, res);
        });
    };

    /**
     * Flattens JSON generated from XML that contains:
     *
     *   { "orders": [ { "order" : { k1: v1, k2: k2, ... } }, ... ] }
     *
     * to:
     *
     *   { "orders": [ { k1: v1, k2: k2, ... }, ... ] }
     */
    function flattenTrivialHashes(data) {
        if (data === null) {
            return data;
        } else if (Array.isArray(data)) {
            return data.map(flattenTrivialHashes);
        } else if (typeof data === 'object') {
            var k = Object.keys(data);
            if (k.length == 1) {
                return flattenTrivialHashes(data[k[0]]);
            } else {
                var res = {};
                for (var key in data) {
                    if (data.hasOwnProperty(key)) {
                         res[key] = flattenTrivialHashes(data[key]);
                    }
                }
                return res;
            }
        } else {
            return data;
        }
    }
    function EventbriteQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.eventbrite = RED.nodes.getNode(n.eventbrite);

        var credentials = this.eventbrite.credentials;
        var node = this;
        if (credentials && credentials.appKey && credentials.apiUserKey) {
            this.on("input",function(msg) {
                node.status({fill:"blue",shape:"dot",text:"querying"});
                node.eventbrite.userListTickets(function(err, data) {
                    if (err) {
                        node.error("Error: " + err);
                        node.status({fill:"red",shape:"ring",text:"failed"});
                        return;
                    }
                    if (data.error) {
                        node.status({fill:"red",shape:"ring",text:data.error.error_message});
                        return;
                    }
                    node.status({});
                    for (var i = 0; i < data.length; i++) {
                        msg.payload = data[i];
                        node.send(msg);
                    }
                });
            });
        }
    }
    RED.nodes.registerType("eventbrite",EventbriteQueryNode);
};
