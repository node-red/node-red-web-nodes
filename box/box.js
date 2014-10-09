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
    var crypto = require("crypto");
    var fs = require("fs");
    var request = require("request");
    var url = require("url");

    function BoxNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("box-credentials", BoxNode, {
        credentials: {
            displayName: {type:"text"},
            clientId: {type:"text"},
            clientSecret: {type:"password"},
            accessToken: {type:"password"},
            refreshToken: {type:"password"},
            expireTime: {type:"password"}
        }
    });

    BoxNode.prototype.refreshToken = function(cb) {
        var credentials = this.credentials;
        var node = this;
        //console.log("refreshing token: " + credentials.refreshToken);
        if (!credentials.refreshToken) {
            node.error("No refresh token to regain Box access");
            return cb('No refresh token to regain Box access');
        }
        request.post({
            url: 'https://api.box.com/oauth2/token',
            json: true,
            form: {
                grant_type: 'refresh_token',
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                refresh_token: credentials.refreshToken,
            },
        }, function(err, result, data) {
            if (err) {
                node.error("refresh token request error:" + err);
                return;
            }
            if (data.error) {
                node.error("refresh token error: " + data.error.message);
                return;
            }
            // console.log("refreshed: " + require('util').inspect(data));
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
        });
    };

    BoxNode.prototype.request = function(req, retries, cb) {
        var node = this;
        if (typeof retries === 'function') {
            cb = retries;
            retries = 1;
        }
        if (typeof req !== 'object') {
            req = { url: req };
        }
        req.method = req.method || 'GET';
        req.json = req.json || true;
        // always set access token to the latest ignoring any already present
        req.auth = { bearer: this.credentials.accessToken };
        if (!this.credentials.expireTime ||
            this.credentials.expireTime < (new Date().getTime()/1000)) {
            if (retries === 0) {
                node.error("too many refresh attempts, giving up");
                cb('too many refresh attempts, giving up');
                return;
            }
            node.warn("trying to refresh token due to expiry");
            node.refreshToken(function (err) {
                if (err) {
                    return;
                }
                node.request(req, 0, cb);
            });
            return;
        }
        return request(req, function(err, result, data) {
            if (err) {
                // handled in callback
                return cb(err, data);
            }
            if (result.statusCode === 401 && retries > 0) {
                retries--;
                node.warn("refreshing access token after 401 error");
                node.refreshToken(function (err) {
                    if (err) {
                        return cb(err, null);
                    }
                    return node.request(req, retries, cb);
                });
            }
            if (result.statusCode >= 400) {
                return cb(result.statusCode + ": " + data.message, data);
            }
            return cb(err, data);
        });
    };

    BoxNode.prototype.resolvePath = function(path, parent_id, cb) {
        var node = this;
        if (typeof parent_id === 'function') {
            cb = parent_id;
            parent_id = 0;
        }
        if (typeof path === "string") {
            // split path and remove empty string components
            path = path.split("/").filter(function(e) { return e !== ""; });
            // TODO: could also handle '/blah/../' and '/./' perhaps
        } else {
            path = path.filter(function(e) { return e !== ""; });
        }
        if (path.length === 0) {
            return cb(null, parent_id);
        }
        var folder = path.shift();
        node.request('https://api.box.com/2.0/folders/'+parent_id,
                     function(err, data) {
            if (err) {
                return cb(err, -1);
            }
            var entries = data.item_collection.entries;
            for (var i = 0; i < entries.length; i++) {
                if (entries[i].type === 'folder' &&
                    entries[i].name === folder) {
                    // found
                    return node.resolvePath(path, entries[i].id, cb);
                }
            }
            return cb("not found", -1);
        });
    };

    RED.httpAdmin.get('/box-credentials/auth', function(req, res){
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

        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        credentials.csrfToken = csrfToken;
        credentials.callback = callback;
        res.cookie('csrf', csrfToken);
        res.redirect(url.format({
            protocol: 'https',
            hostname: 'app.box.com',
            pathname: '/api/oauth2/authorize',
            query: {
                response_type: 'code',
                client_id: credentials.clientId,
                state: node_id + ":" + csrfToken,
                redirect_uri: callback
            }
        }));
        RED.nodes.addCredentials(node_id, credentials);
    });

    RED.httpAdmin.get('/box-credentials/auth/callback', function(req, res) {
        if (req.query.error) {
            return res.send('ERROR: '+ req.query.error + ': ' + req.query.error_description);
        }
        var state = req.query.state.split(':');
        var node_id = state[0];
        var credentials = RED.nodes.getCredentials(node_id);
        if (!credentials || !credentials.clientId || !credentials.clientSecret) {
            return res.send('ERROR: no credentials - should never happen');
        }
        if (state[1] !== credentials.csrfToken) {
            return res.status(401).send(
                'CSRF token mismatch, possible cross-site request forgery attempt.'
            );
        }

        request.post({
            url: 'https://app.box.com/api/oauth2/token',
            json: true,
            form: {
                grant_type: 'authorization_code',
                code: req.query.code,
                client_id: credentials.clientId,
                client_secret: credentials.clientSecret,
                redirect_uri: credentials.callback,
            },
        }, function(err, result, data) {
            if (err) {
                console.log("request error:" + err);
                return res.send("yeah something broke.");
            }
            if (data.error) {
                console.log("oauth error: " + data.error);
                return res.send("yeah something broke.");
            }
            //console.log("data: " + require('util').inspect(data));
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
                url: 'https://api.box.com/2.0/users/me',
                json: true,
                auth: { bearer: credentials.accessToken },
            }, function(err, result, data) {
                if (err) {
                    console.log('fetching box profile failed: ' + err);
                    return res.send("auth worked but profile fetching failed");
                }
                if (result.statusCode >= 400) {
                    console.log('fetching box profile failed: ' +
                                result.statusCode + ": " + data.message);
                    return res.send("auth worked but profile fetching failed");
                }
                if (!data.name) {
                    console.log('fetching box profile failed: no name found');
                    return res.send("auth worked but profile fetching failed");
                }
                credentials.displayName = data.name;
                RED.nodes.addCredentials(node_id, credentials);
                res.send("<html><head></head><body>Authorised - you can close this window and return to Node-RED</body></html>");
            });
        });
    });

    function BoxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn("Missing box credentials");
            return;
        }

        node.on("input", function(msg) {
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.warn("No filename specified");
                return;
            }
            var path = filename.split("/");
            var basename = path.pop();
            node.status({fill:"blue",shape:"dot",text:"resolving path"});
            var localFilename = node.localFilename || msg.localFilename;
            if (!localFilename && typeof msg.payload === "undefined") {
                return;
            }
            node.box.resolvePath(path, function(err, parent_id) {
                if (err) {
                    node.error("failed to resolve path: " + err.toString());
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    return;
                }
                node.status({fill:"blue",shape:"dot",text:"uploading"});
                var r = node.box.request({
                    method: 'POST',
                    url: 'https://upload.box.com/api/2.0/files/content',
                }, function(err, data) {
                    if (err) {
                        console.log("data: " + require('util').inspect(data));
                        if (data && data.status === 409 &&
                            data.context_info && data.context_info.conflicts) {
                            // existing file, attempt to overwrite it
                            node.status({fill:"blue",shape:"dot",text:"overwriting"});
                            var r = node.box.request({
                                method: 'POST',
                                url: 'https://upload.box.com/api/2.0/files/'+
                                    data.context_info.conflicts.id+'/content',
                            }, function(err, data) {
                                if (err) {
                                    node.error("failed upload: " + err.toString());
                                    node.status({fill:"red",shape:"ring",text:"failed"});
                                    return;
                                }
                                node.status({});
                            });
                            var form = r.form();
                            if (localFilename) {
                                form.append('filename', fs.createReadStream(localFilename),
                                            { filename: basename });
                            } else {
                                form.append('filename', RED.util.ensureBuffer(msg.payload),
                                { filename: basename });
                            }
                        } else {
                            node.error("failed upload: " + err.toString());
                            node.status({fill:"red",shape:"ring",text:"failed"});
                        }
                        return;
                    }
                    node.status({});
                });
                var form = r.form();
                if (localFilename) {
                    form.append('filename', fs.createReadStream(localFilename),
                                { filename: basename });
                } else {
                    form.append('filename', RED.util.ensureBuffer(msg.payload),
                                { filename: basename });
                }
                form.append('parent_id', parent_id);
            });
        });
    }
    RED.nodes.registerType("box out",BoxOutNode);
};
