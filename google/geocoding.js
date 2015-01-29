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
	
	function Geocode(config) {
		RED.nodes.createNode(this,config);
        var node = this;
		var geocodeBy = config.geocodeBy;
		var nodeAddress = config.address;
		var nodeLng = config.lng;
		var nodeLat = config.lat;
		var nodeKey = config.key;
		var nodeBounds = config.bounds;
		var nodeLanguage = config.language;
		var nodeRegion = config.region;
		var nodeComponents = config.components;
		var nodeSendFullResult = config.sendFullResult;
		this.on('input', function(msg) {
			var queryParams = {};
			var key, bounds, language, region, components;
			var sendFullResult = false;
			var url = 'https://maps.googleapis.com/maps/api/geocode/json';
			
			if(geocodeBy === 'address'){
				var address;
				
				//Check for address
				if(msg.address){
					address = msg.address;
				} else if(nodeAddress){
					address = nodeAddress;
				} else{		//Throw error if address (required) is missing
					console.error("Address missing!");
					delete msg.payload
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide an address";
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide an address."
					msg.statusCode = 400;
					node.send(msg);
					return;
				}
		
				console.log("address: " + address);
				queryParams.address = address;
				
			} else if(geocodeBy === 'coordinates'){
				var lng, lat;
				
				if(msg.location && msg.location.lat){
					lat = msg.location.lat;
				} else if(nodeLat){
					lat = nodeLat;
				} else{		//Throw error if lat (required) is missing
					console.error("Latitude missing!");
					delete msg.payload;
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide a longitude and latitude."
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a longitude and latitude."
					msg.statusCode = 400;
					node.send(msg);
					return;
				}
				
				console.log("lat: " + lat);
				
				if(msg.location && msg.location.lng){
					lng = msg.location.lng;
				} else if(nodeLng){
					lng = nodeLng;
				} else{		//Throw error if lng (required) is missing
					console.error("Longitude missing!");
					delete msg.payload;
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide a longitude and latitude."
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a longitude and latitude."
					msg.statusCode = 400;
					node.send(msg);
					return;
				}
				
				console.log("lng: " + lng);
				
				queryParams.latlng = lat + ',' + lng;
			}
			
			//Check for API Key
			if(msg.key){
				key = msg.key;
			} else if(nodeKey){
				key = nodeKey;
			}
			if(key){
				console.log("key: " + key);
				queryParams.key = key;
			}
			
			//Check for Bounds
			if(msg.bounds){
				bounds = msg.bounds;
			} else if(nodeBounds){
				bounds = nodeBounds;
			}
			if(bounds){
				console.log("bounds: " + bounds);
				queryParams.bounds = bounds;
			}
			
			//Check for Language
			if(msg.language){
				language = msg.language;
			} else if(nodeLanguage){
				language = nodeLanguage;
			}
			if(language){
				console.log("language: " + language);
				queryParams.language = language;
			}
			
			
			//Check for Region
			if(msg.region){
				region = msg.region;
			} else if(nodeRegion){
				region = nodeRegion;
			}
			if(region){
				console.log("region: " + region);
				queryParams.region = region;
			}
			
			//Check for Components
			if(msg.components){
				components = msg.components;
			} else if(nodeComponents){
				components = nodeComponents;
			}
			if(components){
				console.log("components: " + components);
				queryParams.components = components;
			}
			
			//Check to send full result or just part
			if(msg.sendFullResult){
				sendFullResult = msg.sendFullResult;
			} else if(nodeSendFullResult){
				sendFullResult = nodeSendFullResult;
			}
			if(sendFullResult){
				console.log("sendFullResult: " + sendFullResult);
			}
			
			console.log("URL: " + url);
			console.log(queryParams);
			
			//clear payload
			delete msg.payload;
			
			request.get({
				url: url,
				qs: queryParams,
				method: "GET"
			}, function(err, resp, body){
				if(err){
					console.error(err);
					node.warn(err);
                    node.status({fill:"red",shape:"ring",text:"failed"});
					msg.statusCode = 500;
					msg.status = err.code;
					msg.error_message = err;
					msg.payload.status = err.code;
					msg.payload.error_message = err;
				} else{
					body = JSON.parse(body);
					var msgResp;
					if(body.status !== "OK"){
						console.error("status not ok!");
						msgResp = {
							"status": body.status,
							"error_message" : body.error_message || ''
						};
						switch(body.status){
							case 'ZERO_RESULTS':
								msg.statusCode = 200;
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
						msg.error_message = body.error_message || '';
						node.warn(body.status);
						node.status({fill:"red",shape:"ring",text:"failed"});
					} else{
						console.log("status ok!");
						if(sendFullResult){
							msgResp = body;
						} else{
							if(geocodeBy === 'address'){
								msgResp = {
									"lat": body.results[0].geometry.location.lat,
									"lng": body.results[0].geometry.location.lng,
									"status": body.status
								};
							} else{
								msgResp = {
									"address": body.results[0].formatted_address,
									"status": body.status
								};
							}
							
						}
					}
					console.log(msgResp);
					msg.payload = msgResp;
					msg.data = msgResp;
					msg.status = body.status;
				}
				node.send(msg);
			});
		});
	}
	RED.nodes.registerType("geocoding",Geocode);	
};