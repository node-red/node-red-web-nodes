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
        this.dropbox = new Dropbox({
            accessToken: this.credentials.accesstoken
        });
    }
    RED.nodes.registerType("dropbox-config",DropboxNode,{
        credentials: {
            accesstoken: { type:"password" },
        }
    });

    function DropboxInNode(n) {
        RED.nodes.createNode(this,n);

        var dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = dropboxConfig ? dropboxConfig.credentials : {};
        if (!credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }

        this.filepattern = n.filepattern || "";
        if (this.filepattern && this.filepattern[0] !== '/') {
            this.filepattern = '/'+this.filepattern;
        }

        var node = this;

        var dropbox = dropboxConfig.dropbox;
        var currentFiles = {};
        var initialized = false;
        var longPollTimeout;
        var closing = false;



        node.getFolderCursor = function() {
            node.trace("get cursor");
            node.status({fill:"blue",shape:"dot",text:"dropbox.status.initializing"});
            return dropbox.filesListFolder({path: '',recursive:true}).then(function(response) { return response.cursor});
        }
        node.drainCursor = function(cursor, emit) {
            if (closing) {
                return;
            }
            if (emit) {
                node.status({fill:"blue",shape:"dot",text:"dropbox.status.checking-for-changes"});
            }
            node.trace("draining files emit="+!!emit);
            return dropbox.filesListFolderContinue({cursor: cursor}).then(function(response) {
                if (closing) {
                    return;
                }
                response.entries.forEach(function(entry) {
                    if (emit) {
                        if (node.filepattern && !minimatch(entry.path_display, node.filepattern)) {
                            return;
                        }
                        var change = {
                            payload: entry.path_display,
                            file: entry.name,
                        };
                        if (entry['.tag'] === 'deleted') {
                            change.event = 'delete';
                        } else if (!currentFiles[entry.path_display]) {
                            change.event = 'add';
                        } else {
                            change.event = 'change';
                        }
                        node.send(change);
                    }
                    currentFiles[entry.path_display] = entry.server_modified;
                });
                if (response.has_more) {
                    return node.drainCursor(response.cursor,emit);
                } else {
                    node.status({});
                }
                return response.cursor;
            });
        }

        node.poll = function(cursor,backoff) {
            if (closing) {
                return;
            }
            node.trace("polling backoff="+(backoff||0));
            if (backoff) {
                longPollTimeout = setTimeout(function() {
                    node.poll(cursor);
                },backoff*1000);
                return;
            }
            return dropbox.filesListFolderLongpoll({cursor: cursor}).then(function(response) {
                if (closing) {
                    return;
                }
                if (response.changes) {
                    node.drainCursor(cursor,true).then(function(c) {
                        if (closing) {
                            return;
                        }
                        node.poll(c,response.backoff);
                    })
                } else {
                    node.poll(cursor,response.backoff);
                }
            }).catch(function(err) {
                var errorMessage;
                if (err.error) {
                    errorMessage = err.error;
                } else {
                    errorMessage = err.toString();
                }
                node.trace("Error polling:"+errorMessage);
                if (error.error[".tag"] === 'reset') {
                    startPolling();
                } else {
                    longPollTimeout = setTimeout(function() {
                        node.poll(cursor,backoff);
                    },15000);
                }
            })
        }

        node.startPolling = function() {
            if (closing) {
                return;
            }
            node.trace("Starting polling");
            node.getFolderCursor()
                .then(node.drainCursor)
                .then(node.poll)
                .catch(function(err) {
                    var errorMessage;
                    if (err.error) {
                        errorMessage = err.error;
                    } else {
                        errorMessage = err.toString();
                    }
                    node.trace("Error polling:"+errorMessage);
                    node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                    longPollTimeout = setTimeout(function() {
                        node.startPolling();
                    },15000);
                })
        }

        node.startPolling();

        node.on("close", function() {
            if (longPollTimeout) {
                clearTimeout(longPollTimeout);
            }
            closing = true;
            // if (tout) { clearTimeout(tout); }
            // if (interval) { clearInterval(interval); }
        });
    }
    RED.nodes.registerType("dropbox in",DropboxInNode);

    function DropboxQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";

        var dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = dropboxConfig ? dropboxConfig.credentials : {};
        if (!credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }
        var node = this;

        var dropbox = dropboxConfig.dropbox;

        node.on("input", function(msg) {
            var filename = this.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("dropbox.error.no-filename"),msg);
                return;
            }

            if (filename[0] !== '/') {
                filename = '/'+filename;
            }

            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"dropbox.status.downloading"});

            dropbox.filesDownload({path: filename}).then(function(response) {
                var data = response.fileBinary;
                var dataBuffer = new Buffer(data,'binary');
                if (!isUtf8(dataBuffer)) {
                    msg.payload = dataBuffer;
                } else {
                    msg.payload = data;
                }
                node.status({});
                node.send(msg);
            }).catch(function(err) {
                var errorMessage;
                if (err.error) {
                    errorMessage = err.error;
                } else {
                    errorMessage = err.toString();
                }
                node.error(RED._("dropbox.error.download-failed",{err:errorMessage}),msg);
                node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
            });
        });
    }
    RED.nodes.registerType("dropbox",DropboxQueryNode);

    function DropboxOutNode(n) {
        RED.nodes.createNode(this,n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";

        var dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = dropboxConfig ? dropboxConfig.credentials : {};
        if (!credentials.accesstoken) {
            this.warn(RED._("dropbox.warn.missing-credentials"));
            return;
        }
        var node = this;
        var dropbox = dropboxConfig.dropbox;
        node.on("input", function(msg) {
            var filename = this.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("dropbox.error.no-filename"),msg);
                node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                return;
            }
            if (filename[0] !== '/') {
                filename = '/'+filename;
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
                    dropbox.filesUpload({ path: filename, contents: data })
                    .then(function (response) {
                        node.status({});
                    })
                    .catch(function (err) {
                        node.error(err.toString(),msg);
                        node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                    });
                });
            } else if (typeof msg.payload !== "undefined") {
                var data = RED.util.ensureBuffer(msg.payload);
                node.status({fill:"blue",shape:"dot",text:"dropbox.status.uploading"});

                dropbox.filesUpload({ path: filename, contents: data, mode: {".tag":"overwrite"}})
                .then(function (response) {
                    node.status({});
                })
                .catch(function (err) {
                    var errorMessage;
                    if (err.error) {
                        errorMessage = err.error;
                    } else {
                        errorMessage = err.toString();
                    }
                    node.error(errorMessage,msg);
                    node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                });
            }
        });
    }
    RED.nodes.registerType("dropbox out",DropboxOutNode);
};
