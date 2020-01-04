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
    var crypto = require("crypto");
    var url = require('url');
    var backoff = require('backoff');
    var events = require('events');

    function GoogleNode(n) {
        RED.nodes.createNode(this,n);
        this.displayName = n.displayName;
        this.eventEmitter = new events();
    }
    RED.nodes.registerType("google-credentials",GoogleNode,{
        credentials: {
            displayName: {type:"text"},
            clientId: {type:"text"},
            clientSecret: {type:"password"},
            accessToken: {type:"password"},
            refreshToken: {type:"password"},
            expireTime: {type:"password"}
        }
    });

    function createExponentialBackoff() {
        var exponentialBackoff = backoff.exponential({
            initialDelay: 100,
            maxDelay: 73000,
            factor: 9
        });
        exponentialBackoff.failAfter(4);
        return exponentialBackoff;
    }

    GoogleNode.prototype.refreshToken = function(cb) {
        var credentials = this.credentials;
        var node = this;

        if (!credentials.refreshToken) {
            node.error(RED._("google.error.no-refresh-token"));
            return cb(RED._("google.error.no-refresh-token"));
        }

        var exponentialBackoff = createExponentialBackoff();
        exponentialBackoff.on('backoff', function(number, delay) {
            node.warn(RED._("google.warn.retry-request", {number: number + 1, delay: delay}));
            node.eventEmitter.emit('retry', delay);
        });
        exponentialBackoff.on('fail', function() {
            node.error(RED._("google.error.too-many-refresh-attempts"));
            cb(RED._("google.error.too-many-refresh-attempts"));
        });
        exponentialBackoff.on('ready', function() {
            request.post(
                {
                    url: 'https://accounts.google.com/o/oauth2/token',
                    json: true,
                    form: {
                        grant_type: 'refresh_token',
                        client_id: credentials.clientId,
                        client_secret: credentials.clientSecret,
                        refresh_token: credentials.refreshToken,
                    },
                },
                function(err, result, data) {
                    if (err) {
                        node.error(RED._("google.error.token-request-error", {err: err}));
                        return exponentialBackoff.backoff();
                    }
                    if (data.error) {
                        node.error(RED._("google.error.refresh-token-error", {message: data.error.message}));
                        return exponentialBackoff.backoff();
                    }

                    credentials.accessToken = data.access_token;
                    if (data.refresh_token) {
                        credentials.refreshToken = data.refresh_token;
                    }
                    credentials.expiresIn = data.expires_in;
                    credentials.expireTime =
                        data.expires_in + (new Date().getTime()/1000);
                    credentials.tokenType = data.token_type;
                    RED.nodes.addCredentials(node.id, credentials);
                    if (typeof cb !== undefined) {
                        cb();
                    }
                }
            );
        });

        exponentialBackoff.emit('ready');
    };

    GoogleNode.prototype.request = function(req, cb) {
        var node = this;

        if (typeof req !== 'object') {
            req = { url: req };
        }
        req.method = req.method || 'GET';
        if (!req.hasOwnProperty("json")) {
            req.json = true;
        }
        // always set access token to the latest ignoring any already present
        req.auth = { bearer: this.credentials.accessToken };
        //console.log(require('util').inspect(req));
        if (!this.credentials.expireTime ||
            this.credentials.expireTime < (new Date().getTime()/1000)) {
            node.refreshToken(function (err) {
                if (err) {
                    return cb(err);
                }
                node.request(req, cb);
            });
            return;
        }

        var exponentialBackoff = createExponentialBackoff();
        exponentialBackoff.on('backoff', function(number, delay) {
            node.warn(RED._("google.warn.retry-request", {number: number + 1, delay: delay}));
            node.eventEmitter.emit('retry', delay);
        });
        exponentialBackoff.on('fail', function(reason) {
            node.error(RED._("google.error.too-many-refresh-attempts"));
            cb(reason.err, reason.data);
        });
        exponentialBackoff.on('ready', function() {
            request(req, function(err, result, data) {
                if (err) {
                    return exponentialBackoff.backoff({err: err, data: data});
                } else if (result.statusCode >= 400) {
                    data = {
                        error: {
                            code: result.statusCode,
                            message: result.body,
                        },
                    };
                    return exponentialBackoff.backoff({err: err, data: data});
                } else if (data.error && data.error.code === 401) {
                    node.warn(RED._("google.warn.refreshing-accesstoken"));
                    node.refreshToken(function (err) {
                        if (err) {
                            return cb(err);
                        }
                        return node.request(req, cb);
                    });
                }
                cb(err, data);
            });
        });

        exponentialBackoff.emit('ready');
    };

    RED.httpAdmin.get('/google-credentials/auth', function(req, res){
        if (!req.query.clientId || !req.query.clientSecret ||
            !req.query.id || !req.query.callback) {
            res.send(400);
            return;
        }
        var node_id = req.query.id;
        var callback = req.query.callback;
        var credentials = {
            clientId: req.query.clientId,
            clientSecret: req.query.clientSecret
        };

        var gPlusScopes = 'https://www.googleapis.com/auth/plus.login https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/plus.me https://www.googleapis.com/auth/userinfo.profile';
        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        credentials.csrfToken = csrfToken;
        credentials.callback = callback;
        res.cookie('csrf', csrfToken);
        res.redirect(url.format({
            protocol: 'https',
            hostname: 'accounts.google.com',
            pathname: '/o/oauth2/auth',
            query: {
                response_type: 'code',
                client_id: credentials.clientId,
                state: node_id + ":" + csrfToken,
                access_type: 'offline',
                approval_prompt: 'force',
                scope : 'profile https://www.googleapis.com/auth/calendar ' + gPlusScopes,
                // TODO: include_granted_scopes: 'true', ?
                redirect_uri: callback
            }
        }));
        RED.nodes.addCredentials(node_id, credentials);
    });

    RED.httpAdmin.get('/google-credentials/auth/callback', function(req, res) {
        if (req.query.error) {
            return res.send(RED._("google.error.error", {error: req.query.error, description: req.query.error_description}));
        }
        var state = req.query.state.split(':');
        var node_id = state[0];
        var credentials = RED.nodes.getCredentials(node_id);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
            console.log("credentials not present?");
            return res.send(RED._("google.error.no-credentials"));
        }
        if (state[1] !== credentials.csrfToken) {
            return res.status(401).send(
                RED._("google.error.token-mismatch")
            );
        }

        request.post({
            url: 'https://accounts.google.com/o/oauth2/token',
            json: true,
            form: {
                grant_type: 'authorization_code',
                code: req.query.code,
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                redirect_uri: credentials.callback
            },
        }, function(err, result, data) {
            if (err) {
                console.log("request error:" + err);
                return res.send(RED._("google.error.something-broke"));
            }
            if (data.error) {
                console.log("oauth error: " + data.error);
                return res.send(RED._("google.error.something-broke"));
            }
            credentials.accessToken = data.access_token;
            credentials.refreshToken = data.refresh_token;
            credentials.expiresIn = data.expires_in;
            credentials.expireTime =
                data.expires_in + (new Date().getTime()/1000);
            credentials.tokenType = data.token_type;
            delete credentials.csrfToken;
            delete credentials.callback;
            RED.nodes.addCredentials(node_id, credentials);
            request.get({
                url: 'https://www.googleapis.com/userinfo/v2/me',
                json: true,
                auth: { bearer: credentials.accessToken },
            }, function(err, result, data) {
                if (err) {
                    console.log('fetching google profile failed: ' + err);
                    return res.send("auth worked but profile fetching failed");
                }
                if (data.error) {
                    console.log('fetching google profile failed: ' +
                                data.error.message);
                    return res.send(RED._("google.error.profile-fetch-failed"));
                }
                credentials.displayName = data.displayName;
                RED.nodes.addCredentials(node_id, credentials);
                res.send(RED._("google.message.authorized"));
            });
        });
    });

    function GoogleAPINode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("google-api-config",GoogleAPINode,{
        credentials: {
            key: { type:"password" }
        }
    });
    GoogleAPINode.prototype.request = function(req, cb) {
        if (typeof req !== 'object') {
            req = { url: req };
        }
        req.method = req.method || 'GET';
        if (!req.hasOwnProperty("json")) {
            req.json = true;
        }
        if (!req.qs) {
            req.qs = {};
        }
        req.qs.key = this.credentials.key;
        return request(req, function(err, result, data) {
            if (err) {
                return cb(err.toString(), null);
            }
            if (result.statusCode >= 400) {
                return cb(RED._("google.error.httperror", {statusCode: result.statusCode}), data);
            }
            if (data && data.status !== 'OK') {
                var error = RED._("google.error.apierror", {status: data.status});
                if (data.error_message) {
                    error += ": " + data.error_message;
                }
                return cb(error, data);
            }
            return cb(null, data);
        });
    };
};
