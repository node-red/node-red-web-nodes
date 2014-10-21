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
    
    var ig = require('instagram-node').instagram();
    
    // needed for auth
    var crypto = require("crypto");
    var Url = require('url');
    var request = require('request');
    
    var IMAGE = "image";// currently we're only considering images
    
    var repeat = 900000; // 15 minutes => the repeat frequency of the input node
    
    function InstagramCredentialsNode(n) {
        RED.nodes.createNode(this,n);
//        this.clientID = n.clientID;
    }
    
    function downloadImageAndSendAsBuffer(node, url, msg) {
        request({ uri : url, encoding : null}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                msg.payload = body;
                node.send(msg);
            } else {
                node.warn("Instagram node has failed to buffer up an image. Image was not sent.\n" + error + "\n" + response);
            }
        });
    }

    // we initialize the node: load access token, obtain current state from Instagram
    function initializeNode(node, isInputNode) {
        if(!node.instagramConfig.credentials.access_token) {
            node.warn("Missing Instagram access token. Authorization has not been completed before node initialization.");
            return;
        }

        ig.use({ access_token: node.instagramConfig.credentials.access_token});

        // Now grab initial state but only grab the ones we're concerned with
        
        if (node.inputType === "photo") {            
            ig.user_media_recent('self', { count : 1, min_id : null, max_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                   node.warn('Instagram node has failed to fetch latest user photo : '+err);
                }
                
                if(medias.length > 0) { // if the user has uploaded something to Instagram already
                    node.latestSelfContentID = medias[0].id;
                }

                node.on("input", function(msg) {
                    handleNodeInput(node, msg);
                });

                if(isInputNode === true) {
                    node.interval = setInterval(function() { // self trigger
                        node.emit("input", {});
                    }, repeat);
                }
            });
        } else if (node.inputType === "like") {
            ig.user_self_liked({ count : 1, max_like_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                    node.warn('Instagram node has failed to fetch latest liked photo : '+err);
                }
                
                if(medias.length > 0) { // if the user has liked something to Instagram already
                    node.latestLikedID = medias[0].id;
                }
                
                node.on("input", function(msg) {
                    handleNodeInput(node, msg);
                });
                
                if(isInputNode === true) {
                    node.interval = setInterval(function() { // self trigger
                        node.emit("input", {});
                    }, repeat);
                }
            });
        }
    }
    
    function handleNodeInput(node, msg) {
        var areWeInPaginationRecursion = false;
        
        var idOfLikedReturned;
        var idOfSelfReturned;
        
        var returnPagefulsOfStuff = function(err, medias, pagination, remaining, limit) {
            
            var carryOnPaginating = true;
            
            if (err) {
                node.warn('Instagram node has failed to fetch latest media : '+err);
            }
            
            if(medias) {
                for(var i = 0; i < medias.length; i++) {                    
                    if (node.inputType === "like") { // like is a special case as per Instagram API behaviour
                        if(areWeInPaginationRecursion === false) { // need to set the pointer of latest served liked image before pagination occurs
                            idOfLikedReturned = medias[0].id;
                        }
                        if (medias[i].id === node.latestLikedID || node.latestLikedID === null) { // we finally found the image we already returned or has been there at init
                            node.latestLikedID = idOfLikedReturned; // we need to assign the latest liked to the one we returned first => can only do node at the end, otherwise we'd never match break condition and always return everything
                            carryOnPaginating = false;
                            break;
                        }
                    }
                    
                    if (node.inputType === "photo" && i === 0 && (areWeInPaginationRecursion === false) ) { // only set the served self content ID to equal the first media of the first pagination page and ignore on subsequent pages 
                        idOfSelfReturned = medias[i].id;
                    }
                    
                    if (node.inputType === "photo" && (medias[i].id === node.latestSelfContentID) ) { // if we say to the Insta API that we want images more recent than image id "blah", it returns image with that id too
                     //deliberate no-op
                    } else if(medias[i].type === IMAGE) {
                        var url = medias[i].images.standard_resolution.url;
                        if (node.outputType === "link") {
                            msg.payload = url;
                            node.send(msg);
                        } else if (node.outputType === "buffer") {
                            downloadImageAndSendAsBuffer(node, url, msg);
                        }
                    }
                }   
            } else if(areWeInPaginationRecursion === false) {
                node.warn('Instagram node has failed to fetch any media');
                return;
            }
            if(pagination && pagination.next && carryOnPaginating) {
                areWeInPaginationRecursion = true;
                pagination.next(returnPagefulsOfStuff);
            } else {
                node.latestSelfContentID = idOfSelfReturned;
            }
        };
        
        // If we're processing user content
        if (node.inputType === "photo") {
            ig.user_media_recent('self', { count : null, min_id : node.latestSelfContentID, max_id : null}, returnPagefulsOfStuff);
        } else if (node.inputType === "like") { // If we're processing likes
            ig.user_self_liked({ count : null, max_like_id : null}, returnPagefulsOfStuff);
        }
    }
    
    function InstagramInNode(n) {   
        RED.nodes.createNode(this,n);
        
        var node = this;
        
        node.latestSelfContentID = null; // if the user has not liked/uploaded any content yet
        node.latestLikedID = null;

        node.inputType = n.inputType;
        node.outputType = n.outputType;
        
        node.interval = null; // used to track individual refresh intervals
        
        node.instagramConfig = RED.nodes.getNode(n.instagram);
        if (!node.instagramConfig) {
            node.warn("Missing Instagram credentials");
            return;
        }
        
        initializeNode(node, true); // the build in poll interval is getting set up at the end of init
        
        node.on("close", function() {
            if (node.interval !== null) {
                clearInterval(node.interval);
            }
            node.latestSelfContentID = null;
            node.latestLikedID = null;
            node.inputType = null;
            node.outputType = null;
        });
    }

    function InstagramNode(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;

        node.latestSelfContentID = null; // if the user has not liked/uploaded any content yet
        node.latestLikedID = null;
        
        node.inputType = n.inputType;
        node.outputType = n.outputType;
        
        node.instagramConfig = RED.nodes.getNode(n.instagram);
        if (!node.instagramConfig) {
            node.warn("Missing Instagram credentials");
            return;
        }
        
        initializeNode(node, false);
        
        node.on("close", function() {
            node.latestSelfContentID = null;
            node.latestLikedID = null;
            node.inputType = null;
            node.outputType = null;
        });
    }
    
    RED.nodes.registerType("instagram-credentials",InstagramCredentialsNode, {
        credentials: {
            username: {type:"text"},
            clientID: {type:"text"},
            redirectURI: { type:"text"},
            access_token: {type: "password"}
        }
    });
    
    RED.nodes.registerType("instagram",InstagramNode);
    
    RED.nodes.registerType("instagram in",InstagramInNode);
    
    RED.httpAdmin.get('/instagram-credentials/auth', function(req, res) {
        var node_id = req.query.node_id;
        
        var credentials = RED.nodes.getCredentials(node_id) || {};
        
        credentials.client_id = req.query.client_id;
        credentials.client_secret = req.query.client_secret;
        credentials.redirect_uri = req.query.redirect_uri;
        
        if (!credentials.client_id || !credentials.client_secret || ! credentials.redirect_uri) {
            return res.send('ERROR: Received query from UI without the needed credentials');
        }
        
        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        credentials.csrfToken = csrfToken;

        res.redirect(Url.format({
            protocol: 'https',
            hostname: 'api.instagram.com',
            pathname: '/oauth/authorize/',
            query: {
                client_id: credentials.client_id,
                redirect_uri: credentials.redirect_uri,
                response_type: "code",
                state: node_id + ":" + credentials.csrfToken
            }
        }));

        RED.nodes.addCredentials(node_id,credentials);
    });
    
    RED.httpAdmin.get('/instagram-credentials/auth/callback', function(req, res) {
        var state = req.query.state.split(":");
        var node_id = state[0];
        var csrfToken = state[1];
        
        var credentials = RED.nodes.getCredentials(node_id) || {};

        if (!credentials || !credentials.client_id || !credentials.client_secret || ! credentials.redirect_uri) {
            return res.send('ERROR: no credentials - should never happen');
        }
        
        if (csrfToken !== credentials.csrfToken) {
            return res.status(401).send('CSRF token mismatch, possible cross-site request forgery attempt.');
        }
        
        RED.nodes.deleteCredentials(node_id); // we don't want to keep the csrfToken
        // from now on, credentials are in memory only
        delete credentials.csrfToken;
        
        if(!req.query.code) {
            return res.status(400).send('The callback from Instagram did not contain a required code');
        }
        
        credentials.code = req.query.code;
        
        request.post({
            url: 'https://api.instagram.com/oauth/access_token',
            json: true,
            form: {
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
                grant_type: 'authorization_code',
                redirect_uri: credentials.redirect_uri,
                code: credentials.code
            },
        }, function(err, result, data) {
            if (err) {
                return res.send("request error:" + err);
            }
            if (data.error) {
                return res.send("oauth error: " + data.error);
            }
            
            if(result.statusCode !== 200) {
                return res.send("Instagram replied with the unexpected HTTP status code of " + result.statusCode + "\nDetails:\n" + data);
            }
            
            if(data.user.username) {
                credentials.username = data.user.username;
            } else {
                return res.send('Error! Instagram node has failed to fetch the username.');
            }
            
            if(data.access_token) {
                credentials.access_token = data.access_token;   
            } else {
                return res.send('Error! Instagram node has failed to fetch a valid access token.');
            }
            
            RED.nodes.addCredentials(node_id,credentials);
            res.send("<html><head></head><body>Successfully authorized with Instagram. You can close this window now.</body></html>");
        });
    });
};
