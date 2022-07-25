/**
 * Copyright JS Foundation and other contributors, http://js.foundation
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
    var { Dropbox } = require("dropbox");
    var fs = require("fs");
    var minimatch = require("minimatch");
    var isUtf8 = require('is-utf8');
    var fspath = require("path");

    function DropboxNode(n) {
        RED.nodes.createNode(this,n);
        this.dropbox = new Dropbox({
            clientId: this.credentials.clientid,
            refreshToken: this.credentials.refreshtoken
        });
    }
    RED.nodes.registerType("dropbox-config",DropboxNode,{
        credentials: {
            clientid: { type:"password" },
            refreshtoken: { type:"password" }
        }
    });

    function DropboxInNode(n) {
        RED.nodes.createNode(this,n);

        var dropboxConfig = RED.nodes.getNode(n.dropbox);
        var credentials = dropboxConfig ? dropboxConfig.credentials : {};
        if (!credentials.refreshtoken) {
            this.warn(RED._("dropbox.warn.missing-refresh-token"));
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
            if (node.trace) {
                node.trace("get cursor");
            }
            node.status({fill:"blue",shape:"dot",text:"dropbox.status.initializing"});
            return dropbox.filesListFolder({path: '',recursive:true}).then(function(response) { return response.result.cursor })
        }
        node.drainCursor = function(cursor, emit) {
            if (closing) {
                return;
            }
            if (emit) {
                node.status({fill:"blue",shape:"dot",text:"dropbox.status.checking-for-changes"});
            }
            if (node.trace) {
                node.trace("draining files emit="+!!emit);
            }
            return dropbox.filesListFolderContinue({cursor: cursor}).then(function(response) {
                if (closing) {
                    return;
                }
                response.result.entries.forEach(function(entry) {
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
                    return node.drainCursor(response.result.cursor,emit);
                } else {
                    node.status({});
                }
                return response.result.cursor;
            });
        }

        node.poll = function(cursor,backoff) {
            if (closing) {
                return;
            }
            if (node.trace) {
                node.trace("polling backoff="+(backoff||0));
            }
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
                if (response.result.changes) {
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
                if (node.trace) {
                    node.trace("Error polling:"+errorMessage);
                }
                if (err.error[".tag"] === 'reset') {
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
            if (node.trace) {
                node.trace("Starting polling");
            }
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
                    if (node.trace) {
                        node.trace("Error polling:"+errorMessage);
                    }
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
        if (!credentials.refreshtoken) {
            this.warn(RED._("dropbox.warn.missing-refresh-token"));
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
                var data = response.result.fileBinary;
                var dataBuffer = Buffer.from(data,'binary');
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
        if (!credentials.refreshtoken) {
            this.warn(RED._("dropbox.warn.missing-refresh-token"));
            return;
        }
        var node = this;
        var dropbox = dropboxConfig.dropbox;
        node.on("input", function(msg) {
            var localFilename = this.localFilename || msg.localFilename || "";
            var filename = this.filename || msg.filename || "";
            if (filename === "") {
                if (localFilename) {
                    filename = fspath.basename(localFilename);
                } else {
                    node.error(RED._("dropbox.error.no-filename"),msg);
                    node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                    return;
                }
            }
            if (filename[0] !== '/') {
                filename = '/'+filename;
            }
            if (localFilename) {
                // TODO: use chunked upload for files larger than 150M
                node.status({fill:"blue",shape:"dot",text:"dropbox.status.uploading"});
                fs.readFile(localFilename, function read(err, data) {
                    if (err) {
                        node.error(err.toString(),msg);
                        node.status({fill:"red",shape:"ring",text:"dropbox.status.failed"});
                        return;
                    }
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

    var globalDropboxInstance = null;

    RED.httpAdmin.get('/dropbox/generate_redirect_url', function(req, res) {
        // Once the Dropbox authentication server has finished its authentication flow, it will send the results (incl. the refresh token) to our redirect url.
        // Since the Dropbox instance (= the dropbox client) is executing the redirect, "localhost" will also be a valid host.
        // Parts of the original will be reused, to make sure all path related settings.js adjustments are used here.
        var redirectUrl = req.protocol + "://" + req.get('host') + req.originalUrl.replace("generate_redirect_url", "authenticate");
        res.json({redirectUrl: redirectUrl});
    });

    RED.httpAdmin.get('/dropbox/generate_authentication_url', function(req, res) {
        var options = {};

        // When the config node has been deployed previously, it might contain deployed settings which need to be used
        var dropboxNode = RED.nodes.getNode(req.query.nodeId);
        if(dropboxNode) {
            options.clientId = dropboxNode.credentials.clientid;
        }
        
        // The config node's config screen might contain an undeployed clientId, which will override the client id from the deployed config node settings.
        if (req.query.clientid && req.query.clientid !== "__PWRD__") {
            options.clientId = req.query.clientid;
        }
        
        if (!options.clientId) {
            res.writeHead(500);
            res.end(RED._("dropbox.error.no-app-key"));
            return;
        }

        // Pass the redirect uri to our second 'authenticate' endpoint via the session state, because getAccessTokenFromCode needs the redirectUri we have been using here. 
        var state = JSON.stringify({redirectUri: req.query.redirectUrl});

        try {
            // Create a new temporary Dropbox instance, because at this moment the config node (and its Dropbox instance) might not have been deployed yet.
            var tempDropbox = new Dropbox(options);

            // Get the authentication URL of this client app, to start an authentication flow on the Dropbox authentication server.
            // The 'offline' argument is required to get a (long-lived) refresh token.  Because offline applications will access the API, without
            // the manual intervention of an end user.  That refresh token can be used afterwards to obtain a new (short-lived) access token.
            var authUrl = tempDropbox.auth.getAuthenticationUrl(req.query.redirectUrl, state, 'code', 'offline', null, 'none', true)
            .then(function(authUrl) {
                // In the next 'authenticate' endpoint, again a Dropbox instance will be needed.  Pass the current dropbox instance to the next endpoint, because
                // (as a result of the getAuthenticationUrl call) it's 'codeVerifier' property will be filled in.  And that property is needed to call
                // getAccessTokenFromCode in the next endpoint, to avoid having the user to go throught an entire Authorization Code Flow (with PKCE).
                // Reusing the Dropbox instance seems more secure, compared to pass the codeVerifier via the session state to the next endpoint.
                globalDropboxInstance = tempDropbox;
    
                // Redirect the request from the Node-RED flow editor to the Dropbox authentication server.
                // The user should manually confirm (in the Dropbox authentication page) that this client app can be linked to the dropbox account.
                // This starts the OAuth 2.0 authorization flow. This isn't an API call—it's the web page that lets the user sign in to Dropbox and authorize your app. 
                // After the user decides whether or not to authorize your app, they will be redirected to the URI specified by redirect_uri.
                res.json({authUrl: authUrl});
            })
            .catch(function(error) {
                res.writeHead(500);
                res.end(RED._("dropbox.error.auth-url-failed"));
                return;
            })
        }
        catch(err) {
            res.writeHead(500);
            res.end(err.message);            
        }
    });

    // Dropbox will call this endpoint as soon as i authentication flow has ended
    RED.httpAdmin.get('/dropbox/authenticate', function(req, res) {
        var accessCode = req.query.code;
        var state = JSON.parse(req.query.state);

        // Ask Dropbox for an access token (and refresh token), based on the access code that we have received.
        // Note that redirectUri won't be called again here, but the URL needs to be exactly the same as the one that has been called previously (in getAuthenticationUrl).
        // Show the refresh token in the popup window, where it can be copied by the user and pasted into the config node's screen.
        globalDropboxInstance.auth.getAccessTokenFromCode(state.redirectUri, accessCode)
        .then(function(response) {
            res.setHeader("Content-Type", "text/html");
            res.writeHead(200);
            
            // The response contains two tokens (but only the refresh token is relevant for our use case):
            // 1.- A (long-lived) refresh token which will never expire.
            // 2.- A (short-lived) access token which will expire after 4 hours.  Note such tokens start with "sl.".
            var html = "<html><head><title>" +  RED._("dropbox.title.auth-flow") + "</title></head><body><h1>" + RED._("dropbox.label.refreshtoken") + "</h1>" + response.result.refresh_token + "</body></html>";
            res.end(html);
            globalDropboxInstance = null;
        })
        .catch(function(error) {
            res.writeHead(500);
            res.end(err.message);
        });
    });
};
