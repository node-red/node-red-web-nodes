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
    var Dropbox = require("dropbox");
    var fs = require("fs");
    var minimatch = require("minimatch");
    var isUtf8 = require('is-utf8');

    function DropboxNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("dropbox-config",DropboxNode,{
        credentials: {
            appkey: { type:"text" },
            appsecret: { type: "password" },
            accesstoken: { type:"password" },
        }
    });

    function DropboxInNode(n) {
        RED.nodes.createNode(this,n);
        this.filepattern = n.filepattern || "";
        this.checkInterval = n.checkInterval || 600000;
        this.dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = this.dropboxConfig ? this.dropboxConfig.credentials : {};
        if (!credentials.appkey || !credentials.appsecret ||
            !credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }

        var node = this;
        var dropbox = new Dropbox.Client({
            //uid: credentials.uid,
            key: credentials.appkey,
            secret: credentials.appsecret,
            token: credentials.accesstoken,
        });
        node.status({fill:"blue",shape:"dot",text:"dropbox.status.initializing"});
        node.on("input", function(msg) {
            node.status({fill:"blue",shape:"dot",text:"dropbox.status.checking-for-changes"});
            dropbox.pullChanges(node.state, function(err, data) {
                if (err) {
                    node.error(RED._("dropbox.error.change-fetch-failed",{err:err.toString()}),msg);
                    node.status({}); // clear status since poll retries anyway
                    return;
                }
                node.status({});
                if (!node.state) {
                    node.state = data.cursor();
                }
                else {
                    var changes = data.changes;
                    for (var i = 0; i < changes.length; i++) {
                        var change = changes[i];
                        if (node.filepattern &&
                            !minimatch(change.path, node.filepattern)) {
                            continue;
                        }
                        msg.payload = change.path;
                        msg.file = change.path.substring(change.path.lastIndexOf('/') + 1);
                        msg.event = change.wasRemoved ? 'delete' : 'add';
                        msg.data = change;
                        node.send(msg);
                    }
                }
            });
        });

        var tout = setTimeout(function() {
            node.emit("input", {});
        }, 5000); // do first check after 5 secs

        var interval = setInterval(function() {
            node.emit("input", {});
        }, node.checkInterval); // default 10 minutes

        node.on("close", function() {
            if (tout) { clearTimeout(tout); }
            if (interval) { clearInterval(interval); }
        });
    }
    RED.nodes.registerType("dropbox in",DropboxInNode);

    function DropboxQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = this.dropboxConfig ? this.dropboxConfig.credentials : {};
        if (!credentials.appkey || !credentials.appsecret ||
            !credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }

        var node = this;
        var dropbox = new Dropbox.Client({
            //uid: credentials.uid,
            key: credentials.appkey,
            secret: credentials.appsecret,
            token: credentials.accesstoken,
        });
        node.on("input", function(msg) {
            var filename = this.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("dropbox.error.no-filename"),msg);
                return;
            }
            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"dropbox.status.downloading"});
            dropbox.readFile(filename, { buffer: true }, function(err, data) {
                if (err) {
                    node.error(RED._("dropbox.error.download-failed",{err:err.toString()}),msg);
                    node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                } else {
                    if (isUtf8(data)) { data = data.toString(); }
                    msg.payload = data;
                    node.status({});
                    node.send(msg);
                }
            });
        });
    }
    RED.nodes.registerType("dropbox",DropboxQueryNode);

    function DropboxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        this.dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = this.dropboxConfig ? this.dropboxConfig.credentials : {};
        if (!credentials.appkey || !credentials.appsecret ||
            !credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }
        var node = this;
        var dropbox = new Dropbox.Client({
            //uid: credentials.uid,
            key: credentials.appkey,
            secret: credentials.appsecret,
            token: credentials.accesstoken,
        });
        node.status({fill:"blue",shape:"dot",text:"dropbox.status.checking-credentials"});
        dropbox.getAccountInfo(function (err) {
            if (err) {
                node.error(RED._("dropbox.error.credentials-error",{err:err}));
                node.status({fill:"red",shape:"ring",text:"dropbox.status.access-denied"});
                    return;
            }
            node.status({});
            node.on("input", function(msg) {
                var filename = this.filename || msg.filename;
                if (filename === "") {
                    node.error(RED._("dropbox.error.no-filename"),msg);
                    node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                    return;
                }
                var localFilename = this.localFilename || msg.localFilename;
                if (localFilename) {
                    // TODO: use chunked upload for files larger than 150M
                    node.status({fill:"blue",shape:"dot",text:"dropbox.status.uploading"});
                    fs.readFile(localFilename, function read(err, data) {
                        if (err) {
                            node.error(err.toString(),msg);
                            node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                            return;
                        }

                        dropbox.writeFile(filename, data, function(err) {
                            if (err) {
                                node.error(err.toString(),msg);
                                node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                                return;
                            }
                            node.status({});
                        });
                    });
                } else if (typeof msg.payload !== "undefined") {
                    var data = RED.util.ensureBuffer(msg.payload);
                    node.status({fill:"blue",shape:"dot",text:"dropbox.status.uploading"});
                    dropbox.writeFile(filename, data, function(err) {
                        if (err) {
                            node.error(err.toString(),msg);
                            node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                            return;
                        }
                        node.status({});
                    });
                }
            });
        });
    }
    RED.nodes.registerType("dropbox out",DropboxOutNode);
};
