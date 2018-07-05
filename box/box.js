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
    var minimatch = require("minimatch");

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
            // TODO: add a timeout to make sure we make a request
            // every so often (if no flows trigger one) to ensure the
            // refresh token does not expire
            node.error(RED._("box.error.no-refresh-token"));
            return cb(RED._("box.error.no-refresh-token"));
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
                node.error(RED._("box.error.token-request-error",{err:err}));
                return;
            }
            if (data.error) {
                node.error(RED._("box.error.refresh-token-error",{message:data.error}));
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
        if (!req.hasOwnProperty("json")) {
            req.json = true;
        }
        // always set access token to the latest ignoring any already present
        req.auth = { bearer: this.credentials.accessToken };
        if (!this.credentials.expireTime ||
            this.credentials.expireTime < (new Date().getTime()/1000)) {
            if (retries === 0) {
                node.error(RED._("box.error.too-many-refresh-attempts"));
                cb(RED._("box.error.too-many-refresh-attempts"));
                return;
            }
            node.warn(RED._("box.warn.refresh-token"));
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
                node.warn(RED._("box.warn.refresh-401"));
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

    BoxNode.prototype.folderInfo = function(parent_id, cb) {
        this.request('https://api.box.com/2.0/folders/'+parent_id, cb);
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
        node.folderInfo(parent_id, function(err, data) {
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
            return cb(RED._("box.error.not-found"), -1);
        });
    };

    BoxNode.prototype.resolveFile = function(path, parent_id, cb) {
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
            return cb(RED._("box.error.missing-filename"), -1);
        }
        var file = path.pop();
        node.resolvePath(path, function(err, parent_id) {
            if (err) {
                return cb(err, parent_id);
            }
            node.folderInfo(parent_id, function(err, data) {
                if (err) {
                    return cb(err, -1);
                }
                var entries = data.item_collection.entries;
                for (var i = 0; i < entries.length; i++) {
                    if (entries[i].type === 'file' &&
                        entries[i].name === file) {
                        // found
                        return cb(null, entries[i].id);
                    }
                }
                return cb(RED._("box.error.not-found"), -1);
            });
        });
    };

    function constructFullPath(entry) {
        if (entry.path_collection) {
            var parentPath = entry.path_collection.entries
                .filter(function (e) { return e.id !== "0"; })
                .map(function (e) { return e.name; })
                .join('/');
            return (parentPath !== "" ? parentPath+'/' : "") + entry.name;
        }
        return entry.name;
    }

    RED.httpAdmin.get('/box-credentials/auth', function(req, res) {
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
            return res.send(RED._("box.error.no-credentials"));
        }
        if (state[1] !== credentials.csrfToken) {
            return res.status(401).send(
                RED._("box.error.token-mismatch")
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
                return res.send(RED._("box.error.something-broke"));
            }
            if (data.error) {
                console.log("oauth error: " + data.error);
                return res.send(RED._("box.error.something-broke"));
            }
            //console.log("data: " + require('util').inspect(data));
            credentials.accessToken = data.access_token;
            credentials.refreshToken = data.refresh_token;
            credentials.expiresIn = data.expires_in;
            credentials.expireTime = data.expires_in + (new Date().getTime()/1000);
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
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                if (result.statusCode >= 400) {
                    console.log('fetching box profile failed: ' +
                                result.statusCode + ": " + data.message);
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                if (!data.name) {
                    console.log('fetching box profile failed: no name found');
                    return res.send(RED._("box.error.profile-fetch-failed"));
                }
                credentials.displayName = data.name;
                RED.nodes.addCredentials(node_id, credentials);
                res.send(RED._("box.error.authorized"));
            });
        });
