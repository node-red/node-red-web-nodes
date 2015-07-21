/**
 * Copyright 2014, 2015 IBM Corp.
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
    
    function GooglePlacesQueryNode(n) {
        RED.nodes.createNode(this,n);
        
        this.googleAPI = RED.nodes.getNode(n.googleAPI);
        
        var node = this;
        var reqType = n.reqType;
        var outputAs = n.outputas || 'single';
        var outputNum = parseInt(n.outputnumber, 10) || 1;
        
        //Grab node properties
        var nodeLanguage = n.language;
        var nodeLon = n.lon;
        var nodeLat = n.lat;
        var nodeRadius = n.radius;
        var nodeRankBy = n.rankBy;
        var nodeKeyword = n.keyword;
        var nodeMinPrice = n.minPrice;
        var nodeMaxPrice = n.maxPrice;
        var nodeName = n.placeName;
        var nodeOpenNow = n.openNow;
        var nodeTypes = n.types;
        var nodePlaceId = n.placeId;
        var nodeExtensions = n.extensions;
        var nodeQuery = n.query;
        
        this.on('input', function(msg) {
            //setup and clear vars on new input
            var url, key, lat, lon, radius, rankBy, keyword, language, minPrice, maxPrice, name, types, query, placeId, extensions, openNow;
            var queryParams = {}, error = {};
            node.status({fill:"blue",shape:"dot",text:"places.status.querying"});
            if(this.googleAPI && this.googleAPI.credentials && this.googleAPI.credentials.key){
                key = this.googleAPI.credentials.key;
            } else{
                key = msg.key;
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
            if(nodeRadius){
                radius = nodeRadius;
            } else if(msg.location && msg.location.radius){
                radius = msg.location.radius;
            }
            rankBy = nodeRankBy || msg.rankby || 'prominence';
            keyword = nodeKeyword || msg.keyword;
            language = nodeLanguage || msg.language;
            if(nodeMinPrice || nodeMinPrice === 0){
                minPrice = nodeMinPrice;
            } else if (msg.hasOwnProperty('minprice')){
                minPrice = msg.minprice;
            }
            if(nodeMaxPrice || nodeMaxPrice ===0){
                maxPrice = nodeMaxPrice;
            } else if (msg.hasOwnProperty('maxprice')){
                maxPrice = msg.maxprice;
            }
            name = nodeName || msg.name;
            types = nodeTypes || msg.types;
            query = nodeQuery || msg.query || msg.payload;
            placeId = nodePlaceId || msg.placeid;
            extensions = nodeExtensions || msg.extensions;
            openNow = nodeOpenNow || msg.opennow;
            
            //Key is required for all reqTypes
            if(!key){
                console.error("API Key missing!");
                error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("places.error.no-apikey")
                };
                throwNodeError(node, msg, error);
                return;
            }
            
            //Radius must always be less than 50000 if supplied
            if(radius && radius > 50000){
                radius = 50000;
            }
            
            if(reqType === 'placesNearby'){        //Google Places Nearby request
                url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
                
                //Lat/Lon is required
                if(!(lat || lat === 0) || !(lon || lon === 0)){
                    console.error("Latitude/Longitude missing!");
                    error = {
                            code: 400,
                            status: 'MISSING_VALUES',
                            message: RED._("places.error.no-lat_lon")
                    };
                    throwNodeError(node, msg, error);
                    return;
                }
                //Check rankby to determine which other params are required
                if(rankBy && rankBy === 'distance'){        //keyword/name/types required. radius not allowed.
                    if(radius){
                        console.error('rankby set to distance, but radius still supplied.');
                        error = {
                                code: 400,
                                status: 'BAD_REQUEST',
                                message: RED._("places.error.radius-not-allowed")
                        };
                        throwNodeError(node, msg, error);
                        return;
                    } else if(!(keyword || name || types)){
                        console.error('rankby set to distance, and keyword/name/types not supplied.');
                        msg.payload = {};
                        error = {
                                code: 400,
                                status: 'BAD_REQUEST',
                                message: RED._("places.error.no-keyword_name_type")
                        };
                        throwNodeError(node, msg, error);
                        return;
                    }
                } else if( ((rankBy && rankBy === 'prominence') || (!rankBy)) && !radius){    //radius required
                    radius = 50000;
                } else if(rankBy && (rankBy !== 'prominence' && rankBy !== 'distance')){        //some other value was provided for rankBy, which is not allowed
                    console.error('Value other than \'prominence\' or \'distance\' provided for rankby.');
                    error = {
                            code: 400,
                            status: 'BAD_REQUEST',
                            message: RED._("places.error.no-prominence_distance")
                    };
                    throwNodeError(node, msg, error);
                    return;
                }
            } else if(reqType === 'placesDetails'){        //Google Places Details request
                url = 'https://maps.googleapis.com/maps/api/place/details/json';
                    
                //Check for placeId (required)
                if(!placeId){        //Throw error if placeId (required) is missing
                    console.error("placeId missing!");
                    error = {
                            code: 400,
                            status: 'MISSING_VALUES',
                            message: RED._("places.error.no-placeid")
                    };
                    throwNodeError(node, msg, error);
                    return;
                }
            } else{                //Google Places Text request (catches if reqType is not provided for compatibility purposes)
                url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
                
                //Check for query (required)
                if(!query){        //Throw error if query (required) is missing
                    console.error("Query missing!");
                    error = {
                            code: 400,
                            status: 'MISSING_VALUES',
                            message: RED._("places.error.no-text")
                    };
                    throwNodeError(node, msg, error);
                    return;
                }
                
                if((lat || lat === 0) && (lon || lon === 0) && !radius){
                    radius = 50000;
                }
            }
            if((lat || lat ===0) && (lon || lon===0)){
                queryParams.location = lat + ',' + lon;
            }
            if(radius){
                queryParams.radius = radius;
            }
            if(rankBy !== 'prominence'){
                queryParams.rankby = rankBy;
            }
            if(keyword){
                queryParams.keyword = keyword;
            }
            if(language){
                queryParams.language = language;
            }
            if(minPrice || minPrice === 0){
                queryParams.minprice = minPrice;
            }
            if(maxPrice || maxPrice === 0){
                queryParams.maxprice = maxPrice;
            }
            if(name){
                queryParams.name = name;
            }
            if(types){
                queryParams.types = types;
            }
            if(query){
                queryParams.query = query;
            }
            if(placeId){
                queryParams.placeid = placeId;
            }
            if(extensions){
                queryParams.extensions = extensions;
            }
            if(openNow){
                queryParams.opennow = openNow;
            }
            if(key){
                queryParams.key = key;
            }
//            console.log("URL: " + url);
//            console.log(queryParams);
            
            //Clear payload
            msg.payload = {};
            
            //Send request to Google
            request.get({
                url: url,
                qs: queryParams,
                method: "GET"
            }, function(err, resp, body){
                if(err){
                    console.error(err);
                    error = {
                            code: 500,
                            status: err.code,
                            message: err
                    };
                    throwNodeError(node, msg, error);
                    return;
                } else{
                    body = JSON.parse(body);
                    var msgResp, msgData;
                    if(body.status !== "OK"){
//                        console.error("status not ok!");
                        msgResp = {
                            "status": body.status,
                            "error_message" : body.error_message
                        };
                        switch(body.status){
                            case 'ZERO_RESULTS':
                                msg.statusCode = 200;
                                msg.payload.results = [];
                                break;
                            case 'OVER_QUERY_LIMIT':
                                msg.statusCode = 429;
                                break;
                            case 'REQUEST_DENIED':
                                msg.statusCode = 401;
                                break;
                            case 'INVALID_REQUEST':
                                msg.statusCode = 400;
                                break;
                            default:
                                msg.statusCode = 500;
                        }
                        msg.status = body.status;
                        if(msg.statusCode !== 200){
                            msg.error = body.error_message || '';
                            if(reqType === 'placesDetails' && msg.statusCode === 400){
                                msg.status = 'BAD_REQUEST';
                                msg.error = RED._("places.error.invalid-placeid");
                            }
                            node.status({fill:"red",shape:"ring",text:"places.status.failed"});
                            throwNodeError(node, msg, {
                                code: msg.statusCode,
                                status: msg.status,
                                message: msg.error
                            });
                            return;
                        }
                    } else{
//                        console.log("status ok!");
                        node.status({});
                        var result, i, msgs;
                        if(reqType === 'placesNearby'){
                            if(outputNum === 1){
                                result = body.results[0];
                                msg.html_attributions = body.html_attributions;
                                msg.data = body;
                                msg.status = body.status;
                                msg.title = result.name;
                                msg.placeid = result.place_id;
                                msg.description = result.name + ', ' + result.vicinity;
                                msg.location = {
                                        lat: result.geometry.location.lat,
                                        lon: result.geometry.location.lng,
                                        vicinity: result.vicinity,
                                        description: result.name + ', ' + result.vicinity
                                };
                                msg.payload = {
                                        'placeid':  result.place_id,
                                        'name': result.name,
                                        'vicinity': result.vicinity,
                                        'types': result.types
                                };
                                if(result.hasOwnProperty('rating')){
                                    msg.payload.rating = result.rating;
                                }
                                if(result.hasOwnProperty('price_level')){
                                    msg.payload.pricelevel = result.price_level;
                                }
                                if(result.opening_hours && result.opening_hours.hasOwnProperty('open_now')){
                                    msg.payload.opennow = result.opening_hours.open_now;
                                }
                            } else if(outputAs === 'single'){    //send one combined message
                                msg.html_attributions = body.html_attributions;
                                msg.data = body;
                                msg.status = body.status;
                                msg.title = (Math.min(outputNum, body.results.length)) + ' ' + RED._("places.message.results-returned");
                                msg.payload = [];
                                for(i = 0; i < (Math.min(outputNum, body.results.length)); i++){
                                    result = body.results[i];
                                    msg.payload[i] = {};
                                    msg.payload[i].title = result.name;
                                    msg.payload[i].placeid = result.place_id;
                                    msg.payload[i].description = result.name + ', ' + result.vicinity;
                                    msg.payload[i].location = {
                                            lat: result.geometry.location.lat,
                                            lon: result.geometry.location.lng,
                                            vicinity: result.vicinity,
                                            description: result.name + ', ' + result.vicinity
                                    };
                                    msg.payload[i].payload = {
                                            'placeid':  result.place_id,
                                            'name': result.name,
                                            'vicinity': result.vicinity,
                                            'types': result.types
                                    };
                                    if(result.hasOwnProperty('rating')){
                                        msg.payload[i].payload.rating = result.rating;
                                    }
                                    if(result.hasOwnProperty('price_level')){
                                        msg.payload[i].payload.pricelevel = result.price_level;
                                    }
                                    if(result.opening_hours && result.opening_hours.hasOwnProperty('open_now')){
                                        msg.payload[i].payload.opennow = result.opening_hours.open_now;
                                    }
                                }
                            } else {    //send multiple messages
                                msgs = [];
                                for(i = 0; i < (Math.min(outputNum, body.results.length)); i++){
                                    msgs[i] = {};
                                    result = body.results[i];
                                    msgs[i].html_attributions = body.html_attributions;
                                    msgs[i].data = body;
                                    msgs[i].status = body.status;
                                    msgs[i].title = result.name;
                                    msgs[i].placeid = result.place_id;
                                    msgs[i].description = result.name + ', ' + result.vicinity;
                                    msgs[i].location = {
                                            lat: result.geometry.location.lat,
                                            lon: result.geometry.location.lng,
                                            vicinity: result.vicinity,
                                            description: result.name + ', ' + result.vicinity
                                    };
                                    msgs[i].payload = {
                                            'placeid':  result.place_id,
                                            'name': result.name,
                                            'vicinity': result.vicinity,
                                            'types': result.types
                                    };
                                    if(result.hasOwnProperty('rating')){
                                        msgs[i].payload.rating = result.rating;
                                    }
                                    if(result.hasOwnProperty('price_level')){
                                        msgs[i].payload.pricelevel = result.price_level;
                                    }
                                    if(result.opening_hours && result.opening_hours.hasOwnProperty('open_now')){
                                        msgs[i].payload.opennow = result.opening_hours.open_now;
                                    }
                                }
                                msg = [msgs];
                            }
                        }
                        
                        else if(reqType === 'placesDetails'){
                            result = body.result;
                            msg.html_attributions = body.html_attributions;
                            msg.data = body;
                            msg.status = body.status;
                            msg.title = result.name;
                            msg.description = result.name + ', ' + result.formatted_address;
                            msg.location = {
                                    lat: result.geometry.location.lat,
                                    lon: result.geometry.location.lng,
                                    address: result.formatted_address,
                                    description: result.name + ', ' + result.formatted_address
                            };
                            msg.payload = {
                                    'name': result.name,
                                    'address': result.formatted_address,
                                    'phone': result.formatted_phone_number,
                                    'website': result.website || body.result.url
                            };
                            if(result.hasOwnProperty('rating')){
                                msg.payload.rating = body.result.rating;
                            }
                            if(result.hasOwnProperty('price_level')){
                                msg.payload.pricelevel = body.result.price_level;
                            }
                            if(result.opening_hours && result.opening_hours.hasOwnProperty('open_now')){
                                msg.payload.opennow = result.opening_hours.open_now;
                            }
                            if(result.opening_hours && result.opening_hours.hasOwnProperty('open')){
                                msg.payload.open = result.opening_hours.open;
                            }
                            if(result.opening_hours && result.opening_hours.hasOwnProperty('close')){
                                msg.payload.opennow = result.opening_hours.close;
                            }
                            if(result.hasOwnProperty('permanently_closed')){
                                msg.payload.permanently_closed = result.permanently_closed;
                            }
                        }
                        
                        else{        //fall into placesText for compatibility purposes
                            msg.status = body.status;
                            msg.html_attributions = body.html_attributions;
                            if(outputNum === 1){
                                result = body.results[0];
                                msg.payload = result.name;
                                msg.title = result.name;
                                msg.placeid = result.place_id;
                                if(result.formatted_address){
                                    msg.payload += ', ' + result.formatted_address;
                                }
                                if (result.geometry && result.geometry.location &&
                                        result.geometry.location.hasOwnProperty('lat') &&
                                        result.geometry.location.hasOwnProperty('lng')) {
                                    msg.location = {
                                        lat: result.geometry.location.lat,
                                        lon: result.geometry.location.lng,
                                        address: result.formatted_address,
                                        description: msg.payload
                                    };
                                }
                                msg.description = msg.payload;
                                msg.detailsJson = {
                                        'placeid':  result.place_id,
                                        'name': result.name,
                                        'address': result.formatted_address,
                                        'types': result.types
                                };
                                if(result.hasOwnProperty('price_level')){
                                    msg.detailsJson.pricelevel = result.price_level;
                                }
                                if(result.hasOwnProperty('rating')){
                                    msg.detailsJson.rating = result.rating;
                                }
                                if(result.opening_hours && result.opening_hours.hasOwnProperty('open_now')){
                                    msg.detailsJson.opennow = result.opening_hours.open_now;
                                }
                            } else if(outputAs === 'single'){    //send one combined message
                                msg.payload = [];
                                msg.title = (Math.min(outputNum, body.results.length)) + ' ' + RED._("places.message.results-returned");
                                for(i = 0; i < (Math.min(outputNum, body.results.length)); i++ ) {
                                    msg.payload[i] = {};
                                    msg.payload[i].title = body.results[i].name;
                                    msg.payload[i].payload = body.results[i].name;
                                    msg.payload[i].placeid = body.results[i].place_id;
                                    if(body.results[i].formatted_address){
                                        msg.payload[i].payload += ', ' + body.results[i].formatted_address;
                                    }
                                    if (body.results[i].geometry && body.results[i].geometry.location &&
                                            body.results[i].geometry.location.lat &&
                                            body.results[i].geometry.location.lng) {
                                        msg.payload[i].location = {
                                            lat: body.results[i].geometry.location.lat,
                                            lon: body.results[i].geometry.location.lng,
                                            address: body.results[i].formatted_address,
                                            description: msg.payload[i].payload
                                        };
                                    }
                                    msg.payload[i].description = msg.payload[i].payload;
                                    msg.payload[i].detailsJson = {
                                            'placeid':  body.results[i].place_id,
                                            'name': body.results[i].name,
                                            'address': body.results[i].formatted_address,
                                            'types': body.results[i].types
                                    };
                                    if(body.results[i].hasOwnProperty('price_level')){
                                        msg.payload[i].detailsJson.pricelevel = body.results[i].price_level;
                                    }
                                    if(body.results[i].hasOwnProperty('rating')){
                                        msg.payload[i].detailsJson.rating = body.results[i].rating;
                                    }
                                    if(body.results[i].opening_hours && body.results[i].opening_hours.hasOwnProperty('open_now')){
                                        msg.payload[i].detailsJson.opennow = body.results[i].opening_hours.open_now;
                                    }
                                }
                            } else {    //send multiple messages
                                msgs = [];
                                for(i = 0; i < (Math.min(outputNum, body.results.length)); i++ ) {
                                    msgs[i] = {};
                                    msgs[i].title = body.results[i].name;
                                    msgs[i].placeid = body.results[i].place_id;
                                    msgs[i].payload = body.results[i].name;
                                    if(body.results[i].formatted_address){
                                        msgs[i].payload += ', ' + body.results[i].formatted_address;
                                    }
                                    if (body.results[i].geometry && body.results[i].geometry.location &&
                                            body.results[i].geometry.location.lat &&
                                            body.results[i].geometry.location.lng) {
                                        msgs[i].location = {
                                            lat: body.results[i].geometry.location.lat,
                                            lon: body.results[i].geometry.location.lng,
                                            address: body.results[i].formatted_address,
                                            description: msgs[i].payload
                                        };
                                    }
                                    msgs[i].description = msgs[i].payload;
                                    msgs[i].detailsJson = {
                                        'placeid':  body.results[i].place_id,
                                        'name': body.results[i].name,
                                        'address': body.results[i].formatted_address,
                                        'types': body.results[i].types
                                    };
                                    if(body.results[i].hasOwnProperty('price_level')){
                                        msgs[i].detailsJson.pricelevel = body.results[i].price_level;
                                    }
                                    if(body.results[i].hasOwnProperty('rating')){
                                        msgs[i].detailsJson.rating = body.results[i].rating;
                                    }
                                    if(body.results[i].opening_hours && body.results[i].opening_hours.hasOwnProperty('open_now')){
                                        msgs[i].detailsJson.opennow = body.results[i].opening_hours.open_now;
                                    }
                                }
                                msg = [msgs];
                            }
                            
                        }
                    }
                }
                node.send(msg);
            });
            
        });
    }
    RED.nodes.registerType("google places", GooglePlacesQueryNode);
    
    function throwNodeError(node, msg, error){
        msg.error = error;
        node.status({fill:"red",shape:"ring",text:"places.status.failed"});
        node.error(error, msg);
    }
};