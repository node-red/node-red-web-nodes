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
 
    /**
     * Swarm input node - will return the most recent check-in since
     * the node has been initialized. The node will only populate msg.payload 
     * with the JSON of the check-in if a new check-in has been made within 
     * the polling interval.
     */
    function SwarmInNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        var credentials = RED.nodes.getCredentials(n.foursquare);
        var credentialsOk = checkCredentials(node, credentials);
        if (credentialsOk) {
            var repeat = 900000; // 15 minutes
            var now = Math.floor(((new Date()).getTime())/1000); // time now, in seconds, since epoch
            var afterTimestamp = now; // means that only new check-ins (after initialization) are sent
            var lastcheckin = null;
            
            var interval = setInterval(function() {
                node.emit("input", {});
            }, repeat );
            
            this.on("input", function(msg) {
                getCheckinsAfterTimestamp(node, "self", afterTimestamp, credentials, msg, function(msg) {
                    var latestcheckin = JSON.stringify(msg);
                    if (latestcheckin !== lastcheckin) {
                        lastcheckin = latestcheckin;
                        afterTimestamp = msg.payload.createdAt; // createdAt is received via Swarm API's JSON
                        node.send(msg);
                    }
                }); 
            });

            this.on("close", function() {
                if (interval !== null) {
                    clearInterval(interval);
                }
            });

        }
    } 
    
    RED.nodes.registerType("swarm in", SwarmInNode);

    /**
     * Swarm query node - will return the most recent check-in
     * If a check-in exists the node will always return 
     * the most recent even if no new check-ins have happened since the previous query.
     * If no check-ins are found, a null msg.payload is returned.  
     */
    function SwarmQueryNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.request = n.request || "get-most-recent-checkin";
        var nodeCredentials = RED.nodes.getCredentials(n.foursquare);
        checkCredentials(node, nodeCredentials);
        this.on("input", function(msg) {
            var credentials = nodeCredentials && nodeCredentials.accesstoken ? nodeCredentials : msg.credentials || {};
            if (!credentials.accesstoken) {
                node.error("No access token available",msg);
                return;
            }
            if (node.request === "get-most-recent-checkin") {
                getCheckinsAfterTimestamp(node, "self", null, credentials, msg, function(msg) {
                    node.send(msg);
                });
            }
        });
    }

    RED.nodes.registerType("swarm", SwarmQueryNode); 
    
    function checkCredentials(node, credentials) {
        if (credentials && credentials.clientid && credentials.clientsecret && credentials.accesstoken) {
           return true;
        } else {
            node.warn("no credentials for node");
            return false;
        }
    }
    
    function getCheckinsAfterTimestamp(node, userid, afterTimestamp, credentials, msg, callback) {
        var version = "&v=20141016"; // Mandatory for Foursquare API!
        var apiUrl = "https://api.foursquare.com/v2/users/" + userid + "/checkins?oauth_token=" + credentials.accesstoken  + "&sort=newestfirst&m=swarm" + version;
        if(afterTimestamp !== null) {
            apiUrl = apiUrl + "&afterTimestamp=" + afterTimestamp;
        }
        request.get(apiUrl,function(err, httpResponse, body) {
            if (err) {
                node.error(err.toString(),msg);
                node.status({fill:"red",shape:"ring",text:"failed"});
                return;
            } else {
                var result = JSON.parse(body);
                if (result.meta.code != 200) {
                    node.error("Error code: " + result.meta.code + ", errorDetail: " + result.meta.errorDetail,msg);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    return;
                } else {
                    if (result.response.checkins.items.length !== 0) {
                      var latest = result.response.checkins.items[0];
                      msg.payload = {};
                      msg.payload = latest;
                      msg.location = {};
 
                      if (latest.location && (latest.location !== 'undefined')) {
                          msg.location.lat = latest.location.lat;
                          msg.location.lon = latest.location.lng;
                          msg.location.name = latest.location.name;
                          msg.name = latest.location.name;
                      }
                      if (latest.venue && (latest.venue !== 'undefined')) {
                          // this is ok to overwrite anything set before because the location property
                          // may or may not be there, and the same with the venue property
                         msg.location.lat = latest.venue.location.lat;
                         msg.location.lon = latest.venue.location.lng;
                         msg.location.city = latest.venue.location.city;
                         msg.location.country = latest.venue.location.country;
                         msg.location.name = latest.venue.name;
                         msg.name = latest.venue.name;
                      }
                      callback(msg);
                  } else {
                      if(afterTimestamp === null) { // if query node, always return something, when no check-ins, return empty payload
                          msg.payload = null;
                          callback(msg);
                      }
                  }
                }
            }
        });
    }
};
