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

    function DropboxNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("dropbox",DropboxNode,{
        credentials: {
            appkey: { type:"text" },
            appsecret: { type: "password" },
            accesstoken: { type:"password" },
        }
    });

    function DropboxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        this.dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = this.dropboxConfig.credentials;
        var node = this;
        if (credentials && credentials.appkey && credentials.appsecret &&
            credentials.accesstoken) {
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
                    var filename = msg.filename || this.filename;
                    if (filename === "") {
                        node.warn("No filename specified");
                        return;
                    }
                    if (msg.hasOwnProperty("delete")) {
                        node.status({fill:"blue",shape:"dot",text:"deleting"});
                        dropbox.remove(filename, function(err) {
                            if (err) {
                                node.error(err.toString());
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }
                            node.status({});
                        });
                        return;
                    }
                    var localFilename = msg.localFilename || this.localFilename;
                    if (localFilename) {
                        // TODO: use chunked upload for files larger than 150M
                        node.status({fill:"blue",shape:"dot",text:"uploading"});
                        fs.readFile(localFilename, function read(err, data) {
                            if (err) {
                                node.error(err.toString());
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }

                            dropbox.writeFile(filename, data, function(err) {
                                if (err) {
                                    node.error(err.toString());
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
                                node.error(err.toString());
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }
                            node.status({});
                        });
                    }
                });
            });
        }
    }
    RED.nodes.registerType("dropbox out",DropboxOutNode);
};
