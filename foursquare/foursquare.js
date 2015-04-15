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
        node.outputNumber = parseInt(n.outputnumber) || 50;
        node.outputAs = n.outputas || "multiple";
        node.openday = n.openday || "today";
        node.opentime = n.opentime || "currenttime";

        var nodeCredentials = RED.nodes.getCredentials(n.foursquare);
        checkCredentials(node, nodeCredentials);

        this.on("input", function(msg) {
            var credentials = nodeCredentials && nodeCredentials.accesstoken ? nodeCredentials : msg.credentials || {};
            if (!credentials.accesstoken) {
                node.error("No access token available",msg);
                return;
            }
            if (msg.location.lat && msg.location.lon) {
                // data in the node settings overwrites that in the msg
                if ((!node.section || (node.section === "empty")) &&
                    (msg.section &&
                     (msg.section === "food" || msg.section ==="drinks" ||
                      msg.section === "coffee" || msg.section === "shops" ||
                      msg.section === "arts" || msg.section === "outdoors" ||
                      msg.section === "sights" || msg.section === "all"))) {
                            node.section = msg.section;
                }
                if (node.section && (node.section !== "empty")) {
                    getRecommendedVenuesNearLocation(node, credentials, msg, function(msg) {
                        node.send(msg);
                    });
                } else {
                    node.error("problem with node input: section is not defined correctly",msg);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                }
            } else {
                node.error("problem with node input: latitude and/or longitude not set",msg);
                node.status({fill:"red",shape:"ring",text:"failed"});
            }
        });
     }

    RED.nodes.registerType("foursquare", FoursquareQueryNode);

    function checkCredentials(node, credentials) {
        if (credentials && credentials.clientid && credentials.clientsecret && credentials.accesstoken) {
            return true;
        } else {
            node.warn("no credentials for node");
            return false;
        }
    }

    function getRecommendedVenuesNearLocation(node, credentials, msg, callback) {
        var apiUrl = "https://api.foursquare.com/v2/venues/explore?oauth_token=" + credentials.accesstoken;   
        if (node.section !== "all") {
            apiUrl = apiUrl  + "&section=" + node.section;
        }
        if (node.openday === "any") {
            apiUrl = apiUrl  + "&day=any";
        }
        if (node.opentime === "any") {
            apiUrl = apiUrl  + "&time=any";
        }
        apiUrl = apiUrl + "&ll=" + msg.location.lat + "," + msg.location.lon + "&v=20141016&m=foursquare";
        
        request.get(apiUrl,function(err, httpResponse, body) {
            if (err) {
                node.error(err.toString());
                node.status({fill:"red",shape:"ring",text:"failed"});
            } else {
                var result = JSON.parse(body);
                if (result.meta.code != 200) {
                    node.error("Error code: " + result.meta.code + ", errorDetail: " + result.meta.errorDetail,msg);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    return;
                } else {
                    if (result.response.groups[0].items.length !== 0) {
                        if (node.outputNumber === 1) {
                            var firstVenue = result.response.groups[0].items[0];
                            msg.payload = {};
                            msg.payload = firstVenue;
                            msg.location.lat = firstVenue.venue.location.lat;
                            msg.location.lon = firstVenue.venue.location.lng;
                            msg.location.name = firstVenue.venue.name;
                            msg.location.city = firstVenue.venue.location.city;
                            msg.location.country = firstVenue.venue.location.country;
                            msg.title = firstVenue.venue.name;
                            callback(msg);  
                        } else if (node.outputAs === "single") {
                            // reset the location/title information as they make no sense here
                            msg.location = null;
                            msg.title = null;
                            // returning as a single msg sets msg.payload to be an array of venues found
                            msg.payload = collateVenuesFound(node, result.response.groups[0].items);
                            callback(msg);
                        } else if (node.outputAs === "multiple") {
                            var venues = collateVenuesFound(node, result.response.groups[0].items);
                            var msgs = [];
                            for (var i = 0; i < venues.length; i++) {
                                var clone = RED.util.cloneMessage(msg);
                                clone.payload = venues[i].payload;
                                clone.location = venues[i].location;
                                clone.title = venues[i].title;
                                msgs[i] = clone;
                            }
                            callback([msgs]);
                        } else {
                            // shouldn't ever get here
                            node.error("Incorrect number of messages to output or incorrect choice of how to output them",msg);
                            node.status({fill:"red",shape:"ring",text:"failed"});
                        }
                    
                  } else {
                      msg.payload = null; 
                      callback(msg);
                  }                    
                }
            }
        });              
    }
    
    function collateVenuesFound(node, venuesFound) {
        var venues = [];
        var numberToReturn = Math.min(node.outputNumber,venuesFound.length);
        for (var i = 0; i < numberToReturn; i++) {
            var venue = venuesFound[i];
            venues[i] = {};
            venues[i].payload = venue;
            venues[i].location = {};
            venues[i].location.lat = venue.venue.location.lat;
            venues[i].location.lon = venue.venue.location.lng;
            venues[i].location.name = venue.venue.name;
            venues[i].location.city = venue.venue.location.city;
            venues[i].location.country = venue.venue.location.country;
            venues[i].title = venue.venue.name;
        }        
        return venues;
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
                             res.send(resp);
                         } else {
                             var apiUrl = "https://api.foursquare.com/v2/users/self?oauth_token=" + oauth_access_token  + "&v=20141016";
                             var r = request.get(apiUrl,function(err, httpResponse, body) {
                                 if (err) {
                                     var resp = '<h2>Oh no!</h2>'+
                                     '<p>Something went wrong with the authentication process. The following error was returned:</p>'+
                                     '<p><b>'+err.statusCode+'</b>: '+err.data+'</p>';
                                     res.send(resp);
                                 } else {
                                     var result = JSON.parse(body);
                                     if (result.meta.code != 200) {
                                         var message = '<h2>Oh no!</h2>'+
                                         '<p>Something went wrong with the authentication process. Http return code:</p>'+
                                         '<p><b>'+result.meta.code+'</b></p>';
                                         res.send(message);
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
    
};
