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
	
	function Places(config) {
		RED.nodes.createNode(this,config);
        var node = this;
		var reqType = config.reqType;
		
		//Grab shared node properties
		var nodeKey = config.key;
		var nodeLanguage = config.language;
		var nodeSendFullResult = config.sendFullResult;	
		
		this.on('input', function(msg) {
			var queryParams = {};
			var key;
			
			//Check for key (required)
			if(msg.key){
				key = msg.key;
			} else if(nodeKey){
				key = nodeKey;
			} else{		//Throw error if key (required) is missing
				console.error("API Key missing!");
				delete msg.payload;
				msg.status = "MISSING_VALUES";
				msg.error_message = "Please provide your application API key.";
				msg.payload.status = "MISSING_VALUES";
				msg.payload.error_message = "Please provide your application API key.";
				msg.statusCode = 400;
				node.warn("MISSING_VALUES");
				node.status({fill:"red",shape:"ring",text:"failed"});
				node.send(msg);
				return;
			}
			console.log("key: " + key);
			queryParams.key = key;
			
			if(reqType === 'placesNearby'){
				//Grab node properties specific to placesNearby
				var nodeLng = config.lng;
				var nodeLat = config.lat;
				var nodeRadius = config.radius;
				var nodeRankBy = config.rankBy;
				var nodeKeyword = config.keyword;
				var nodeMinPrice = config.minPrice;
				var nodeMaxPrice = config.maxPrice;
				var nodeName = config.placeName;
				var nodeOpenNow = config.openNow;
				var nodeTypes = config.types;
				
				var lat, lng, radius, rankBy, keyword, language, minPrice, maxPrice, name, types;
				var sendFullResult, openNow = false;
				var url = 'https://maps.googleapis.com/maps/api/place/nearbysearch/json';
				
				//Check for latitude (required)
				if(msg.location && msg.location.lat){
					lat = msg.location.lat;
				} else if(nodeLat){
					lat = nodeLat;
				} else{		//Throw error if lat (required) is missing
					console.error("Latitude missing!");
					delete msg.payload;
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide a longitude and latitude.";
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a longitude and latitude.";
					msg.statusCode = 400;
					node.warn("MISSING_VALUES");
					node.status({fill:"red",shape:"ring",text:"failed"});
					node.send(msg);
					return;
				}
				console.log("lat: " + lat);
				
				//Check for longitude (required)
				if(msg.location && msg.location.lng){
					lng = msg.location.lng;
				} else if(nodeLng){
					lng = nodeLng;
				} else{		//Throw error if lng (required) is missing
					console.error("Longitude missing!");
					msg.payload = {};
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide a longitude and latitude.";
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a longitude and latitude.";
					msg.statusCode = 400;
					node.warn("MISSING_VALUES");
					node.status({fill:"red",shape:"ring",text:"failed"});
					node.send(msg);
					return;
				}
				console.log("lng: " + lng);
				queryParams.location = lat + ',' + lng;
				
				
				//Pull in all other parameters (if provided)
				
				//Check for Radius
				if(msg.radius){
					radius = msg.radius;
				} else if(nodeRadius){
					radius = nodeRadius;
				}
				if(radius){
					console.log("radius: " + radius);
					queryParams.radius = radius;
				}
				
				//Check for RankBy
				if(msg.rankby){
					rankBy = msg.rankby;
				} else if(nodeRankBy){
					rankBy = nodeRankBy;
				}
				if(rankBy){
					console.log("rankBy: " + rankBy);
					queryParams.rankby = rankBy;
				}
				
				
				//Check for keyword
				if(msg.keyword){
					keyword = msg.keyword;
				} else if(nodeKeyword){
					keyword = nodeKeyword;
				}
				if(keyword){
					console.log("keyword: " + keyword);
					queryParams.keyword = keyword;
				}
				
				//Check for language
				if(msg.language){
					language = msg.language;
				} else if(nodeLanguage){
					language = nodeLanguage;
				}
				if(language){
					console.log("language: " + language);
					queryParams.language = language;
				}
					
				//Check for minPrice
				if(msg.minprice){
					minPrice = msg.minprice;
				} else if(nodeMinPrice){
					minPrice = nodeMinPrice;
				}
				if(minPrice){
					console.log("minPrice: " + minPrice);
					queryParams.minprice = minPrice;
				}
					
				//Check for maxPrice
				if(msg.maxprice){
					maxPrice = msg.maxprice;
				} else if(nodeMaxPrice){
					maxPrice = nodeMaxPrice;
				}
				if(maxPrice){
					console.log("maxPrice: " + maxPrice);
					queryParams.maxprice = maxPrice;
				}
					
				//Check for name
				if(msg.name){
					name = msg.name;
				} else if(nodeName){
					name = nodeName;
				}
				if(name){
					console.log("name: " + name);	
					queryParams.name = name;
				}
				
				//Check for openNow
				if(msg.opennow){
					openNow = msg.opennow;
				} else if(nodeOpenNow){
					openNow = nodeOpenNow;
				}
				if(openNow){
					console.log("openNow: " + openNow);
					queryParams.opennow = openNow;
				}
				
				//Check for types
				if(msg.types){
					types = msg.types;
				} else if(nodeTypes){
					types = nodeTypes;
				}
				if(types){
					console.log("types: " + types);
					queryParams.types = types;
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
					
				//Check rankby to determine which other params are required
				if(rankBy && rankBy === 'distance'){		//keyword/name/types required. radius not allowed.
					if(radius){
						console.error('rankby set to distance, but radius still supplied.');
						msg.payload = {};
						msg.status = "BAD_REQUEST";
						msg.error_message = "If rankby is set to distance, then radius is not allowed in the request. Instead, you are required to provide at least one of keyword/name/types.";
						msg.payload.status = "BAD_REQUEST";
						msg.payload.error_message = "If rankby is set to distance, then radius is not allowed in the request. Instead, you are required to provide at least one of keyword/name/types.";
						msg.statusCode = 400;
						node.warn("BAD_REQUEST");
						node.status({fill:"red",shape:"ring",text:"failed"});
						node.send(msg);
						return;
					} else if(!(keyword || name || types)){
						console.error('rankby set to distance, and keyword/name/types not supplied.');
						msg.payload = {};
						msg.status = "BAD_REQUEST";
						msg.error_message = "If rankby is set to distance, you are required to provide at least one of keyword/name/types.";
						msg.payload.status = "BAD_REQUEST";
						msg.payload.error_message = "If rankby is set to distance, you are required to provide at least one of keyword/name/types.";
						msg.statusCode = 400;
						node.warn("BAD_REQUEST");
						node.status({fill:"red",shape:"ring",text:"failed"});
						node.send(msg);
						return;
					}
				} else if((rankBy && rankBy === 'prominence') || (!rankBy)){	//radius required
					if(!radius || radius > 50000){
						console.error('rankby not set or set to prominence, but radius not supplied.');
						msg.payload = {};
						msg.status = "MISSING_VALUES";
						msg.error_message = "You must provide a value for radius (in meters) less than 50,000.";
						msg.payload.status = "MISSING_VALUES";
						msg.payload.error_message = "You must provide a value for radius (in meters) less than 50,000.";
						msg.statusCode = 400;
						node.warn("MISSING_VALUES");
						node.status({fill:"red",shape:"ring",text:"failed"});
						node.send(msg);
						return;
					}
				} else{		//some other value was provided for rankBy, which is not allowed
					console.error('Value other than \'prominence\' or \'distance\' provided for rankby.');
					msg.payload = {};
					msg.status = "BAD_REQUEST";
					msg.error_message = "The allowed options for rankby are 'prominence'(default) and 'distance'";
					msg.payload.status = "BAD_REQUEST";
					msg.payload.error_message = "The allowed options for rankby are 'prominence'(default) and 'distance'";
					msg.statusCode = 400;
					node.warn("BAD_REQUEST");
					node.status({fill:"red",shape:"ring",text:"failed"});
					node.send(msg);
					return;
				}
					
				console.log("URL: " + url);
				console.log(queryParams);
				
				//clear payload
				delete msg.payload;
				
				//Send request to Google
				request.get({
					url: url,
					qs: queryParams,
					method: "GET"
				}, function(err, resp, body){
					if(err){
						console.error(err);
						msg.statusCode = 500;
						msg.payload.status = err.code;
						msg.payload.error_message = err;
						node.warn(err);
						node.status({fill:"red",shape:"ring",text:"failed"});
					} else{
						body = JSON.parse(body);
						var msgResp;
						if(body.status !== "OK"){
							console.log("status not ok!");
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
								var results = [];
								for(var i=0; i < body.results.length; i++){
									results[i] = {
										'placeid':  body.results[i].place_id,
										'name': body.results[i].name,
										'vicinity': body.results[i].vicinity,
										'types': body.results[i].types,
										'pricelevel': body.results[i].price_level,
										'rating': body.results[i].rating
									};
									if(body.results[i].opening_hours && body.results[i].opening_hours.hasOwnProperty('open_now')){
										results[i].opennow = body.results[i].opening_hours.open_now;
									}
								}
								msgResp = {
									'results': results,
									'status': body.status
								};
							}
						}
						console.log(msgResp);
						msg.payload = msgResp;
						msg.data = msgResp;
						msg.status = body.status;
					}
					node.send(msg);
				});
			} else if(reqType === 'placesDetails'){
				//Grab node properties specific to placesDetails
				var nodePlaceId = config.placeId;
				var nodeExtensions = config.extensions;
				var placeId, key, extensions, language;
				var sendFullResult = false;
				var url = 'https://maps.googleapis.com/maps/api/place/details/json';
					
				//Check for placeId (required)
				if(msg.placeid){
					placeId = msg.placeid;
				} else if(nodePlaceId){
					placeId = nodePlaceId;
				} else{		//Throw error if placeId (required) is missing
					console.error("placeId missing!");
					msg.payload = {};
					msg.status = "MISSING_VALUES";
					msg.error_message = "Please provide a placeid."
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a placeid."
					msg.statusCode = 400;
					node.warn("MISSING_VALUES");
					node.status({fill:"red",shape:"ring",text:"failed"});
					node.send(msg);
					return;
				}
				console.log("placeId: " + placeId);
				queryParams.placeid = placeId;
				
				//Pull in all other parameters (if provided)
				
				//Check for Extensions
				if(msg.extensions){
					extensions = msg.extensions;
				} else if(nodeExtensions){
					extensions = nodeExtensions;
				}
				if(extensions){
					console.log("extensions: " + extensions);
					queryParams.extensions = extensions;
				}
				
				//Check for language
				if(msg.language){
					language = msg.language;
				} else if(nodeLanguage){
					language = nodeLanguage;
				}
				if(language){
					console.log("language: " + language);
					queryParams.language = language;
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
				
				//Send request to Google
				request.get({
					url: url,
					qs: queryParams,
					method: "GET"
				}, function(err, resp, body){
					console.log("Status: " + body.status);
					if(err){
						console.error(err);
						msg.statusCode = 500;
						msg.status = err.code;
						msg.error_message = err;
						msg.payload.status = err.code;
						msg.payload.error_message = err;
						node.warn(err);
						node.status({fill:"red",shape:"ring",text:"failed"});
					} else{
						body = JSON.parse(body);
						var msgResp;
						if(body.status !== "OK"){
							console.log("status not ok!");
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
								//ToDo: set msgResp
								msgResp = {
									"name": body.result.name,
									"address": body.result.formatted_address,
									"phone": body.result.formatted_phone_number,
									"website": body.result.website || body.result.url,
									"status": body.status
								};
								if(body.result.rating){
									msgResp.rating = body.result.rating;
								}
								if(body.result.price_level){
									msgResp.pricelevel = body.result.price_level;
								}
								if(body.result.opening_hours && body.result.opening_hours.hasOwnProperty('open_now')){
									msgResp.opennow = body.result.opening_hours.open_now;
								}
								if(body.result.opening_hours && body.result.opening_hours.hasOwnProperty('open')){
									msgResp.open = body.result.opening_hours.open;
								}
								if(body.result.opening_hours && body.result.opening_hours.hasOwnProperty('close')){
									msgResp.opennow = body.result.opening_hours.close;
								}
								if(body.result.permanently_closed){
									msgResp.permanently_closed = body.result.permanently_closed;
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
			} else if(reqType === 'placesText'){
				//Grab node properties specific to placesText search
				var nodeQuery = config.query;
				var nodeLng = config.lng;
				var nodeLat = config.lat;
				var nodeRadius = config.radius;
				var nodeMinPrice = config.minPrice;
				var nodeMaxPrice = config.maxPrice;
				var nodeOpenNow = config.openNow;
				var nodeTypes = config.types;
				
				var query, lng, lat, radius, minPrice, maxPrice, types;
				var openNow = false;
				var url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
				
				//Check for query (required)
				if(msg.query){
					query = msg.query;
				} else if(nodeQuery){
					query = nodeQuery;
				} else{		//Throw error if query (required) is missing
					console.error("Query missing!");
					msg.payload = {};
					msg.payload.status = "MISSING_VALUES";
					msg.payload.error_message = "Please provide a query for the places text search."
					msg.statusCode = 400;
					node.warn("MISSING_VALUES");
					node.status({fill:"red",shape:"ring",text:"failed"});
					node.send(msg);
					return;
				}
				console.log("query: " + query);
				queryParams.query = query;
				
				//Pull in all other parameters (if provided)
				
				//Check for Latitude and Longitude
				if(msg.location && msg.location.lat && msg.location.lng){
					lat = msg.location.lat;
					lng = msg.location.lng;
				} else if(nodeLat && nodeLng){
					lat = nodeLat;
					lng = nodeLng;
				}
				if(lat && lng){
					console.log("lat: " + lat);
					console.log("lng: " + lng);
					queryParams.location = lat + ',' + lng;
				}
				
				
				//Check for Radius
				if(msg.radius){
					radius = msg.radius;
				} else if(nodeRadius){
					radius = nodeRadius;
				}
				if(radius){
					console.log("radius: " + radius);
					queryParams.radius = radius;
				}
				
				//Check for language
				if(msg.language){
					language = msg.language;
				} else if(nodeLanguage){
					language = nodeLanguage;
				}
				if(language){
					console.log("language: " + language);
					queryParams.language = language;
				}
				
				//Check for minPrice
				if(msg.minprice){
					minPrice = msg.minprice;
				} else if(nodeMinPrice){
					minPrice = nodeMinPrice;
				}
				if(minPrice){
					console.log("minPrice: " + minPrice);
					queryParams.minprice = minPrice;
				}
					
				//Check for maxPrice
				if(msg.maxprice){
					maxPrice = msg.maxprice;
				} else if(nodeMaxPrice){
					maxPrice = nodeMaxPrice;
				}
				if(maxPrice){
					console.log("maxPrice: " + maxPrice);
					queryParams.maxprice = maxPrice;
				}
				
				//Check for openNow
				if(msg.opennow){
					openNow = msg.opennow;
				} else if(nodeOpenNow){
					openNow = nodeOpenNow;
				}
				if(openNow){
					console.log("openNow: " + openNow);
					queryParams.opennow = openNow;
				}
				
				//Check for types
				if(msg.types){
					types = msg.types;
				} else if(nodeTypes){
					types = nodeTypes;
				}
				if(types){
					console.log("types: " + types);
					queryParams.types = types;
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
				
				//Clear payload
				delete msg.payload;
				
				//Send request to Google
				request.get({
					url: url,
					qs: queryParams,
					method: "GET"
				}, function(err, resp, body){
					if(err){
						console.error(err);
						msg.statusCode = 500;
						msg.status = err.code;
						msg.error_message = err;
						msg.payload.status = err.code;
						msg.payload.error_message = err;
						node.warn(err);
					node.status({fill:"red",shape:"ring",text:"failed"});
					} else{
						body = JSON.parse(body);
						var msgResp;
						if(body.status !== "OK"){
							console.log("status not ok!");
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
								var results = [];
								for(var i=0; i < body.results.length; i++){
									results[i] = {
										'placeid':  body.results[i].place_id,
										'name': body.results[i].name,
										'address': body.results[i].formatted_address,
										'types': body.results[i].types,
										'pricelevel': body.results[i].price_level,
										'rating': body.results[i].rating
									};
									if(body.results[i].opening_hours && body.results[i].opening_hours.hasOwnProperty('open_now')){
										results[i].opennow = body.results[i].opening_hours.open_now;
									}
								}
								msgResp = {
									'results': results,
									'status': body.status
								};
							}
						}
						console.log(msgResp);
						msg.payload = msgResp;
						msg.data = msgResp;
						msg.status = body.status;
					}
					node.send(msg);
				});	
			} else{
				msg.payload = {};
				msg.statusCode = 400;
				msg.status = "BAD_REQUEST";
				msg.error_message = "You did not send the required parameters to complete a 'Places Nearby', 'Places Text', or 'Place Details' request";
				msgResp = {
					"status": "BAD_REQUEST",
					"error_message": "You did not send the required parameters to complete a 'Places Nearby', 'Places Text', or 'Place Details' request"
				};
				console.log(msgResp);
				msg.payload = msgResp;
				node.warn("BAD_REQUEST");
				node.status({fill:"red",shape:"ring",text:"failed"});
				node.send(msg);
			}
		});
	}
	RED.nodes.registerType("places", Places);	
}