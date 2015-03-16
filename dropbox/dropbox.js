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
        this.dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = this.dropboxConfig ? this.dropboxConfig.credentials : {};
        if (!credentials.appkey || !credentials.appsecret ||
            !credentials.accesstoken) {
            this.warn("Missing dropbox credentials");
            return;
        }

        var node = this;
        var dropbox = new Dropbox.Client({
            //uid: credentials.uid,
            key: credentials.appkey,
            secret: credentials.appsecret,
            token: credentials.accesstoken,
        });
        node.status({fill:"blue",shape:"dot",text:"initializing"});
        dropbox.pullChanges(function(err, data) {
            if (err) {
                node.error("initialization failed " + err.toString());
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            }
            node.status({});
            node.state = data.cursor();
            node.on("input", function(msg) {
                node.status({fill:"blue",shape:"dot",text:"checking for changes"});
                dropbox.pullChanges(node.state, function(err, data) {
                    if (err) {
                        node.error("failed to fetch changes" + err.toString(),msg);
                        node.status({}); // clear status since poll retries anyway
                        return;
                    }
                    node.state = data.cursor();
                    node.status({});
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
                });
            });
            var interval = setInterval(function() {
                node.emit("input", {});
            }, 900000); // 15 minutes
            node.on("close", function() {
                if (interval !== null) {
                    clearInterval(interval);
                }
            });
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
            this.warn("Missing dropbox credentials");
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
                node.error("No filename specified",msg);
                return;
            }
            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"downloading"});
            dropbox.readFile(filename, function(err, data) {
                    if (err) {
                        node.error("download failed " + err.toString(),msg);
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else {
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
            this.warn("Missing dropbox credentials");
            return;
        }
        var node = this;
        var dropbox = new Dropbox.Client({
            //uid: credentials.uid,
            key: credentials.appkey,
            secret: credentials.appsecret,
            token: credentials.accesstoken,
        });
        node.status({fill:"blue",shape:"dot",text:"checking credentials"});
        dropbox.getAccountInfo(function (err) {
            if (err) {
                node.error("Error verifying credentials: " + err);
                node.status({fill:"red",shape:"ring",text:"access denied"});
                    return;
            }
            node.status({});
            node.on("input", function(msg) {
                var filename = this.filename || msg.filename;
                if (filename === "") {
                    node.error("No filename specified",msg);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    return;
                }
                var localFilename = this.localFilename || msg.localFilename;
                if (localFilename) {
                    // TODO: use chunked upload for files larger than 150M
                    node.status({fill:"blue",shape:"dot",text:"uploading"});
                    fs.readFile(localFilename, function read(err, data) {
                        if (err) {
                            node.error(err.toString(),msg);
                            node.status({fill:"red",shape:"ring",text:"failed"});
                            return;
                        }

                        dropbox.writeFile(filename, data, function(err) {
                            if (err) {
                                node.error(err.toString(),msg);
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }
                            node.status({});
                        });
                    });
                } else if (typeof msg.payload !== "undefined") {
                    var data = RED.util.ensureBuffer(msg.payload);
                    node.status({fill:"blue",shape:"dot",text:"uploading"});
                    dropbox.writeFile(filename, data, function(err) {
                        if (err) {
                            node.error(err.toString(),msg);
                            node.status({fill:"red",shape:"ring",text:"failed"});
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
