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
    // needed for auth
    var crypto = require("crypto");
    var Url = require('url');
    var request = require('request');
    
    var IMAGE = "image";// currently we're only considering images
    
    var repeat = 900000; // 15 minutes => the repeat frequency of the input node
    
    function InstagramCredentialsNode(n) {
        RED.nodes.createNode(this,n);
    }
    
    function downloadImageAndSendAsBuffer(node, url, msg) {
        request({ uri : url, encoding : null}, function (error, response, body) {
            if (!error && response.statusCode === 200) {
                msg.payload = body;
                node.send(msg);
            } else {
                node.warn(RED._("instagram.warn.image-not-sent", {error: error, response: response}));
            }
        });
    }
    
    
    // the query node doesn't require special initialization as it serves the latest photo anyway
    function initializeQueryNode(node) {
        if(node.instagramConfig && node.instagramConfig.credentials) {
            if(!node.instagramConfig.credentials.access_token) {
                node.warn(RED._("instagram.warn.missing-accesstoken"));
                return;
            }   
        } else {
            node.warn(RED._("instagram.warn.missing-configuration"));
            return;
        }

        node.ig.use({ access_token: node.instagramConfig.credentials.access_token});

        node.on("input", function(msg) {
            handleQueryNodeInput(node, msg);
        });
    }

    // we initialize the node: load access token, obtain current state from Instagram
    function initializeInputNode(node) {
        if(node.instagramConfig && node.instagramConfig.credentials) {
            if(!node.instagramConfig.credentials.access_token) {
                node.warn(RED._("instagram.warn.missing-accesstoken"));
                return;
            }   
        } else {
            node.warn(RED._("instagram.warn.missing-configuration"));
            return;
        }

        node.ig.use({ access_token: node.instagramConfig.credentials.access_token});

        // Now grab initial state but only grab the ones we're concerned with
        
        if (node.inputType === "photo") {
            node.ig.user_media_recent('self', { count : 1, min_id : null, max_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                   node.warn(RED._("instagram.warn.userphoto-fetch-fail", {err: err}));
                }
                
                if(medias.length > 0) { // if the user has uploaded something to Instagram already
                    node.latestSelfContentID = medias[0].id;
                }

                node.on("input", function(msg) {
                    msg = {};
                    handleInputNodeInput(node, msg);
                });
                node.interval = setInterval(function() { // self trigger
                    node.emit("input", {});
                }, repeat);
            });
        } else if (node.inputType === "like") {
            node.ig.user_self_liked({ count : 1, max_like_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                    node.warn(RED._("instagram.warn.likedphoto-fetch-fail", {err: err}));
                }
                
                if(medias.length > 0) { // if the user has liked something to Instagram already
                    node.latestLikedID = medias[0].id;
                }
                
                node.on("input", function(msg) {
                    msg = {};
                    handleInputNodeInput(node, msg);
                });
                
                node.interval = setInterval(function() { // self trigger
                    node.emit("input", {});
                }, repeat);
            });
        }
    }
    
    function handleQueryNodeInput(node, msg) {
        if (node.inputType === "photo") {
            node.ig.user_media_recent('self', { count : 1, min_id : null, max_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                    node.warn(RED._("instagram.warn.userphoto-fetch-fail", {err: err}));
                }
                if(medias.length > 0) { // if the user has uploaded something to Instagram already
                    if(medias[0].type === IMAGE) {
                        if(medias[0].location) {
                            if(medias[0].location.latitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lat = medias[0].location.latitude;
                            }
                            if(medias[0].location.longitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lon = medias[0].location.longitude;
                            }
                        }
                        
                        if(medias[0].created_time) {
                            msg.time = new Date(medias[0].created_time * 1000);
                        }
                        
                        var url;
                        
                        if(medias[0].images && medias[0].images.standard_resolution && medias[0].images.standard_resolution.url) {
                            url = medias[0].images.standard_resolution.url;   
                        } else {
                            node.warn(RED._("instagram.warn.ignoring-media"));
                            return;
                        }
                        
                        if (node.outputType === "link") {
                            msg.payload = url;
                            node.send(msg);
                        } else if (node.outputType === "buffer") {
                            downloadImageAndSendAsBuffer(node, url, msg);
                        }
                        
                    } else {
                        node.warn(RED._("instagram.warn.not-a-photo"));
                        return;
                    }
                } else {
                    msg.payload = null;
                    node.send(msg);
                    node.warn(RED._("instagram.warn.not-uploaded-yet"));
                }
            });
        } else if (node.inputType === "like") {
            node.ig.user_self_liked({ count : 1, max_like_id : null}, function(err, medias, pagination, remaining, limit) {
                if (err) {
                    node.warn(RED._("instagram.warn.likedphoto-fetch-fail", {err: err}));
                }
                if(medias.length > 0) { // if the user has liked something to Instagram already
                    if(medias[0].type === IMAGE) {
                        if(medias[0].location) {
                            if(medias[0].location.latitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lat = medias[0].location.latitude;
                            }
                            if(medias[0].location.longitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lon = medias[0].location.longitude;
                            }
                        }
                        
                        if(medias[0].created_time) {
                            msg.time = new Date(medias[0].created_time * 1000);
                        }
                        
                        var url;
                        
                        if(medias[0].images && medias[0].images.standard_resolution && medias[0].images.standard_resolution.url) {
                            url = medias[0].images.standard_resolution.url;   
                        } else {
                            node.warn(RED._("instagram.warn.ignoring-media"));
                            return;
                        }
                        
                        if (node.outputType === "link") {
                            msg.payload = url;
                            node.send(msg);
                        } else if (node.outputType === "buffer") {
                            downloadImageAndSendAsBuffer(node, url, msg);
                        }
                        
                    } else {
                        node.warn(RED._("instagram.warn.not-liked-photo"));
                        return;
                    }
                } else {
                    msg.payload = null;
                    node.send(msg);
                    node.warn(RED._("instagram.warn.not-liked-yet"));
                }
            });
        }
    }
    
    function handleInputNodeInput(node, msg) {
        var areWeInPaginationRecursion = false;
        
        var idOfLikedReturned;
        var idOfSelfReturned;
        
        var returnPagefulsOfStuff = function(err, medias, pagination, remaining, limit) {
            
            var carryOnPaginating = true;
            
            if (err) {
                node.warn(RED._("instagram.warn.latest-media-fetch-failed", {err: err}));
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

                        if(medias[i].location) {
                            if(medias[i].location.latitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lat = medias[i].location.latitude;
                            }
                            if(medias[i].location.longitude) {
                                if(!msg.location) {
                                    msg.location = {};
                                }
                                msg.location.lon = medias[i].location.longitude;
                            }
                        }
                        
                        if(medias[i].created_time) {
                            msg.time = new Date(medias[i].created_time * 1000);
                        }
                        
                        if (node.outputType === "link") {
                            msg.payload = url;
                            node.send(msg);
                        } else if (node.outputType === "buffer") {
                            downloadImageAndSendAsBuffer(node, url, msg);
                        }
                    }
                }   
            } else if(areWeInPaginationRecursion === false) {
                node.warn(RED._("instagram.warn.media-fetch-failed"));
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
            node.ig.user_media_recent('self', { count : null, min_id : node.latestSelfContentID, max_id : null}, returnPagefulsOfStuff);
        } else if (node.inputType === "like") { // If we're processing likes
            node.ig.user_self_liked({ count : null, max_like_id : null}, returnPagefulsOfStuff);
        }
    }
    
    function InstagramInNode(n) {   
        RED.nodes.createNode(this,n);
        
        var node = this;
        
        node.ig = require('instagram-node').instagram();
        
        node.latestSelfContentID = null; // if the user has not liked/uploaded any content yet
        node.latestLikedID = null;

        node.inputType = n.inputType;
        node.outputType = n.outputType;
        
        node.interval = null; // used to track individual refresh intervals
        
        node.instagramConfig = RED.nodes.getNode(n.instagram);
        if (!node.instagramConfig) {
            node.warn(RED._("instagram.warn.missing-credentials"));
            return;
        }
        
        initializeInputNode(node); // the build in poll interval is getting set up at the end of init
        
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
        
        node.ig = require('instagram-node').instagram();
        
        node.inputType = n.inputType;
        node.outputType = n.outputType;
        
        node.instagramConfig = RED.nodes.getNode(n.instagram);
        if (!node.instagramConfig) {
            node.warn(RED._("instagram.warn.missing-credentials"));
            return;
        }
        
        initializeQueryNode(node);
        
        node.on("close", function() {
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
            return res.send(RED._("instagram.error.no-ui-credentials"));
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
            return res.send(RED._("instagram.error.no-credentials"));
        }
        
        if (csrfToken !== credentials.csrfToken) {
            return res.status(401).send(RED._("instagram.error.csrf-token-mismatch"));
        }
        
        RED.nodes.deleteCredentials(node_id); // we don't want to keep the csrfToken
        // from now on, credentials are in memory only
        delete credentials.csrfToken;
        
        if(!req.query.code) {
            return res.status(400).send(RED._("instagram.error.no-required-code"));
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
                return res.send(RED._("instagram.error.request-error", {err: err}));
            }
            if (data.error) {
                return res.send(RED._("instagram.error.oauth-error", {error: data.error}));
            }
            
            if(result.statusCode !== 200) {
                return res.send(RED._("instagram.error.unexpected-statuscode", {statusCode: result.statusCode, data: data}));
            }
            
            if(data.user.username) {
                credentials.username = data.user.username;
            } else {
                return res.send(RED._("instagram.error.username-fetch-fail"));
            }
            
            if(data.access_token) {
                credentials.access_token = data.access_token;   
            } else {
                return res.send(RED._("instagram.error.accesstoken-fetch-fail"));
            }
            
            RED.nodes.addCredentials(node_id,credentials);
            res.send(RED._("instagram.message.authorized"));
        });
    });
};
