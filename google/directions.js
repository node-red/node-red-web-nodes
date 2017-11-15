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
    var clone = require('clone');

    function GoogleDirectionsNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        this.googleAPI = RED.nodes.getNode(n.googleAPI);

        this.on('input', function(msg) {
            var url, queryParams, key, origin, destination, mode, waypoints, alternatives, avoid, language, units, region, departure_time, arrival_time, transit_mode, transit_routing_preferences;

            if (this.googleAPI && this.googleAPI.credentials && this.googleAPI.credentials.key) {
                key = this.googleAPI.credentials.key;
            } else if (msg.key) {
                key = msg.key;
            }

            origin = n.origin || msg.origin;
            destination = n.destination || msg.destination;
            mode = n.mode || msg.mode;
            waypoints = n.waypoints || msg.waypoints;
            alternatives = n.alternatives || msg.alternatives;
            avoid = n.avoid || msg.avoid;
            language = n.language || msg.language;
            units = n.units || msg.units;
            region = n.region || msg.region;
            departure_time = n.departure_time || msg.departure_time;
            arrival_time = n.arrival_time || msg.arrival_time;
            transit_mode = n.transit_mode || msg.transit_mode;
            transit_routing_preferences = n.transit_routing_preferences || msg.transit_routing_preferences;

            function processInput() {
                queryParams = {};

                if (key) {
                    queryParams.key = key;
                }

                directionsRequest(function(response) {
                    if (response) {
                        node.send(response);
                    }
                });
            }

            function directionsRequest(cb) {
                url = 'https://maps.googleapis.com/maps/api/directions/json';
                if (!origin) {
                    throwNodeError({
                        code: 400,
                        message: RED._("directions.error.no-origin"),
                        status: 'MISSING_VALUES'
                    }, msg);
                    return;
                }
                if (!destination) {
                    throwNodeError({
                        code: 400,
                        message: RED._("directions.error.no-destination"),
                        status: 'MISSING_VALUES'
                    }, msg);
                    return;
                }
                queryParams.origin = origin;
                queryParams.destination = destination;
                if (mode) {
                    queryParams.mode = mode;
                }
                if (waypoints) {
                    queryParams.waypoints = waypoints;
                }
                if (alternatives) {
                    queryParams.alternatives = alternatives;
                }
                if (avoid) {
                    queryParams.avoid = avoid;
                }
                if (language) {
                    queryParams.language = language;
                }
                if (units) {
                    queryParams.units = units;
                }
                if (region) {
                    queryParams.region = region;
                }
                if (departure_time) {
                    queryParams.departure_time = departure_time;
                }
                if (arrival_time) {
                    queryParams.arrival_time = arrival_time;
                }
                if (transit_mode) {
                    queryParams.transit_mode = transit_mode;
                }
                if (transit_routing_preferences) {
                    queryParams.transit_routing_preferences = transit_routing_preferences;
                }
                // console.log(queryParams);
                sendReqToGoogle(function(err, data) {
                    if (err) {
                        // console.log(err);
                        throwNodeError(err, msg);
                        return;
                    } else {
                        handleDirectionsResponse(JSON.parse(data), function(msg) {
                            cb(msg);
                        });
                    }
                });
            }

            function handleDirectionsResponse(data, cb) {
                var newMsg;
                if (data.status == 'OK') {
                    newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.payload = {
                        routes: [],
                        status: data.status
                    };
                    for (var i = 0; i < data.routes.length; i++) {
                        newMsg.payload.routes.push(parseRoute(data.routes[i]));
                    }
                    newMsg.status = data.status;
                    newMsg.title = RED._("directions.message.travel-directions") + ' ' + newMsg.payload.routes[0].summary;
                    newMsg.description = 'Travel directions via ' + newMsg.payload.routes[0].summary;
                    newMsg.distance = newMsg.payload.routes[0].legs[0].distance.value;
                    newMsg.duration = newMsg.payload.routes[0].legs[0].duration.value;
                    newMsg.location = {
                        start: {
                            address: newMsg.payload.routes[0].legs[0].start_location.address,
                            lat: newMsg.payload.routes[0].legs[0].start_location.lat,
                            lon: newMsg.payload.routes[0].legs[0].start_location.lon
                        },
                        end: {
                            address: newMsg.payload.routes[0].legs[0].end_location.address,
                            lat: newMsg.payload.routes[0].legs[0].end_location.lat,
                            lon: newMsg.payload.routes[0].legs[0].end_location.lon
                        }
                    };
                    cb(newMsg);
                } else if (data.status == 'ZERO_RESULTS') {
                    newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.payload = {
                        status: 'ZERO_RESULTS'
                    };
                    newMsg.title = 'ZERO_RESULTS';
                    newMsg.description = 'ZERO_RESULTS';
                    cb(newMsg);
                } else {
                    var error = {};
                    error.status = data.status;
                    switch(data.status) {
                        case 'NOT_FOUND':
                            error.code = 400;
                            error.message = RED._("directions.error.no-waypoint");
                            break;
                        case 'MAX_WAYPOINTS_EXCEEDED':
                            error.code = 400;
                            error.message = RED._("directions.error.too-many-waypoints");
                            break;
                        case 'INVALID_REQUEST':
                            error.code = 400;
                            error.message = RED._("directions.error.invalid-request");
                            break;
                        case 'OVER_QUERY_REQUEST':
                            error.code = 429;
                            error.message = RED._("directions.error.too-many-requests");
                            break;
                        case 'REQUEST_DENIED':
                            error.code = 400;
                            error.message = RED._("directions.error.request-denied");
                            break;
                        case 'UNKNOWN_ERROR':
							error.code = 500;
                            error.message = RED._("directions.error.unknown-error");
							break;
                        default:
                            error.code = 500;
                            error.message = RED._("directions.error.unknown-error");
                    }
                    throwNodeError({
                        code: 400,
                        message: RED._("directions.error.no-destination"),
                        status: 'MISSING_VALUES'
                    }, msg);
                    return;
                }
            }

            function sendReqToGoogle(cb) {
                request.get({
                    url: url,
                    qs: queryParams,
                    method: "GET"
                }, function(err, resp, body) {
                    cb(err, body);
                });
            }

            function parseRoute(route) {
                var parsedRoute = {};
                parsedRoute.copyrights = route.copyrights;
                parsedRoute.summary = route.summary;
                parsedRoute.bounds = {
                    northeast: {
                        lat: route.bounds.northeast.lat,
                        lon: route.bounds.northeast.lng
                    },
                    southwest: {
                        lat: route.bounds.southwest.lat,
                        lon: route.bounds.southwest.lng
                    }
                };
                if (route.warnings.length > 0) {
                    parsedRoute.warnings = route.warnings;
                }
                if (route.waypoint_order.length > 0) {
                    parsedRoute.waypoint_order = route.waypoint_order;
                }
                parsedRoute.fare = route.fare;
                parsedRoute.legs = [];
                for (var i = 0; i < route.legs.length; i++) {
                    parsedRoute.legs.push(parseLeg(route.legs[i]));
                }
                return parsedRoute;
            }

            function parseLeg(leg) {
                var parsedLeg = {};
                parsedLeg.distance = leg.distance;
                parsedLeg.duration = leg.duration;
                parsedLeg.duration_in_traffic = leg.duration_in_traffic;
                parsedLeg.departure_time = leg.departure_time;
                parsedLeg.arrival_time = leg.arrival_time;
                parsedLeg.start_location = {
                    address: leg.start_address,
                    lat: leg.start_location.lat,
                    lon: leg.start_location.lng
                };
                parsedLeg.end_location = {
                    address: leg.end_address,
                    lat: leg.end_location.lat,
                    lon: leg.end_location.lng
                };
                parsedLeg.steps = [];
                for (var i = 0; i < leg.steps.length; i++) {
                    parsedLeg.steps.push(parseStep(leg.steps[i]));
                }
                return parsedLeg;
            }

            function parseStep(step) {
                var parsedStep = {};
                parsedStep.distance = step.distance;
                parsedStep.duration = step.duration;
                parsedStep.start_location = {
                    lat: step.start_location.lat,
                    lon: step.start_location.lng
                };
                parsedStep.end_location = {
                    lat: step.end_location.lat,
                    lon: step.end_location.lng
                };
                parsedStep.html_instructions = step.html_instructions;
                parsedStep.maneuver = step.maneuver;
                parsedStep.travel_mode = step.travel_mode;
                if (parsedStep.travel_mode == 'transit') {
                    parsedStep.transit_details = step.transit_details;
                }
                return parsedStep;
            }
            processInput();
        });

        function throwNodeError(err, msg) {
            node.status({fill:"red",shape:"ring",text:"directions.status.failed"});
            msg.error = err;
            node.error(err, msg);
            return;
        }
    }
    RED.nodes.registerType("google directions",GoogleDirectionsNode);

    function cloneMsg(msg) {
        var req = msg.req;
        var res = msg.res;
        delete msg.req;
        delete msg.res;
        var m = clone(msg);
        if (req) {
            m.req = req;
            msg.req = req;
        }
        if (res) {
            m.res = res;
            msg.res = res;
        }
        return m;
    }
};
