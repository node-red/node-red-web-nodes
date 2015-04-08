/**
 * Copyright 2015 IBM Corp.
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
    
    function Geocode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.googleAPI = RED.nodes.getNode(n.googleAPI);
        
        var geocodeBy = n.geocodeBy;
        var nodeAddress = n.address;
        var nodeLon = n.lon;
        var nodeLat = n.lat;
        var nodeKey = n.key;
        var nodeBounds = n.bounds;
        var nodeLanguage = n.language;
        var nodeRegion = n.region;
        var nodeComponents = n.components;
        this.on('input', function(msg) {
            var key, address, lat, lon, bounds, language, region, components;
            var queryParams = {};
            if(this.googleAPI && this.googleAPI.credentials && this.googleAPI.credentials.key){
                key = this.googleAPI.credentials.key;
            } else{
                key = msg.key;
            }
            if(nodeAddress){
                address = nodeAddress;
            } else if(msg.location && msg.location.address){
                address = msg.location.address;
            }
            if(nodeLat || nodeLat === 0){
                lat = nodeLat;
            } else if(msg.location && msg.location.hasOwnProperty('lat')){
                lat = msg.location.lat;
            }
            if(nodeLon || nodeLon === 0){
                lon = nodeLon;
            } else if(msg.location && msg.location.hasOwnProperty('lon')){
                lon = msg.location.lon;
            }
            bounds = nodeBounds || msg.bounds;
            language = nodeLanguage || msg.language;
            region = nodeRegion || msg.region;
            components = nodeComponents || msg.components;
            
            var url = 'https://maps.googleapis.com/maps/api/geocode/json';
            
            if(geocodeBy === 'coordinates'){
                if((!lat && lat!==0) || (!lon && lon!==0)){        //Throw error if lat/lon (required) is missing
                    delete msg.payload;
                    msg.error = {
                        code: 400,
                        message: 'Please provide a longitude and latitude.',
                        status: 'MISSING_VALUES'
                    };
                    node.error(msg.error, msg);
                    return;
                }
                
                queryParams.latlng = lat + ',' + lon;
            } else{
              //Check for address
                if(!address){        //Throw error if address (required) is missing
                    delete msg.payload;
                    msg.error = {
                        code: 400,
                        message: 'Please provide an address.',
                        status: 'MISSING_VALUES'
                    };
                    node.error(msg.error, msg);
                    return;
                }
        
                queryParams.address = address;
                
            }
            

            if(key){
                queryParams.key = key;
            }
            if(bounds){
                queryParams.bounds = bounds;
            }
            if(language){
                queryParams.language = language;
            }
            if(region){
                queryParams.region = region;
            }
            if(components){
                queryParams.components = components;
            }
            
            //clear payload
            msg.payload = {};
            
            request.get({
                url: url,
                qs: queryParams,
                method: "GET"
            }, function(err, resp, body){
                if(err){
                    console.error(err);
                    msg.error = {
                        code: 500,
                        message: err.code,
                        status: err
                    };
                    node.error(msg.error, msg);
                    return;
                } else{
                    body = JSON.parse(body);
                    if(body.status !== "OK"){
                        msg.error = {
                            status: body.status,
                            message: body.error_message
                        };
                        switch(body.status){
                            case 'ZERO_RESULTS':
                                msg.error.code = 200;
                                break;
                            case 'OVER_QUERY_LIMIT':
                                msg.error.code = 429;
                                break;
                            case 'REQUEST_DENIED':
                                msg.error.code = 401;
                                break;
                            case 'INVALID_REQUEST':
                                msg.error.code = 400;
                                break;
                            default:
                                msg.error.code = 500;
                        }
                        if(msg.error.code !== 200){
                            node.error(msg.error, msg);
                            return;
                        }
                    } else{
                        if(geocodeBy === 'coordinates'){
                            msg.location = {
                                address: body.results[0].formatted_address,
                                description: body.results[0].formatted_address
                            };
                            msg.title = msg.description = msg.location.address;
                            msg.payload = msg.location;
                        } else{
                            msg.location = {
                                lat: body.results[0].geometry.location.lat,
                                lon: body.results[0].geometry.location.lng,
                                description: body.results[0].geometry.location.lat + ', ' + body.results[0].geometry.location.lng
                            };
                            msg.title = msg.description = msg.location.lat + ', ' + msg.location.lon;
                            msg.payload = msg.location;
                        }
                    }
                    msg.status = body.status;
                    msg.data = body;
                    msg.html_attributions = body.html_attributions;
                }
                node.send(msg);
            });
        });
        
        function throwNodeError(err, msg){
            node.status({fill:"red",shape:"ring",text:"failed"});
            msg.error = err;
            node.error(err, msg);
            return;
        }
    }
    RED.nodes.registerType("google geocoding",Geocode);
};