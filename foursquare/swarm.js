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
        var credentials = RED.nodes.getCredentials(n.foursquare);
        var node = this;
        var credentialsOk = checkCredentials(node, credentials);
        if (credentialsOk) {
            var repeat = 900000; // 15 mins
            var now = Math.floor(((new Date()).getTime())/1000); // time now in seconds since epoch
            var afterTimestamp = now;
            var lastcheckin = null;
            
            var interval = setInterval(function() {
                node.emit("input", {});
            }, repeat );
            
            this.on("input", function(msg) {
                getCheckinsAfterTimestamp(node, "self", afterTimestamp, credentials, msg, function(msg) {
                    var latestcheckin = JSON.stringify(msg);
                    if (latestcheckin != lastcheckin) {
                        lastcheckin = latestcheckin;
                        afterTimestamp = msg.payload.createdAt;
                        node.send(msg);
                    }
                }); 
            });                       

            this.on("close", function() {
                if (interval != null) {
                    clearInterval(interval);
                }          
            });

        }
    } 
    
    RED.nodes.registerType("swarm in", SwarmInNode);

    /**
     * Swarm query node - will return the most recent check-in since
     * the node has been initialized. If a check-in exists the node will always return 
     * the most recent even if no new check-ins have happened since the previous query.
     * The node only populates msg.payload when a check-in is found.  
     */
    function SwarmQueryNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.request = n.request || "get-most-recent-checkin";
        var credentials = RED.nodes.getCredentials(n.foursquare);
        var c = RED.nodes.getCredentials(n.swarm);
        var credentialsOk = checkCredentials(node, credentials);
        if (credentialsOk) {
          var now = Math.floor(((new Date()).getTime())/1000); // time now in seconds since epoch (rounded down)
          var afterTimestamp = now;
          
          this.on("input", function(msg) {
              if (node.request === "get-most-recent-checkin") {
                  getCheckinsAfterTimestamp(node, "self", afterTimestamp, credentials, msg, function(msg) {
                      afterTimestamp = msg.payload.createdAt - 2;
                      node.send(msg);
                  });                                  
              }
          });            
        }
    } 
    
    RED.nodes.registerType("swarm", SwarmQueryNode); 
    
    function checkCredentials(node, credentials) {       
        if (credentials && credentials.clientid && credentials.clientsecret && credentials.accesstoken) {
           return true;
        } else {
            node.error("problem with credentials being set: " + credentials + ", ");
            node.status({fill:"red",shape:"ring",text:"failed"});      
            return false;
        }
    }
    
    function getCheckinsAfterTimestamp(node, userid, afterTimestamp, credentials, msg, callback) {
        var apiUrl = "https://api.foursquare.com/v2/users/" + userid + "/checkins?oauth_token=" + credentials.accesstoken  + "&v=20141016&afterTimestamp=" + afterTimestamp+"&sort=newestfirst&m=swarm";
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
                    if (result.response.checkins.items.length !== 0) {
                      var latest = result.response.checkins.items[0];
                      msg.payload = {};
                      msg.payload = latest;
                      callback(msg);
                  }                    
                }
            }
        });              
    }
    

        
}
