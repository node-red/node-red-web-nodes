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
    var https = require("https");

    function PinboardUserNode(n) {
        RED.nodes.createNode(this,n);
    }
    RED.nodes.registerType("pinboard-user",PinboardUserNode,{
        credentials: {
            token: { type:"password" }
        }
    });
    
    
    function PinboardOutNode(n) {
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
                    hostname: "api.pinboard.in",
                    path: "/v1/posts/add?"+
                          "url="+encodeURIComponent(msg.payload)+
                          "&description="+encodeURIComponent(msg.title)+
                          "&auth_token="+node.user.credentials.token+
                          "&format=json"+
                          "&shared="+((node.private !== false)?"no":"yes")+
                          "&toread="+((node.toread === true)?"yes":"no"),
                    headers: {
                        "Accept":"application/json"
                    }
                };
                // TODO: allow tags to be added by the message 
                if (node.tags) {
                    options.path += "&tags="+encodeURIComponent(node.tags);
                }
                if (msg.description) {
                    options.path += "&extended="+encodeURIComponent(msg.description);
                }
                
                node.status({fill:"blue",shape:"dot",text:"saving"});

                https.get(options, function(res) {
                    var m = "";
                    res.on('data',function(chunk) {
                        m += chunk;
                    });
                    res.on('end',function() {
                        var result = JSON.parse(m);
                        if (result.result_code == "done") {
                            node.status({});
                        } else {
                            node.error(result.result_code,msg);
                            node.status({fill:"red",shape:"ring",text:result.result_code});
                        }
                    });
                }).on('error',function(err) {
                    node.error(err,msg);
                    node.status({fill:"red",shape:"ring",text:err.code});
                });
                
            });
        } else {
            this.error("missing api token");
        }
        
    }
    RED.nodes.registerType("pinboard out",PinboardOutNode);
};
