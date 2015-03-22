/**
 * Copyright 2013 IBM Corp.
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
    var OAuth= require('oauth').OAuth;
    var request = require('request');
    var querystring = require("querystring");
    var util = require("util");
    
        
    function getOAuth(client_key,client_secret) {
        return new OAuth(
            "https://www.flickr.com/services/oauth/request_token",
            "https://www.flickr.com/services/oauth/access_token",
            client_key,
            client_secret,
            1.0,
            null,
            "HMAC-SHA1"
        );
    }
    
    
    function FlickrNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
    }
    RED.nodes.registerType("flickr-credentials",FlickrNode,{
        credentials: {
            username: {type:"text"},
            user_nsid: { type:"text"},
            client_key: { type: "password"},
            client_secret: { type: "password"},
            access_token: {type: "password"},
            access_token_secret: {type:"password"}
        }       
    });

    function FlickrOutNode(n) {
        RED.nodes.createNode(this,n);
        this.flickrConfig = RED.nodes.getNode(n.flickr);
        if (!this.flickrConfig) {
            this.error("Missing flickr credentials");
            return;
        }
        this.tags = n.tags;
        
        this.privacy = n.privacy;
        if (this.privacy) {
            this.is_public = (this.privacy == "p")?"1":"0"; 
            this.is_friend = (this.privacy == "fr" || this.privacy == "frfa")?"1":"0";
            this.is_family = (this.privacy == "fa" || this.privacy == "frfa")?"1":"0";
        }
        
        if (this.flickrConfig.credentials.access_token && this.flickrConfig.credentials.access_token_secret) {
            var oa = getOAuth(this.flickrConfig.credentials.client_key,this.flickrConfig.credentials.client_secret);
            var node = this;
            this.on('input', function(msg) {
                if (Buffer.isBuffer(msg.payload)) {
                    var options = {
                        api_key:"e99784b8ff80eaabc9c096b22e517c13"
                    };
                    if (msg.title) {
                        options.title = RED.util.ensureString(msg.title);
                    }
                    if (msg.description) {
                        options.description = RED.util.ensureString(msg.description);
                    }
                    if (msg.tags || node.tags) {
                        var tags = "";
                        if (typeof msg.tags === "string") {
                            tags = msg.tags;
                        } else if (util.isArray(msg.tags)) {
                            tags = msg.tags.join(" ");
                        }
                        if (node.tags) {
                            tags += (tags.length > 0 ? " ":"")+node.tags;
                        }
                        options.tags = tags;
                    }
                    if (node.privacy) {
                        options.is_public = node.is_public;
                        options.is_friend = node.is_friend;
                        options.is_family = node.is_family;
                    }
                    
                    node.status({fill:"blue",shape:"dot",text:"uploading"});

                    var apiUrl = "https://up.flickr.com/services/upload/";
                    var signedUrl = oa.signUrl(apiUrl+'?'+querystring.stringify(options),
                        this.flickrConfig.credentials.access_token,
                        this.flickrConfig.credentials.access_token_secret,
                        "POST");
                    
                    var signedUrlOptions = require('url').parse(signedUrl, true);
                    
                    var r = request.post(apiUrl,function(err, httpResponse, body) {
                        if (err) {
                            node.error(err.toString());
                            node.status({fill:"red",shape:"ring",text:"failed"});
                        } else {
                            if (body.indexOf('stat="ok"') != -1) {
                                node.status({});
                            } else {
                                //TODO: This API only returns XML. Need to parse out error messages
                                node.error(body,msg);
                                node.status({fill:"red",shape:"ring",text:"failed"});
                            }
                        }
                    });
                    var form = r.form();
                    for (var p in signedUrlOptions.query) {
                        if (signedUrlOptions.query.hasOwnProperty(p)) {
                            form.append(p,signedUrlOptions.query[p]);
                        }
                    }
                    form.append('photo',msg.payload,{filename:"image_upload"});
                }
            });
        }
    }
    RED.nodes.registerType("flickr out",FlickrOutNode);


    
    RED.httpAdmin.get('/flickr-credentials/:id/auth', function(req, res){
            
        if (!req.query.client_key || !req.query.client_secret || !req.query.callback) {
            res.send(400);
            return;
        }
        
        var credentials = {
            client_key:req.query.client_key,
            client_secret: req.query.client_secret
        };
        RED.nodes.addCredentials(req.params.id,credentials);
        
        var oa = getOAuth(credentials.client_key,credentials.client_secret);
        
        oa.getOAuthRequestToken({
                oauth_callback: req.query.callback
        },function(error, oauth_token, oauth_token_secret, results){
            if (error) {
                var resp = '<h2>Oh no!</h2>'+
                '<p>Something went wrong with the authentication process. The following error was returned:<p>'+
                '<p><b>'+error.statusCode+'</b>: '+error.data+'</p>'+
                '<p>One known cause of this type of failure is if the clock is wrong on system running Node-RED.';
                res.send(resp);
            } else {
                credentials.oauth_token = oauth_token;
                credentials.oauth_token_secret = oauth_token_secret;
                res.redirect('https://www.flickr.com/services/oauth/authorize?oauth_token='+oauth_token);
                RED.nodes.addCredentials(req.params.id,credentials);
            }
        });
    });

    RED.httpAdmin.get('/flickr-credentials/:id/auth/callback', function(req, res, next){
        var credentials = RED.nodes.getCredentials(req.params.id);
        credentials.oauth_verifier = req.query.oauth_verifier;
        var client_key = credentials.client_key;
        var client_secret = credentials.client_secret;
        var oa = getOAuth(client_key,client_secret);

        oa.getOAuthAccessToken(
            credentials.oauth_token,
            credentials.oauth_token_secret,
            credentials.oauth_verifier,
            function(error, oauth_access_token, oauth_access_token_secret, results){
                if (error){
                    console.log(error);
                    res.send("Something broke.");
                } else {
                    credentials = {};
                    credentials.client_key = client_key;
                    credentials.client_secret = client_secret;
                    credentials.access_token = oauth_access_token;
                    credentials.access_token_secret = oauth_access_token_secret;
                    credentials.username = results.username;
                    credentials.user_nsid = results.user_nsid;
                    RED.nodes.addCredentials(req.params.id,credentials);
                    res.send("<html><head></head><body>Authorised - you can close this window and return to Node-RED</body></html>");
                }
            }
        );
    });
};
