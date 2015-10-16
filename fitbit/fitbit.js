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
    var OAuth= require('oauth').OAuth;
    var util = require("util");

    function getOAuth(client_key, client_secret) {
        return new OAuth(
            "https://api.fitbit.com/oauth/request_token",
            "https://api.fitbit.com/oauth/access_token",
            client_key,
            client_secret,
            1.0,
            null,
            "HMAC-SHA1"
        );
    }

    function FitbitNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
    }
    RED.nodes.registerType("fitbit-credentials",FitbitNode,{
        credentials: {
            username: {type:"text"},
            client_key: { type: "password"},
            client_secret: { type: "password"},
            access_token: {type: "password"},
            access_token_secret: {type:"password"}
        }
    });
    function today() {
        var d = new Date();
        var month = d.getMonth() + 1;
        var day = d.getDate();
        return d.getFullYear() + "-" +
            (month < 10 ? "0" : "") + month + "-" +
            (day < 10 ? "0" : "") + day;
    }

    function mainSleep(sleepList) {
        for (var i = 0; i < sleepList.length; i++) {
            if (sleepList[i].isMainSleep) {
                return sleepList[i];
            }
        }
    }

    function formatError(err) {
        var errors = [];
        if (err.statusCode === 503) {
             errors = JSON.parse(err.data).restrictions.map(function(e) {
                 return e.type + " \"" + e.message + "\"";
             });
        } else {
            errors = JSON.parse(err.data).errors.map(function(e) {
                 return e.errorType +
                    (e.fieldName ? " (" + e.fieldName + ")" : "") +
                    " \"" + e.message + "\"";
             });
        }
        return "Error "+ err.statusCode + ": " + errors.join(", ");
    }
    
    function FitbitInNode(n) {
        RED.nodes.createNode(this,n);
        this.fitbitConfig = RED.nodes.getNode(n.fitbit);
        this.dataType = n.dataType || 'badges';
        if (!this.fitbitConfig) {
            this.warn(RED._("fitbit.warn.missing-credentials"));
            return;
        }
        var credentials = this.fitbitConfig.credentials;
        if (credentials &&
            credentials.access_token && credentials.access_token_secret) {
            var oa = getOAuth(credentials.client_key,credentials.client_secret);
            var node = this;
            node.status({fill:"blue",shape:"dot",text:"fitbit.status.initializing"});
            var day = today();
            if (node.dataType === 'badges') {
                oa.get('https://api.fitbit.com/1/user/-/badges.json',
                       credentials.access_token,
                       credentials.access_token_secret,
                       function(err, body, response) {
                    if (err) {
                        node.error(formatError(err));
                        node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                        return;
                    }
                    node.state = JSON.parse(body).badges;
                    node.status({});
                    node.on('input', function(msg) {
                        node.status({fill:"blue",shape:"dot",text:"fitbit.status.querying"});
                        oa.get('https://api.fitbit.com/1/user/-/badges.json',
                               credentials.access_token,
                               credentials.access_token_secret,
                               function(err, body, response) {
                            if (err) {
                                node.error(formatError(err),msg);
                                node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                                return;
                            }
                            var badges = JSON.parse(body).badges;
                            outerLoop:
                            for (var i = 0; i < badges.length; i++) {
                                var badge = badges[i];
                                for (var j = 0; j < node.state.length; j++) {
                                    if (badge.name === node.state[j].name) {
                                        // already have this badge
                                        if (badge.timesAchieved > node.state[j].timesAchieved) {
                                            // achieved it again
                                            node.sendBadge(badge, "repeat");
                                        }
                                        continue outerLoop;
                                    }
                                }
                                // achieved new badge
                                node.sendBadge(badge, "new");
                            }
                            node.state = badges;
                            node.status({});
                        });
                    });
                    node.setInterval();
                });
            } else if (node.dataType === 'sleep') {
                oa.get('https://api.fitbit.com/1/user/-/sleep/date/'+day+'.json',
                       credentials.access_token,
                       credentials.access_token_secret,
                       function(err, body, response) {
                    if (err) {
                        node.error(formatError(err));
                        node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                        return;
                    }
                    var data = JSON.parse(body);
                    node.state = {
                        day: day,
                        sleep: mainSleep(data.sleep),
                    };
                    node.status({});
                    node.on('input', function(msg) {
                        node.status({fill:"blue",shape:"dot",text:"fitbit.status.querying"});
                        var day = today();
                        oa.get('https://api.fitbit.com/1/user/-/sleep/date/'+day+'.json',
                               credentials.access_token,
                               credentials.access_token_secret,
                               function(err, body, response) {
                            if (err) {
                                node.error(formatError(err),msg);
                                node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                                return;
                            }
                            var data = JSON.parse(body);
                            var sleep = mainSleep(data.sleep);
                            if (sleep &&
                                ( day !== node.state.day ||
                                  !node.state.sleep ) ) {
                                // new sleep record
                                node.send({ payload: sleep, data: sleep });
                                node.state = { day: day, sleep: sleep };
                            }
                            node.status({});
                        });
                    });
                    node.setInterval();
                });
            } else if (node.dataType === 'weight') {
                oa.get('https://api.fitbit.com/1/user/-/body/log/weight/date/'+day+'.json',
                       credentials.access_token,
                       credentials.access_token_secret,
                       function(err, body, response) {
                    if (err) {
                        node.error(formatError(err));
                        node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                        return;
                    }
                    var data = JSON.parse(body);
                    if( data.weight.length > 0){
                        node.state = {
                        logId: data.weight[data.weight.length-1].logId,
                        };
                    }
                    else {
                        node.state = {
                        logId: null,
                        };
                    }
                    node.status({});
                    node.on('input', function(msg) {
                        node.status({fill:"blue",shape:"dot",text:"fitbit.status.querying"});
                        var day = today();
                        oa.get('https://api.fitbit.com/1/user/-/body/log/weight/date/'+day+'.json',
                               credentials.access_token,
                               credentials.access_token_secret,
                               function(err, body, response) {
                            if (err) {
                                node.error(formatError(err),msg);
                                node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                                return;
                            }
                            var data = JSON.parse(body);
                            if( data.weight.length > 0){
                                if(data.weight[data.weight.length-1].logId != node.state.logId){
                                 node.send({  payload: data.weight[data.weight.length-1] });
                                 node.state = { 
                                    logId: data.weight[data.weight.length-1].logId,
                                    };
                                }
                        }
                        node.status({});
                        });
                    });
                    node.setInterval();
                });
            }else if (node.dataType === 'goals') {
                oa.get('https://api.fitbit.com/1/user/-/activities/date/'+day+'.json',
                       credentials.access_token,
                       credentials.access_token_secret,
                       function(err, body, response) {
                    if (err) {
                        node.error(formatError(err));
                        node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                        return;
                    }
                    var data = JSON.parse(body);
                    node.state = {
                        day: day,
                        summary: data.summary,
                    };
                    node.status({});
                    node.on('input', function(msg) {
                        node.status({fill:"blue",shape:"dot",text:"fitbit.status.querying"});
                        var day = today();
                        var fetchDay = day;
                        if (day !== node.state.day) {
                            // it is a new day so pull the final data for
                            // previous day. handle next day at next interval
                            fetchDay = node.state.day;
                        }
                        oa.get('https://api.fitbit.com/1/user/-/activities/date/'+fetchDay+'.json',
                               credentials.access_token,
                               credentials.access_token_secret,
                               function(err, body, response) {
                            if (err) {
                                node.error(formatError(err),msg);
                                node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                                return;
                            }
                            var data = JSON.parse(body);
                            if (data.summary.steps >= data.goals.steps &&
                                (!node.state.summary ||
                                 node.state.summary.steps < data.goals.steps)) {
                                node.send({ payload: data.goals.steps + ' steps goal achieved', data: data });
                            }
                            if (data.summary.floors >= data.goals.floors &&
                                (!node.state.summary ||
                                 node.state.summary.floors < data.goals.floors)) {
                                node.send({ payload: data.goals.floors + ' floors goal achieved', data: data });
                            }
                            if (data.summary.veryActiveMinutes >= data.goals.activeMinutes &&
                                (!node.state.summary ||
                                 node.state.summary.veryActiveMinutes < data.goals.activeMinutes)) {
                                node.send({ payload: data.goals.activeMinutes + ' active minutes goal achieved', data: data });
                            }
                            if (fetchDay !== day) {
                                node.state = { day: day };
                            } else {
                                node.state.summary = data.summary;
                            }
                            node.status({});
                        });
                    });
                    node.setInterval();
                });
            }
        }
    }
    RED.nodes.registerType("fitbit in",FitbitInNode);
    FitbitInNode.prototype.sendBadge = function(badge, type) {
        this.send({
            type: type,
            payload: badge.earnedMessage,
            title: badge.name,
            description: badge.marketingDescription,
            data: badge,
        });
    };

    FitbitInNode.prototype.setInterval = function(repeat) {
        repeat = repeat || 900000; // 15 minutes
        var node = this;
        var interval = setInterval(function() {
            node.emit("input", {});
        }, repeat);
        this.on("close", function() {
            if (interval !== null) {
                clearInterval(interval);
            }
        });
    };

    function FitbitQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.fitbitConfig = RED.nodes.getNode(n.fitbit);
        this.dataType = n.dataType || 'activities';
        var supportedTypes = ["activities","sleep","weight","badges"];
        if (supportedTypes.indexOf(this.dataType) == -1) {
            this.error(RED._("fitbit.error.unsupported-data-type"));
            return;
        }
        if (!this.fitbitConfig) {
            this.error(RED._("fitbit.error.missing-credentials"));
            return;
        }
        var credentials = this.fitbitConfig.credentials;
        if (credentials && credentials.access_token && credentials.access_token_secret) {
            var oa = getOAuth(credentials.client_key,credentials.client_secret);
            var node = this;
            this.on('input', function(msg) {
                node.status({fill:"blue",shape:"dot",text:"fitbit.status.querying"});
                var url;
                if (node.dataType === 'activities' ||
                    node.dataType === 'sleep') {
                    var day = msg.date || today();
                    url = 'https://api.fitbit.com/1/user/-/' +
                        node.dataType + '/date/' + day + '.json';
                } else if (node.dataType === 'badges') {
                    url = 'https://api.fitbit.com/1/user/-/badges.json';
                } else if (node.dataType === 'weight') {
                    var day = msg.date || today();
                    url = 'https://api.fitbit.com/1/user/-/body/log/weight/date/' + day + '.json';
                }
                oa.get(url,
                       credentials.access_token,
                       credentials.access_token_secret,
                       function(err, body, response) {
                    if (err) {
                        node.error(formatError(err),msg);
                        node.status({fill:"red",shape:"ring",text:"fitbit.status.failed"});
                        return;
                    }
                    var data = JSON.parse(body);
                    msg.data = data;
                    if (node.dataType === 'sleep') {
                        var sleep = mainSleep(data.sleep);
                        if (!sleep) {
                            node.warn(RED._("fitbit.warn.no-sleep-record"));
                            node.status({});
                            return;
                        } else {
                            msg.payload = sleep;
                            delete msg.error;
                        }
                    } else if (node.dataType === 'weight') {
                        if( data.weight.length > 0) {
                            msg.payload = data.weight.reverse();
                            msg.data = data.weight[data.weight.length-1];
                            delete msg.error;
                        } else {
                            node.warn(RED._("fitbit.warn.no-weight-record")+" "+day);
                            node.status({});
                            return;
                        }
                    } else {
                        msg.payload = data;
                    }
                    node.status({});
                    node.send(msg);
                });
            });
        }
    }
    RED.nodes.registerType("fitbit",FitbitQueryNode);

    RED.httpAdmin.get('/fitbit-credentials/:id/auth', function(req, res){
        if (!req.query.client_key || !req.query.client_secret ||
            !req.query.callback) {
            res.send(400);
            return;
        }

        var credentials = {
            client_key:req.query.client_key,
            client_secret: req.query.client_secret
        };
        RED.nodes.addCredentials(req.params.id, credentials);

        var oa = getOAuth(credentials.client_key, credentials.client_secret);

        oa.getOAuthRequestToken({
            oauth_callback: req.query.callback
        }, function(error, oauth_token, oauth_token_secret, results) {
            if (error) {
                res.send(RED._("fitbit.error.oautherror",{statusCode: error.statusCode, errorData: error.data}));
            } else {
                credentials.oauth_token = oauth_token;
                credentials.oauth_token_secret = oauth_token_secret;
                res.redirect('https://www.fitbit.com/oauth/authorize?oauth_token='+oauth_token);
                RED.nodes.addCredentials(req.params.id,credentials);
            }
        });
    });

    RED.httpAdmin.get('/fitbit-credentials/:id/auth/callback', function(req, res, next){
        var credentials = RED.nodes.getCredentials(req.params.id);
        credentials.oauth_verifier = req.query.oauth_verifier;
        var client_key = credentials.client_key;
        var client_secret = credentials.client_secret;
        var oa = getOAuth(client_key,client_secret);

        oa.getOAuthAccessToken(
            credentials.oauth_token,
            credentials.oauth_token_secret,
            credentials.oauth_verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results){
                if (error){
                    res.send(RED._("fitbit.error.oautherror",{statusCode: error.statusCode, errorData: error.data}));
                } else {
                    credentials = {};
                    credentials.client_key = client_key;
                    credentials.client_secret = client_secret;
                    credentials.access_token = oauth_access_token;
                    credentials.access_token_secret = oauth_access_token_secret;
                    oa.get('https://api.fitbit.com/1/user/-/profile.json', credentials.access_token, credentials.access_token_secret, function(err, body, response) {
                          if (err) {
                            return res.send(RED._("fitbit.error.oautherror",{statusCode: err.statusCode, errorData: err.data}));
                        }
                        var data = JSON.parse(body);
                        credentials.username = data.user.fullName;
                        RED.nodes.addCredentials(req.params.id,credentials);
                        res.send(RED._("fitbit.error.authorized"));
                    });
                }
            }
        );
    });
};
