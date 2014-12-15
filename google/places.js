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

    function GooglePlacesQueryNode(n) {
        RED.nodes.createNode(this, n);

        this.googleAPI = RED.nodes.getNode(n.googleAPI);

        if (!this.googleAPI || !this.googleAPI.credentials ||
            !this.googleAPI.credentials.key) {
            this.warn("Missing google API key");
            return;
        }

        var node = this;
        this.on("input", function(msg) {
            var req = {
                url: 'https://maps.googleapis.com/maps/api/place/textsearch/json?',
                qs: {}
            };
            if (msg.location && msg.location.hasOwnProperty('lat') &&
                msg.location.hasOwnProperty('lon')) {
                req.qs.location = msg.location.lat + ',' + msg.location.lon;
                req.qs.radius =
                    (msg.location.radius && msg.location.radius <= 50000 ?
                     msg.location.radius : 50000);
            }
            req.qs.query = msg.payload;
            node.status({fill:"blue",shape:"dot",text:"querying"});
            this.googleAPI.request(req, function(err, data) {
                if (err) {
                    node.warn(err);
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    delete msg.payload;
                    msg.error = "request failed";
                    msg.data = data;
                } else if (data.results.length < 1) {
                    node.warn("no results returned");
                    node.status({fill:"red",shape:"ring",text:"failed"});
                    delete msg.payload;
                    msg.error = "no results returned";
                    msg.data = data;
                } else {
                    delete msg.error;
                    var res = data.results[0];
                    node.status({});
                    msg.payload = res.name;
                    msg.title = res.name;
                    if (res.formatted_address) {
                        msg.payload += ", " + res.formatted_address;
                        msg.description = msg.payload;
                    }
                    if (res.geometry && res.geometry.location &&
                            res.geometry.location.lat &&
                            res.geometry.location.lng) {
                        msg.location = {
                            lat: res.geometry.location.lat,
                            lon: res.geometry.location.lng,
                            description: msg.payload
                        };
                    }
                    msg.html_attributions = data.html_attributions;
                    msg.data = res;
                }
                node.send(msg);
            });
        });
     }

    RED.nodes.registerType("google places", GooglePlacesQueryNode);
}