1    });

    function BoxInNode(n) {
        RED.nodes.createNode(this,n);
        this.filepattern = n.filepattern || "";
        this.interval = n.interval || 60;
        this.longpolling = Boolean(n.longpolling);
        this.box = RED.nodes.getNode(n.box);
        this.seenEvents = {};
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }
        node.status({fill:"blue",shape:"dot",text:"box.status.initializing"});
        
        // this will fire once the initial stream position is determined
        node.on('ready', function () {
            if (node.longpolling) {
                node.startLongPolling();
            } else {
                node.startIntervalPolling();
            }
        });

        // this fires if either the long-poller says we should have data, or on an interval.
        node.on('check-events', function() {
            node.status({fill:"blue",shape:"dot",text:"box.status.checking-for-events"});
            node.box.request({
                url: 'https://api.box.com/2.0/events?stream_position='+node.state+'&stream_type=changes',
            }, function(err, data) {
                if (err) {
                    node.error(RED._("box.error.events-fetch-failed",{err:err.toString()}),{});
                    node.status({});
                    return;
                }
                node.status({});
                node.state = data.next_stream_position;
                node.emit('ready');
                for (var i = 0; i < data.entries.length; i++) {
                    // TODO: support other event types
                    // TODO: suppress duplicate events
                    // for both of the above see:
                    //    https://developers.box.com/docs/#events
                    var event;
                    if (node.seenEvents[data.entries[i].event_id]) {
                        continue;
                    }
                    node.seenEvents[data.entries[i].event_id] = true;
                    if (data.entries[i].event_type === 'ITEM_CREATE') {
                        event = 'add';
                    } else if (data.entries[i].event_type === 'ITEM_UPLOAD') {
                        event = 'add';
                    } else if (data.entries[i].event_type === 'ITEM_RENAME') {
                        event = 'add';
                        // TODO: emit delete event?
                    } else if (data.entries[i].event_type === 'ITEM_TRASH') {
                        // need to find old path
                        node.lookupOldPath({}, data.entries[i], 'delete');
                        /* strictly speaking the {} argument above should
                        * be clone(msg) but:
                        *   - it must be {}
                        *   - if there was any possibility of a different
                        *     msg then it should be cloned using the
                        *     node-red/red/nodes/Node.js cloning function
                        */
                        continue;
                    } else {
                        event = 'unknown';
                    }
                    //console.log(JSON.stringify(data.entries[i], null, 2));
                    node.sendEvent({}, data.entries[i], event);
                }
            });
        });

        node.getInitialStreamPosition();
    }
    
    RED.nodes.registerType("box in", BoxInNode);

    BoxInNode.prototype.sendEvent = function(msg, entry, event, path) {
        var source = entry.source;
        if (typeof path === "undefined") {
            path = constructFullPath(source);
        }
        if (this.filepattern && !minimatch(path, this.filepattern)) {
            return;
        }
        msg.file = source.name;
        msg.payload = path;
        msg.event = event;
        msg.data = entry;
        this.send(msg);
    };

    BoxInNode.prototype.lookupOldPath = function (msg, entry, event) {
        var source = entry.source;
        this.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
        var node = this;
        node.box.folderInfo(source.parent.id, function(err, folder) {
            if (err) {
                node.warn(RED._("box.warn.old-path-failed",{err:err.toString()}));
                node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                return;
            }
            node.status({});
            // TODO: add folder path_collection to entry.parent?
            var parentPath = constructFullPath(folder);
            node.sendEvent(msg, entry, event,
                (parentPath !== "" ? parentPath + '/' : '') + source.name);
        });
    };

    /**
     * Init long-polling to retrieve events from Box in real-time
     * 
     * If long polling is enabled, we make an OPTIONS request to the "events"
     * endpoint.  this endpoint will return another URL to poll, in addition
     * to a "timeout" value.  we will then make a GET request to the supplied URL
     * and wait for a response.  if the response is "new_change", we hit the
     * "events" endpoint with the usual GET request (and stream position).  if the
     * response is "retry_timeout", we retry the operation again from the OPTIONS
     * request. if the "timeout" value is exceeded, we retry the GET request.
     * if "max_retries" is exceeded, we start again from OPTIONS.
     * @see https://developer.box.com/v2.0/reference#long-polling
     * @private
     */
    BoxInNode.prototype.startLongPolling = function() {
        var node = this;
        node.box.request({
            url: 'https://api.box.com/2.0/events',
            method: 'OPTIONS' 
        }, function (err, data) {
            if (err) {
                node.error(RED._('box.error.long-polling-failed'), {
                    err: err.toString()
                });
                return;
            }
            if (!(data.entries && data.entries.length)) {
                node.error(RED._('box.error.invalid-response'), {
                    err: err.toString()
                });
                return;
            }
            node.longpoll(data.entries.shift());
        });
    }

    /**
     * Initializes default (interval-based) polling
     */
    BoxInNode.prototype.startIntervalPolling = function () {
        var node = this;

        if (!node.pollingInterval) {
            node.pollingInterval = setInterval(function() {
                node.emit('check-events');
            }, node.interval * 1000); // interval in ms
    
            node.on("close", function() {
                clearInterval(node.pollingInterval);
            });
        }
    };

    /**
     * Gets initial stream position from events endpoint
     * Saves as "state" property.  When ready, emits "ready" event, which will
     * initialize long-polling or interval-based polling, depending on Node config.
     */
    BoxInNode.prototype.getInitialStreamPosition = function () {
        var node = this;
        node.box.request({
            url: 'https://api.box.com/2.0/events?stream_position=now&stream_type=changes',
        }, function (err, data) {
            if (err) {
                node.error(RED._('box.error.event-stream-initialize-failed', {err: err.toString()}));
                node.status({
                    fill: 'red',
                    shape: 'ring',
                    text: 'box.status.failed'
                });
                return;
            }
            node.state = data.next_stream_position;
            node.status({});
            node.emit('ready');
        });
    };

    /**
     * Long-poll Box for new events
     * This function calls itself recursively until config.max_retries is hit.  At that point
     * it will call BoxInNode#startPolling again.
     * @private
     * @param {Object} config Object returned by Box's "events" endpoint when hit with OPTIONS method
     * @param {number} config.max_retries Number of retries allowed
     * @param {number} config.retry_timeout Retry the GET request after this many seconds
     * @param {string} config.url Endpoint of GET request
     * @param {number} [count=0] Current retry count
     */
    BoxInNode.prototype.longpoll = function (config, count) {
        var node = this;
        count = count || 0;
        node.box.request({
            url: config.url,
            timeout: parseInt(config.retry_timeout, 10) * 1000
        }, function (err, data) {
            if (err) {
                if (err.code === 'ESOCKETTIMEDOUT') {
                    if (count === parseInt(config.max_retries, 10) - 1) {
                        node.startLongPolling();
                        return;
                    }
                    process.nextTick(function() {
                        node.longpoll(config, ++count);
                    });
                    return;
                }
                node.error(RED._('box.error.long-polling-failed'), {err: err.toString()});
                return;
            }
            if (data.message === 'new_change') {
                node.emit('check-events');
            } else if (data.message === 'reconnect') {
                node.startLongPolling();
            } else {
                // ???
            }
        });
    };

    function BoxQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }
            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
            node.box.resolveFile(filename, function(err, file_id) {
                if (err) {
                    node.error(RED._("box.error.path-resolve-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    return;
                }
                node.status({fill:"blue",shape:"dot",text:"box.status.downloading"});
                node.box.request({
                    url: 'https://api.box.com/2.0/files/'+file_id+'/content',
                    json: false,
                    followRedirect: true,
                    maxRedirects: 1,
                    encoding: null,
                }, function(err, data) {
                    if (err) {
                        node.error(RED._("box.error.download-failed",{err:err.toString()}),msg);
                        node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    } else {
                        msg.payload = data;
                        delete msg.error;
                        node.status({});
                        node.send(msg);
                    }
                });
            });
        });
    }
    RED.nodes.registerType("box", BoxQueryNode);

    function BoxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.credentials.accessToken) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }
            var path = filename.split("/");
            var basename = path.pop();
            node.status({fill:"blue",shape:"dot",text:"box.status.resolving-path"});
            var localFilename = node.localFilename || msg.localFilename;
            if (!localFilename && typeof msg.payload === "undefined") {
                return;
            }
            node.box.resolvePath(path, function(err, parent_id) {
                if (err) {
                    node.error(RED._("box.error.path-resolve-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                    return;
                }
                node.status({fill:"blue",shape:"dot",text:"box.status.uploading"});
                var r = node.box.request({
                    method: 'POST',
                    url: 'https://upload.box.com/api/2.0/files/content',
                }, function(err, data) {
                    if (err) {
                        if (data && data.status === 409 &&
                            data.context_info && data.context_info.conflicts) {
                            // existing file, attempt to overwrite it
                            node.status({fill:"blue",shape:"dot",text:"box.status.overwriting"});
                            var r = node.box.request({
                                method: 'POST',
                                url: 'https://upload.box.com/api/2.0/files/'+
                                    data.context_info.conflicts.id+'/content',
                            }, function(err, data) {
                                if (err) {
                                    node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                                    node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                                    return;
                                }
                                node.status({});
                            });
                            var form = r.form();
                            if (localFilename) {
                                form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                            } else {
                                form.append('filename', RED.util.ensureBuffer(msg.payload), { filename: basename });
                            }
                        } else {
                            node.error(RED._("box.error.upload-failed",{err:err.toString()}),msg);
                            node.status({fill:"red",shape:"ring",text:"box.status.failed"});
                        }
                        return;
                    }
                    node.status({});
                });
                var form = r.form();
                if (localFilename) {
                    form.append('filename', fs.createReadStream(localFilename), { filename: basename });
                } else {
                    form.append('filename', RED.util.ensureBuffer(msg.payload), { filename: basename });
                }
                form.append('parent_id', parent_id);
            });
        });
    }
    RED.nodes.registerType("box out",BoxOutNode);
};
