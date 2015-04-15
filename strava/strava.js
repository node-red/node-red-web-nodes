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

    function StravaCredentialsNode(n) {
        RED.nodes.createNode(this,n);
    }
    
    /*
     * This function get the first activity from the list of activities
     * for the authenticated user by hitting the endpoint of:
     * 
     * https://www.strava.com/api/v3/athlete/activities
     * 
     * The reply does contain some activity data already but normal
     * flow is to get the detailed data in an explicit query as the
     * explicit query serves more information.
     */
    function getMostRecentActivityIDForSelf(node, callback) {
        request.get({
            url: 'https://www.strava.com/api/v3/athlete/activities',
            json: true,
            headers: {
                Authorization: "Bearer " + node.access_token
            },
        }, function(err, result, data) {
            var activityIDToReturn;
            var error;
            if (err) {
                return callback(null,err);
            }
            if (data.error) {
                return callback(null,node.error);
            }
            
            if(result.statusCode !== 200) {
                console.log(data);
                return callback(null,result.statusCode);
            }
            
            if(data.length > 0) {
                if(data[0].id) {
                    activityIDToReturn = data[0].id;
                } else {
                    return callback(null,"No activity ID");
                }
            }
            
            callback(activityIDToReturn, error);
        });
    }
    
    /*
     * Get the details for an activity based on its Strava Activity ID.
     * 
     * https://www.strava.com/api/v3/athlete/activities/:id
     */
    function getActivity(node, activityID, callback) {
        request.get({
            url: 'https://www.strava.com/api/v3/activities/' + activityID,
            json: true,
            headers: {
                Authorization: "Bearer " + node.access_token
            },
        }, function(err, result, data) {
            var activityDetails;
            var error;
            if (err) {
                return callback(null,err);
            }
            if(data) {
                if (data.error) {
                    return callback(null,data.error);
                }
                if(result.statusCode !== 200) {
                    console.log(data);
                    return callback(null,result.statusCode);
                }
                
                activityDetails = data;
            }
            
            callback(activityDetails, error);
        });
    }
    
    function populateMsgSync(node, msg, activityDetails) {
        msg.data = activityDetails; // msg.data contains everything Strava returns
        
        msg.payload = {};
        
        if(activityDetails.id) {
            msg.payload.id = activityDetails.id;
        }
        
        if(activityDetails.type) {
            msg.payload.type = activityDetails.type;
        }
        
        if(activityDetails.name) {
            msg.payload.title = activityDetails.name;
        }
        
        if(activityDetails.elapsed_time || activityDetails.moving_time) { // already in seconds
            if(activityDetails.elapsed_time) { // elapsed_time is preferred
                msg.payload.duration =  activityDetails.elapsed_time;
            } else {
                msg.payload.duration =  activityDetails.moving_time;
            }
        }
        
        if(activityDetails.distance) { // already in metres
            msg.payload.distance = activityDetails.distance;
        }
        
        if(activityDetails.distance) {
            msg.payload.distance = activityDetails.distance;
        }
        
        if(activityDetails.calories) {
            msg.payload.calories = activityDetails.calories;
        }
        
        if(activityDetails.start_date || activityDetails.start_date_local) {
            var useLocalTime = false;
            if(activityDetails.start_date_local) {
                useLocalTime = true;
            }
            try {
                // It's formatted as 2014-12-05T11:30:00Z => ISO8601 so we're lucky and can parse this
                var time;
                if(useLocalTime ===  true) {
                    time = Date.parse(activityDetails.start_date_local);
                } else {
                    time = Date.parse(activityDetails.start_date);
                }
                msg.payload.starttime = new Date(time);
            } catch (err) { // never actually trust date parsing ;)
            }
        }
        // Adding extra fields
        if(activityDetails.start_latitude && activityDetails.start_longitude) {
            if(!msg.location) {
                msg.location = {};
            }
            msg.location.lat = activityDetails.start_latitude;
            msg.location.lon = activityDetails.start_longitude;
        }
    }
    
    function StravaNode(n) {
        RED.nodes.createNode(this,n);
        
        var node = this;
        node.stravaConfig = RED.nodes.getNode(n.strava);
        node.request = n.request || "get-most-recent-activity";
        
        if(node.stravaConfig && node.stravaConfig.credentials) {
            if(!node.stravaConfig.credentials.access_token) {
                node.warn("Missing Strava access token. Authorization has not been completed before node initialization.");
                return;
            }   
        } else {
            node.warn("Missing Strava configuration or credentials. Authorization has not been completed before node initialization.");
            return;
        }
        
        node.access_token = node.stravaConfig.credentials.access_token;
        
        node.on("input", function(msg) {
            if(node.request === "get-most-recent-activity") {
                getMostRecentActivityIDForSelf(node, function(activityID, error) {
                    if(error) {
                        node.error(error,msg);
                    } else {
                        if (activityID) {
                            getActivity(node, activityID, function(activityDetails, error) {
                                if(error) {
                                    node.error(error,msg);
                                } else if (activityDetails) {
                                    populateMsgSync(node, msg, activityDetails);
                                    node.send(msg);
                                }
                             });
                        }
                    }
                });   
            }
        });
        
        node.on("close", function() {
            node.stravaConfig = null;
            node.request = null;
        });
    }
    
    RED.nodes.registerType("strava-credentials",StravaCredentialsNode, {
        credentials: {
            username: {type:"text"},
            clientID: {type:"text"},
            redirectURI: { type:"text"},
            access_token: {type: "password"}
        }
    });
    
    RED.nodes.registerType("strava",StravaNode);
    
    RED.httpAdmin.get('/strava-credentials/auth', function(req, res) {
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
            hostname: 'www.strava.com',
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
    
    RED.httpAdmin.get('/strava-credentials/auth/callback', function(req, res) {
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
            return res.status(400).send('The callback from Strava did not contain a required code');
        }
        
        credentials.code = req.query.code;
        
        request.post({
            url: 'https://www.strava.com/oauth/token',
            json: true,
            form: {
                client_id: credentials.client_id,
                client_secret: credentials.client_secret,
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
                console.log(data);
                return res.send("Strava replied with the unexpected HTTP status code of " + result.statusCode);
            }
            
            if(data.athlete && data.athlete.firstname && data.athlete.lastname) {
                credentials.username = data.athlete.firstname + " " + data.athlete.lastname;
            } else {
                return res.send('Error! Strava node has failed to fetch the authenticated user\'s name.');
            }
            
            if(data.access_token) {
                credentials.access_token = data.access_token;
            } else {
                return res.send('Error! Strava node has failed to fetch a valid access token.');
            }
            
            RED.nodes.addCredentials(node_id,credentials);
            res.send("<html><head></head><body>Successfully authorized with Strava. You can close this window now.</body></html>");
        });
    });
};
