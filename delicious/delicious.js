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
    var request = require("request");

    function DeliciousUserNode(n) {
        RED.nodes.createNode(this,n);
        this.username = n.username;
    }
    RED.nodes.registerType("delicious-user",DeliciousUserNode,{
        credentials: {
            password: { type:"password"}
        }       
    });
    
    
    function DeliciousOutNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.tags = n.tags;
        this.toread = n.toread;
        this.private = n.private;
        
        this.user = RED.nodes.getNode(n.user);
        if (this.user) {
            this.on("input", function(msg) {
                if (!msg.payload) {
                    node.error("url must be provided in msg.payload",msg);
                    return;
                }
                if (!msg.title) {
                    node.error("msg.title must be provided",msg);
                    return;
                }
                var options = {
                    url: "https://api.delicious.com/v1/posts/add?"+
                          "url="+encodeURIComponent(msg.payload)+
                          "&description="+encodeURIComponent(msg.title)+
                          "&auth_token="+node.user.credentials.token+
                          "&shared="+((node.private !== false)?"no":"yes"),
                    auth: {
                        user: node.user.username,
                        password: node.user.credentials.password
                    }
                };
                // TODO: allow tags to be added by the message 
                if (node.tags) {
                    options.url += "&tags="+encodeURIComponent(node.tags);
                }
                if (msg.description) {
                    options.url += "&extended="+encodeURIComponent(msg.description);
                }
                
                node.status({fill:"blue",shape:"dot",text:"saving"});

                request.get(options, function(err,res,body) {
                    if (err) {
                        node.error(err,msg);
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else {
                        if (body.indexOf('code="done"') != -1) {
                            node.status({});
                        } else {
                            //TODO: This API only returns XML. Need to parse out error messages
                            node.error(body,msg);
                            node.status({fill:"red",shape:"ring",text:"failed"});
                        }
                    }
                }).on('error',function(err) {
                    node.error(err,msg);
                    node.status({fill:"red",shape:"ring",text:err.code});
                });
                
            });
        } else {
            this.error("missing credentials");
        }
        
    }
    RED.nodes.registerType("delicious out",DeliciousOutNode);
};
