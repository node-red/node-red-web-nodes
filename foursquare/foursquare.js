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
    var request = require('request');
    var OAuth2 = require('oauth').OAuth2;
    var crypto = require("crypto");
 
    function getOAuth2(clientid,clientsecret) {
        return new OAuth2(
            clientid,
            clientsecret,
            "https://foursquare.com/",
            'oauth2/authenticate',
            'oauth2/access_token',
            null
        );
    }
    
    function FoursquareNode(n) {
        RED.nodes.createNode(this,n);
    }
    
    RED.nodes.registerType("foursquare-credentials", FoursquareNode, {
        credentials: {
            displayname: {type: "text"},
            clientid: {type: "password"},
            clientsecret: {type: "password"},
            accesstoken: {type: "password"}
        }
    });

    /**
     * Foursquare query node
     */
    function FoursquareQueryNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.section = n.section;
        node.output = n.output || "1";
        
        var credentials = RED.nodes.getCredentials(n.foursquare);
        var credentialsOk = checkCredentials(node, credentials);
        
        if (credentialsOk) {              
            this.on("input", function(msg) {
                if (msg.location.lat && msg.location.lon) {
                    // data in the node settings overwrites that in the msg
                    if ((!node.section || (node.section === "empty")) && 
                            (msg.section && 
                                (msg.section === "food" || msg.section ==="outdoors" || msg.section === "sights"))) {
                            node.section = msg.section;
                    }
                    if (node.section && (node.section !== "empty")) {
                        getRecommendedVenuesNearLocation(node, credentials, msg, function(msg) {
                            node.send(msg);
                        });  
                    } else {
                        node.error("problem with node input: section is not defined correctly");
                        node.status({fill:"red",shape:"ring",text:"failed"});   
                    }
                                
                } else {
                    node.error("problem with node input: latitude and/or longitude not set");
                    node.status({fill:"red",shape:"ring",text:"failed"});                          
                }
            });            
        }
     } 
    
    RED.nodes.registerType("foursquare", FoursquareQueryNode); 
    
    function checkCredentials(node, credentials) {       
        if (credentials && credentials.clientid && credentials.clientsecret && credentials.accesstoken) {
           return true;
        } else {
            node.error("problem with credentials being set: " + credentials + ", ");
            node.status({fill:"red",shape:"ring",text:"failed"});      
            return false;
        }
    }
    
    function getRecommendedVenuesNearLocation(node, credentials, msg, callback) {
        var apiUrl = "https://api.foursquare.com/v2/venues/explore?oauth_token=" + credentials.accesstoken  + "&section=" + node.section + "&ll=" + msg.location.lat + "," + msg.location.lon + "&v=20141016&m=foursquare";
        request.get(apiUrl,function(err, httpResponse, body) {
            if (err) {
                node.error(err.toString());
                node.status({fill:"red",shape:"ring",text:"failed"});
            } else {
                var result = JSON.parse(body);
                if (result.meta.code != 200) {
                    node.error("Error code: " + result.meta.code + ", errorDetail: " + result.meta.errorDetail);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                } else {
                    if (result.response.groups[0].items.length !== 0) {
                        var firstVenue = result.response.groups[0].items[0];
                        msg.payload = {};
                        msg.payload = firstVenue;
                        msg.location.lat = firstVenue.venue.location.lat;
                        msg.location.lon = firstVenue.venue.location.lng;
                        msg.title = firstVenue.venue.name;
                        callback(msg);
                  } else {
                      msg.payload = null; 
                      callback(msg);
                  }                    
                }
            }
        });              
    }
    
    RED.httpAdmin.get('/foursquare-credentials/auth', function(req, res){
        if (!req.query.clientid || !req.query.clientsecret || !req.query.id || !req.query.callback) {
            return res.status(400).send('ERROR: request does not contain the required parameters');
        }
        var nodeid = req.query.id;
        
        var credentials = RED.nodes.getCredentials(nodeid) || {};
        credentials.clientid = req.query.clientid || credentials.clientid;
        credentials.clientsecret = req.query.clientsecret || credentials.clientsecret;

        if (!credentials.clientid || !credentials.clientsecret) {
            return res.status(400).send('ERROR: client ID and client secret are not defined');
        }
        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        res.cookie('csrf', csrfToken);
        credentials.csrftoken = csrfToken;
        RED.nodes.addCredentials(nodeid,credentials);
        
        var oa2 = getOAuth2(credentials.clientid,credentials.clientsecret);
        
        var url = oa2.getAuthorizeUrl({redirect_uri : req.query.callback, response_type: "code", state: nodeid + ":" + csrfToken});
        res.redirect(url);
    });

    RED.httpAdmin.get('/foursquare-credentials/auth/callback', function(req, res){
        if (req.query.error) {
            return res.send("ERROR: " + req.query.error + ": " + req.query.error_description);
        }
        var state = req.query.state.split(":");
        var nodeid = state[0];
        
        var credentials = RED.nodes.getCredentials(nodeid);
        
        if (!credentials || !credentials.clientid || !credentials.clientsecret) {
            return res.status(400).send('ERROR: no credentials - should never happen');
        }
        if(state[1]  !== credentials.csrftoken) {
            return res.status(401).send('CSRF token mismatch, possible cross-site request forgery attempt');
        }
        
        var clientid = credentials.clientid;
        var clientsecret = credentials.clientsecret;

        var oa2 = getOAuth2(clientid,clientsecret);

        var arr = req.url.split('?');
        var callback = req.protocol + "://" + req.get('host') + arr[0];

        oa2.getOAuthAccessToken(                
                    req.query.code,
                     {redirect_uri: callback, grant_type : 'authorization_code'},
                     function(error, oauth_access_token, oauth_refresh_token, results){
                         if (error) {
                             var resp = '<h2>Oh no!</h2>'+
                             '<p>Something went wrong with the authentication process. The following error was returned:</p>'+
                             '<p><b>'+error.statusCode+'</b>: '+error.data+'</p>';
                             res.send(resp)
                         } else {
                             var apiUrl = "https://api.foursquare.com/v2/users/self?oauth_token=" + oauth_access_token  + "&v=20141016";
                             var r = request.get(apiUrl,function(err, httpResponse, body) {
                                 if (err) {
                                     var resp = '<h2>Oh no!</h2>'+
                                     '<p>Something went wrong with the authentication process. The following error was returned:</p>'+
                                     '<p><b>'+err.statusCode+'</b>: '+err.data+'</p>';
                                     res.send(resp)
                                 } else {
                                     var result = JSON.parse(body);
                                     if (result.meta.code != 200) {
                                         var message = '<h2>Oh no!</h2>'+
                                         '<p>Something went wrong with the authentication process. Http return code:</p>'+
                                         '<p><b>'+result.meta.code+'</b></p>';
                                         res.send(message)                                         
                                     } else {
                                         credentials = {};
                                         credentials.displayname = result.response.user.firstName + " " + result.response.user.lastName;
                                         credentials.clientid = clientid;
                                         credentials.clientsecret = clientsecret;
                                         credentials.accesstoken = oauth_access_token;
                                         RED.nodes.addCredentials(nodeid,credentials);
                                         res.send("<html><head></head><body>Authorised - you can close this window and return to Node-RED</body></html>");                                         
                                     }
                                 }
                             });              
                         }
                     }
        );

    });
    
}
