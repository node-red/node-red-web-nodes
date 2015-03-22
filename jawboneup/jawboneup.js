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
    
    function getOAuth2(clientid,appsecret) {
        return new OAuth2(
            clientid,
            appsecret,
            "https://jawbone.com/auth/",
            'oauth2/auth',
            'oauth2/token',
            null
        );
    }
    
    function JawboneupNode(n) {
        RED.nodes.createNode(this,n);
    }
    
    RED.nodes.registerType("jawboneup-credentials", JawboneupNode, {
        credentials: {
            displayname: {type: "text"},
            clientid: {type: "password"},
            appsecret: {type: "password"},
            accesstoken: {type: "password"}
        }
    });
 
    function JawboneupQueryNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.outputNumber = parseInt(n.outputnumber) || 1;
        node.outputAs = n.outputas || "multiple";
        node.starttime = n.starttime;
        
        var credentials = RED.nodes.getCredentials(n.jawboneup);
        var credentialsOk = checkCredentials(node, credentials);
        if (credentialsOk) {
          this.on("input", function(msg) {
              var starttime = node.starttime || msg.starttime;
              if (!starttime) {
                  var date = new Date();
                  starttime = (new Date()).getTime();
              }
              var options = {
                      uri: "https://jawbone.com/nudge/api/v.1.1/users/@me/workouts?start_time=" + starttime,
                      headers: {
                          "Authorization":"Bearer  " + credentials.accesstoken
                      }
              };
              var r = request.get(options,function(err, httpResponse, body) {
                  if (err) {
                      node.error(err.toString(),msg);
                      node.status({fill:"red",shape:"ring",text:"failed"});
                  } else {
                      var result = JSON.parse(body);
                      if (result.meta.code != 200) {
                          node.error("Error code: " + result.meta.code + ", error type: " + result.meta.error_type + ", error detail: " + result.meta.error_detail + ", message: " + result.meta.message);
                          node.status({fill:"red",shape:"ring",text:"failed"});
                      } else {
                          if (result.data.items.length !== 0) {
                              if (node.outputNumber === 1) {
                                  createMsg(msg, result.data.items[0]);
                                  node.send(msg);                               
                              } else if (node.outputAs === "single") {
                                  msg.location = null;
                                  msg.title = null;
                                  // returning as a single msg sets msg.payload to be an array of workouts found
                                  msg.payload = collateResults(node, result.data.items);
                                  node.send(msg);                                  
                              } else if (node.outputAs === "multiple") {
                                  var workouts = collateResults(node, result.data.items);
                                  var msgs = [];
                                  for (var i = 0; i < workouts.length; i++) {
                                      var clone = RED.util.cloneMessage(msg);
                                      clone.payload = workouts[i].payload;
                                      msgs[i] = clone;
                                  }
                                  node.send([msgs]);                                  
                              } else {
                                  // shouldn't ever get here
                                  node.error("Incorrect number of messages to output or incorrect choice of how to output them",msg);
                                  node.status({fill:"red",shape:"ring",text:"failed"});
                              }
                         } else {
                              msg.payload = null; 
                              node.send(msg);
                          }     
                      }
                  }
              });
          });
        }
    } 
    
    RED.nodes.registerType("jawboneup", JawboneupQueryNode); 
    
    function checkCredentials(node, credentials) {
        if (credentials && credentials.clientid && credentials.appsecret && credentials.accesstoken) {
           return true;
        } else {
            node.error("problem with credentials being set: " + credentials + ", ");
            node.status({fill:"red",shape:"ring",text:"failed"});      
            return false;
        }
    }
 
    function createMsg(message, workout) {
        message.payload = {};
        message.payload = workout;
        message.payload.id = workout.xid;
        message.payload.type = workout.title;
        message.payload.starttime = new Date(workout.time_created);
        if(workout.details) {
            message.payload.duration = workout.details.time;
            message.payload.distance = workout.details.meters;
            message.payload.calories = workout.details.calories;            
        }
        message.data = workout;
        message.title = workout.title;
        
        message.location = {};     
        message.location.lat = workout.place_lat;
        message.location.lon  = workout.place_lon;
    }
    
    function collateResults(node, results) {
        var collatedResults = [];
        var numberToReturn = Math.min(node.outputNumber,results.length);
        for (var i = 0; i < numberToReturn; i++) {
            collatedResults[i] = {};
            createMsg(collatedResults[i],results[i]);
        }        
        return collatedResults;
    }     
    
    RED.httpAdmin.get('/jawboneup-credentials/auth', function(req, res){
        if (!req.query.clientid || !req.query.appsecret || !req.query.id || !req.query.callback) {
            return res.status(400).send('ERROR: request does not contain the required parameters');
        }
        var nodeid = req.query.id;
        
        var credentials = RED.nodes.getCredentials(nodeid) || {};
        credentials.clientid = req.query.clientid || credentials.clientid;
        credentials.appsecret = req.query.appsecret || credentials.appsecret;

        if (!credentials.clientid || !credentials.appsecret) {
            return res.status(400).send('ERROR: client ID and client secret are not defined');
        }
        var csrfToken = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        res.cookie('csrf', csrfToken);
        credentials.csrftoken = csrfToken;
        RED.nodes.addCredentials(nodeid,credentials);
        
        var oa2 = getOAuth2(credentials.clientid,credentials.appsecret);
        
        var url = oa2.getAuthorizeUrl({
            redirect_uri : req.query.callback, 
            response_type: "code", 
            scope:"basic_read move_read move_write", 
            state: nodeid + ":" + csrfToken
        });
        
        res.redirect(url);
    });

    RED.httpAdmin.get('/jawboneup-credentials/auth/callback', function(req, res){
        if (req.query.error) {
            return res.send("ERROR: " + req.query.error + ": " + req.query.error_description);
        }
        var state = req.query.state.split(":");
        var nodeid = state[0];
        
        var credentials = RED.nodes.getCredentials(nodeid);
        
        if (!credentials || !credentials.clientid || !credentials.appsecret) {
            return res.status(400).send('ERROR: no credentials - should never happen');
        }
        if(state[1]  !== credentials.csrftoken) {
            return res.status(401).send('CSRF token mismatch, possible cross-site request forgery attempt');
        }
        
        var clientid = credentials.clientid;
        var appsecret = credentials.appsecret;

        var oa2 = getOAuth2(clientid,appsecret);

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
                             if (results.error) {
                                 var response = '<h2>Oh no!</h2>'+
                                 '<p>Something went wrong with the authentication process. The following error was returned:</p>'+
                                 '<p><b>'+results.error+'</b>: '+results.error_description+'</p>';
                                 res.send(response);
                            } else {
                                // note the extra whitespace after "Bearer" is required otherwise api call will return 401
                                var options = {
                                        uri: "https://jawbone.com/nudge/api/v.1.1/users/@me",
                                        headers: {
                                            "Authorization":"Bearer  " + oauth_access_token
                                        }
                                    };
                                var r = request.get(options,function(err, httpResponse, body) {
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
                                            credentials.displayname = result.data.first + " " + result.data.last;
                                            credentials.clientid = clientid;
                                            credentials.appsecret = appsecret;
                                            credentials.accesstoken = oauth_access_token;
                                            RED.nodes.addCredentials(nodeid,credentials);
                                            res.send("<html><head></head><body>Authorised - you can close this window and return to Node-RED</body></html>");                                         
                                        }
                                    }
                                });              
                                
                            }
                         }
                     }
        );

    });
    
};
