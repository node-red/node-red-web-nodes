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
    var xml2js = require('xml2js');
    var parseString = xml2js.parseString;
 
    function TFLUndergroundQueryNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        node.line = n.line;
        node.acceptedtcs = n.acceptedtcs;
        
        if (node.acceptedtcs) {              
            this.on("input", function(msg) {
                var apiUrl = "http://cloud.tfl.gov.uk/TrackerNet/LineStatus";   
                request.get(apiUrl,function(err, httpResponse, body) {
                    if (err) {
                        node.error(err.toString());
                        node.status({fill:"red",shape:"ring",text:"failed"});
                    } else {
                        parseString(body, {strict:true,async:true}, function (err, result) {
                            if (err) { node.error(err); }
                            else {
                                var linestatus = result.ArrayOfLineStatus.LineStatus;
                                for (var i = 0; i < linestatus.length; i++) {
                                    var linename = linestatus[i].Line[0].$.Name;
                                    if (linename === node.line) {
                                        msg.description = "Status of the " + linename + " line";
                                        msg.payload = {};
                                        msg.payload.status = linestatus[i].Status[0].$.CssClass;
                                        if (msg.payload.status === "GoodService") {
                                            msg.payload.goodservice = true;
                                        } else {
                                            msg.payload.goodservice = false;
                                        }
                                        msg.payload.description = linestatus[i].Status[0].$.Description;
                                        msg.payload.details = linestatus[i].$.StatusDetails;
                                        msg.payload.branchdisruptions = [];
                                        var disruptions = linestatus[i].BranchDisruptions;
                                        for (var j = 0; j < disruptions.length; j++) {
                                            if (disruptions[j].BranchDisruption) {
                                                msg.payload.branchdisruptions[j] = disruptions[j].BranchDisruption[0];
                                            }
                                        }
                                        
                                        msg.data = linestatus[i];
                                        break;
                                    }
                                }
                                node.send(msg);
                            }
                        });
                    }
                });
            });            
        } else {
            // shouldn't get here as UI disables OK button if the user hasn't said they've registered
            node.error("You need to register with Transport For London to to gain access to the live feeds.");
            node.status({fill:"red",shape:"ring",text:"failed"});   
        }
     } 
    
    RED.nodes.registerType("tfl underground", TFLUndergroundQueryNode); 
    
}
