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

var should = require("should");
var sinon = require("sinon");
var url = require('url');
var googleNode = require("../../google/google.js");
var directionsNode = require("../../google/directions.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('google directions', function () {

    before(function (done) {
        helper.startServer(done);
    });

    afterEach(function () {
        helper.unload();
    });

    it('can be loaded without credentials', function (done) {
        helper.load(directionsNode, [{
                id: "directions",
                type: "google directions"
    }
   ], function () {
            var n = helper.getNode("directions");
            n.should.have.property('id', 'directions');
            done();
        });
    });

    if (!nock)
        return;

    it("should succeed with all properties returned", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Toronto&destination=Montreal')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 45.5017123,
                                    "lng": -73.5672184
                                },
                                "southwest": {
                                    "lat": 43.6533103,
                                    "lng": -79.3827675
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "541 km",
                                        "value": 540536
                                    },
                                    "duration": {
                                        "text": "5 hours 20 mins",
                                        "value": 19191
                                    },
                                    "end_address": "Montreal, QC, Canada",
                                    "end_location": {
                                        "lat": 45.5017123,
                                        "lng": -73.5672184
                                    },
                                    "start_address": "Toronto, ON, Canada",
                                    "start_location": {
                                        "lat": 43.6533103,
                                        "lng": -79.3827675
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.3 km",
                                                "value": 280
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 34
                                            },
                                            "end_location": {
                                                "lat": 43.6557259,
                                                "lng": -79.38373319999999
                                            },
                                            "html_instructions": "Head \u003cb\u003enorth\u003c/b\u003e on \u003cb\u003eBay St\u003c/b\u003e toward \u003cb\u003eHagerman St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6533103,
                                                "lng": -79.3827675
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "2.5 km",
                                                "value": 2492
                                            },
                                            "duration": {
                                                "text": "5 mins",
                                                "value": 320
                                            },
                                            "end_location": {
                                                "lat": 43.6618361,
                                                "lng": -79.3545312
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eDundas St W\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6557259,
                                                "lng": -79.38373319999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 209
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 18
                                            },
                                            "end_location": {
                                                "lat": 43.6635765,
                                                "lng": -79.3554817
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto the \u003cb\u003eDon Valley Parkway\u003c/b\u003e ramp",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6618361,
                                                "lng": -79.3545312
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "12.9 km",
                                                "value": 12906
                                            },
                                            "duration": {
                                                "text": "10 mins",
                                                "value": 570
                                            },
                                            "end_location": {
                                                "lat": 43.76282690000001,
                                                "lng": -79.33669359999999
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eDon Valley Pkwy N\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6635765,
                                                "lng": -79.3554817
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "1.1 km",
                                                "value": 1070
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 53
                                            },
                                            "end_location": {
                                                "lat": 43.768037,
                                                "lng": -79.32926310000001
                                            },
                                            "html_instructions": "Take the \u003cb\u003eON-401 E\u003c/b\u003e exit",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.76282690000001,
                                                "lng": -79.33669359999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "23.0 km",
                                                "value": 22985
                                            },
                                            "duration": {
                                                "text": "13 mins",
                                                "value": 757
                                            },
                                            "end_location": {
                                                "lat": 43.83811679999999,
                                                "lng": -79.07197540000001
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eOntario 401 Express\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.768037,
                                                "lng": -79.32926310000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "428 km",
                                                "value": 427628
                                            },
                                            "duration": {
                                                "text": "4 hours 0 mins",
                                                "value": 14372
                                            },
                                            "end_location": {
                                                "lat": 45.2083667,
                                                "lng": -74.3482841
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eON-401 E\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.83811679999999,
                                                "lng": -79.07197540000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "67.3 km",
                                                "value": 67286
                                            },
                                            "duration": {
                                                "text": "45 mins",
                                                "value": 2677
                                            },
                                            "end_location": {
                                                "lat": 45.4623177,
                                                "lng": -73.6095157
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eAutoroute du Souvenir/Autoroute 20\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Quebec\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.2083667,
                                                "lng": -74.3482841
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "3.4 km",
                                                "value": 3359
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 158
                                            },
                                            "end_location": {
                                                "lat": 45.4851306,
                                                "lng": -73.58310320000001
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e to continue on \u003cb\u003eAutoroute 720 E\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4623177,
                                                "lng": -73.6095157
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "0.9 km",
                                                "value": 882
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 63
                                            },
                                            "end_location": {
                                                "lat": 45.4911521,
                                                "lng": -73.57746179999999
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e3\u003c/b\u003e for \u003cb\u003eRue Guy\u003c/b\u003e toward \u003cb\u003eMontréal/Centre-Ville\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4851306,
                                                "lng": -73.58310320000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "1.4 km",
                                                "value": 1424
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 161
                                            },
                                            "end_location": {
                                                "lat": 45.5018118,
                                                "lng": -73.56734449999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRené-Lévesque Blvd W\u003c/b\u003e (signs for \u003cb\u003eRue city/Montréal/Centre Ville\u003c/b\u003e)",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4911521,
                                                "lng": -73.57746179999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "15 m",
                                                "value": 15
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 45.5017123,
                                                "lng": -73.5672184
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eBoulevard Robert-Bourassa\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eDestination will be on the right\u003c/div\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.5018118,
                                                "lng": -73.56734449999999
                                            },
                                            "travel_mode": "DRIVING"
         }
         ],
                                    "via_waypoint": []
      }
      ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "ON-401 E",
                            "warnings": [],
                            "waypoint_order": []
      }
      ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].should.have.property('copyrights');
                msg.payload.routes[0].should.have.property('summary');
                msg.payload.routes[0].should.have.property('bounds');
                msg.payload.routes[0].bounds.should.have.property('northeast');
                msg.payload.routes[0].bounds.northeast.should.have.property('lat');
                msg.payload.routes[0].bounds.northeast.should.have.property('lon');
                msg.payload.routes[0].bounds.should.have.property('southwest');
                msg.payload.routes[0].bounds.southwest.should.have.property('lat');
                msg.payload.routes[0].bounds.southwest.should.have.property('lon');
                msg.payload.routes[0].should.have.property('legs');
                msg.payload.routes[0].legs.length.should.equal(1);
                msg.payload.routes[0].legs[0].should.have.property('distance');
                msg.payload.routes[0].legs[0].distance.should.have.property('value');
                msg.payload.routes[0].legs[0].distance.should.have.property('text');
                msg.payload.routes[0].legs[0].should.have.property('duration');
                msg.payload.routes[0].legs[0].duration.should.have.property('value');
                msg.payload.routes[0].legs[0].duration.should.have.property('text');
                msg.payload.routes[0].legs[0].should.have.property('start_location');
                msg.payload.routes[0].legs[0].start_location.should.have.property('address');
                msg.payload.routes[0].legs[0].start_location.should.have.property('lat');
                msg.payload.routes[0].legs[0].start_location.should.have.property('lon');
                msg.payload.routes[0].legs[0].should.have.property('end_location');
                msg.payload.routes[0].legs[0].end_location.should.have.property('address');
                msg.payload.routes[0].legs[0].end_location.should.have.property('lat');
                msg.payload.routes[0].legs[0].end_location.should.have.property('lon');
                msg.payload.routes[0].legs[0].should.have.property('steps');
                msg.payload.routes[0].legs[0].steps.length.should.be.above(0);
                msg.payload.routes[0].legs[0].steps[0].should.have.property('distance');
                msg.payload.routes[0].legs[0].steps[0].distance.should.have.property('value');
                msg.payload.routes[0].legs[0].steps[0].distance.should.have.property('text');
                msg.payload.routes[0].legs[0].steps[0].should.have.property('duration');
                msg.payload.routes[0].legs[0].steps[0].duration.should.have.property('value');
                msg.payload.routes[0].legs[0].steps[0].duration.should.have.property('text');
                msg.payload.routes[0].legs[0].steps[0].should.have.property('start_location');
                msg.payload.routes[0].legs[0].steps[0].start_location.should.have.property('lat');
                msg.payload.routes[0].legs[0].steps[0].start_location.should.have.property('lon');
                msg.payload.routes[0].legs[0].steps[0].should.have.property('end_location');
                msg.payload.routes[0].legs[0].steps[0].end_location.should.have.property('lat');
                msg.payload.routes[0].legs[0].steps[0].end_location.should.have.property('lon');
                msg.payload.routes[0].legs[0].steps[0].should.have.property('html_instructions');
                msg.payload.routes[0].legs[0].steps[0].should.have.property('travel_mode');
                done();
            });
            input.send({
                origin: 'Toronto',
                destination: 'Montreal',
                key: 'KEY'
            });
        });
    });

    it("should succeed without a key", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?origin=Toronto&destination=Montreal')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 45.5017123,
                                    "lng": -73.5672184
                                },
                                "southwest": {
                                    "lat": 43.6533103,
                                    "lng": -79.3827675
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "541 km",
                                        "value": 540536
                                    },
                                    "duration": {
                                        "text": "5 hours 20 mins",
                                        "value": 19191
                                    },
                                    "end_address": "Montreal, QC, Canada",
                                    "end_location": {
                                        "lat": 45.5017123,
                                        "lng": -73.5672184
                                    },
                                    "start_address": "Toronto, ON, Canada",
                                    "start_location": {
                                        "lat": 43.6533103,
                                        "lng": -79.3827675
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.3 km",
                                                "value": 280
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 34
                                            },
                                            "end_location": {
                                                "lat": 43.6557259,
                                                "lng": -79.38373319999999
                                            },
                                            "html_instructions": "Head \u003cb\u003enorth\u003c/b\u003e on \u003cb\u003eBay St\u003c/b\u003e toward \u003cb\u003eHagerman St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6533103,
                                                "lng": -79.3827675
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "2.5 km",
                                                "value": 2492
                                            },
                                            "duration": {
                                                "text": "5 mins",
                                                "value": 320
                                            },
                                            "end_location": {
                                                "lat": 43.6618361,
                                                "lng": -79.3545312
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eDundas St W\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6557259,
                                                "lng": -79.38373319999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 209
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 18
                                            },
                                            "end_location": {
                                                "lat": 43.6635765,
                                                "lng": -79.3554817
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto the \u003cb\u003eDon Valley Parkway\u003c/b\u003e ramp",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6618361,
                                                "lng": -79.3545312
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "12.9 km",
                                                "value": 12906
                                            },
                                            "duration": {
                                                "text": "10 mins",
                                                "value": 570
                                            },
                                            "end_location": {
                                                "lat": 43.76282690000001,
                                                "lng": -79.33669359999999
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eDon Valley Pkwy N\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.6635765,
                                                "lng": -79.3554817
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "1.1 km",
                                                "value": 1070
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 53
                                            },
                                            "end_location": {
                                                "lat": 43.768037,
                                                "lng": -79.32926310000001
                                            },
                                            "html_instructions": "Take the \u003cb\u003eON-401 E\u003c/b\u003e exit",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.76282690000001,
                                                "lng": -79.33669359999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "23.0 km",
                                                "value": 22985
                                            },
                                            "duration": {
                                                "text": "13 mins",
                                                "value": 757
                                            },
                                            "end_location": {
                                                "lat": 43.83811679999999,
                                                "lng": -79.07197540000001
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eOntario 401 Express\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.768037,
                                                "lng": -79.32926310000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "428 km",
                                                "value": 427628
                                            },
                                            "duration": {
                                                "text": "4 hours 0 mins",
                                                "value": 14372
                                            },
                                            "end_location": {
                                                "lat": 45.2083667,
                                                "lng": -74.3482841
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eON-401 E\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 43.83811679999999,
                                                "lng": -79.07197540000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "67.3 km",
                                                "value": 67286
                                            },
                                            "duration": {
                                                "text": "45 mins",
                                                "value": 2677
                                            },
                                            "end_location": {
                                                "lat": 45.4623177,
                                                "lng": -73.6095157
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eAutoroute du Souvenir/Autoroute 20\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Quebec\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.2083667,
                                                "lng": -74.3482841
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "3.4 km",
                                                "value": 3359
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 158
                                            },
                                            "end_location": {
                                                "lat": 45.4851306,
                                                "lng": -73.58310320000001
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e to continue on \u003cb\u003eAutoroute 720 E\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4623177,
                                                "lng": -73.6095157
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "0.9 km",
                                                "value": 882
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 63
                                            },
                                            "end_location": {
                                                "lat": 45.4911521,
                                                "lng": -73.57746179999999
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e3\u003c/b\u003e for \u003cb\u003eRue Guy\u003c/b\u003e toward \u003cb\u003eMontréal/Centre-Ville\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4851306,
                                                "lng": -73.58310320000001
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "1.4 km",
                                                "value": 1424
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 161
                                            },
                                            "end_location": {
                                                "lat": 45.5018118,
                                                "lng": -73.56734449999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRené-Lévesque Blvd W\u003c/b\u003e (signs for \u003cb\u003eRue city/Montréal/Centre Ville\u003c/b\u003e)",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.4911521,
                                                "lng": -73.57746179999999
                                            },
                                            "travel_mode": "DRIVING"
         },
                                        {
                                            "distance": {
                                                "text": "15 m",
                                                "value": 15
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 45.5017123,
                                                "lng": -73.5672184
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eBoulevard Robert-Bourassa\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eDestination will be on the right\u003c/div\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 45.5018118,
                                                "lng": -73.56734449999999
                                            },
                                            "travel_mode": "DRIVING"
         }
         ],
                                    "via_waypoint": []
      }
      ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "ON-401 E",
                            "warnings": [],
                            "waypoint_order": []
      }
      ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                done();
            });
            input.send({
                origin: 'Toronto',
                destination: 'Montreal'
            });
        });
    });

    it("should filter route by transit mode", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Alexandria%2C%20VA&mode=bicycling')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 38.9079272,
                                    "lng": -77.03271699999999
                                },
                                "southwest": {
                                    "lat": 38.8033974,
                                    "lng": -77.0489374
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "8.9 mi",
                                        "value": 14273
                                    },
                                    "duration": {
                                        "text": "49 mins",
                                        "value": 2932
                                    },
                                    "end_address": "Alexandria, VA, USA",
                                    "end_location": {
                                        "lat": 38.804842,
                                        "lng": -77.0469806
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "299 ft",
                                                "value": 91
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 17
                                            },
                                            "end_location": {
                                                "lat": 38.9072841,
                                                "lng": -77.03610750000001
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "148 ft",
                                                "value": 45
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 38.9075291,
                                                "lng": -77.0357143
                                            },
                                            "html_instructions": "Exit the traffic circle",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9072841,
                                                "lng": -77.03610750000001
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "358 ft",
                                                "value": 109
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.9079272,
                                                "lng": -77.03455989999999
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9075291,
                                                "lng": -77.0357143
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 734
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 195
                                            },
                                            "end_location": {
                                                "lat": 38.9013274,
                                                "lng": -77.0345981
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003e15th St NW\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9079272,
                                                "lng": -77.03455989999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "440 ft",
                                                "value": 134
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 47
                                            },
                                            "end_location": {
                                                "lat": 38.90021429999999,
                                                "lng": -77.03513700000001
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eVermont Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9013274,
                                                "lng": -77.0345981
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 165
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 53
                                            },
                                            "end_location": {
                                                "lat": 38.8987352,
                                                "lng": -77.0350902
                                            },
                                            "html_instructions": "Slight \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eMadison Pl NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eRestricted usage road\u003c/div\u003e",
                                            "maneuver": "turn-slight-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.90021429999999,
                                                "lng": -77.03513700000001
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "413 ft",
                                                "value": 126
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 20
                                            },
                                            "end_location": {
                                                "lat": 38.8987612,
                                                "lng": -77.0336375
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003ePennsylvania Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8987352,
                                                "lng": -77.0350902
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 759
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 169
                                            },
                                            "end_location": {
                                                "lat": 38.8919332,
                                                "lng": -77.03364569999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003e15th St NW\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8987612,
                                                "lng": -77.0336375
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "89 ft",
                                                "value": 27
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.8918922,
                                                "lng": -77.033948
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8919332,
                                                "lng": -77.03364569999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 227
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 46
                                            },
                                            "end_location": {
                                                "lat": 38.8900122,
                                                "lng": -77.03311239999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8918922,
                                                "lng": -77.033948
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "75 ft",
                                                "value": 23
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.89008880000001,
                                                "lng": -77.0328612
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8900122,
                                                "lng": -77.03311239999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 272
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 55
                                            },
                                            "end_location": {
                                                "lat": 38.8879388,
                                                "lng": -77.03365980000001
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.89008880000001,
                                                "lng": -77.0328612
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "52 ft",
                                                "value": 16
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 2
                                            },
                                            "end_location": {
                                                "lat": 38.8878974,
                                                "lng": -77.0337926
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e at \u003cb\u003eRaoul Wallenberg Pl SW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8879388,
                                                "lng": -77.03365980000001
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 350
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 77
                                            },
                                            "end_location": {
                                                "lat": 38.8847821,
                                                "lng": -77.0338462
                                            },
                                            "html_instructions": "Slight \u003cb\u003eleft\u003c/b\u003e",
                                            "maneuver": "turn-slight-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8878974,
                                                "lng": -77.0337926
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "417 ft",
                                                "value": 127
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 49
                                            },
                                            "end_location": {
                                                "lat": 38.8838731,
                                                "lng": -77.0331922
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8847821,
                                                "lng": -77.0338462
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 501
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 111
                                            },
                                            "end_location": {
                                                "lat": 38.8799921,
                                                "lng": -77.0353059
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e at \u003cb\u003eOhio Dr SW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8838731,
                                                "lng": -77.0331922
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 153
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 28
                                            },
                                            "end_location": {
                                                "lat": 38.8798729,
                                                "lng": -77.0370494
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eE Basin Dr SW\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8799921,
                                                "lng": -77.0353059
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.6 mi",
                                                "value": 1038
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 197
                                            },
                                            "end_location": {
                                                "lat": 38.87464370000001,
                                                "lng": -77.0454924
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Virginia\u003c/div\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8798729,
                                                "lng": -77.0370494
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.3 mi",
                                                "value": 2139
                                            },
                                            "duration": {
                                                "text": "6 mins",
                                                "value": 379
                                            },
                                            "end_location": {
                                                "lat": 38.8607933,
                                                "lng": -77.0452198
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eMt Vernon Trail\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.87464370000001,
                                                "lng": -77.0454924
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 502
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 163
                                            },
                                            "end_location": {
                                                "lat": 38.8565309,
                                                "lng": -77.04660819999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e to stay on \u003cb\u003eMt Vernon Trail\u003c/b\u003e",
                                            "maneuver": "keep-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8607933,
                                                "lng": -77.0452198
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.1 mi",
                                                "value": 1698
                                            },
                                            "duration": {
                                                "text": "5 mins",
                                                "value": 320
                                            },
                                            "end_location": {
                                                "lat": 38.8418337,
                                                "lng": -77.0480202
                                            },
                                            "html_instructions": "Slight \u003cb\u003eleft\u003c/b\u003e to stay on \u003cb\u003eMt Vernon Trail\u003c/b\u003e",
                                            "maneuver": "turn-slight-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8565309,
                                                "lng": -77.04660819999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.5 mi",
                                                "value": 2408
                                            },
                                            "duration": {
                                                "text": "8 mins",
                                                "value": 498
                                            },
                                            "end_location": {
                                                "lat": 38.8217291,
                                                "lng": -77.04353829999999
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e to stay on \u003cb\u003eMt Vernon Trail\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8418337,
                                                "lng": -77.0480202
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 155
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 21
                                            },
                                            "end_location": {
                                                "lat": 38.8203373,
                                                "lng": -77.043695
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eE Abingdon Dr\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8217291,
                                                "lng": -77.04353829999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 362
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 54
                                            },
                                            "end_location": {
                                                "lat": 38.8180335,
                                                "lng": -77.0407637
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e toward \u003cb\u003eN Royal St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8203373,
                                                "lng": -77.043695
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.0 mi",
                                                "value": 1638
                                            },
                                            "duration": {
                                                "text": "5 mins",
                                                "value": 276
                                            },
                                            "end_location": {
                                                "lat": 38.8035084,
                                                "lng": -77.04388969999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eN Royal St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8180335,
                                                "lng": -77.0407637
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 190
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 45
                                            },
                                            "end_location": {
                                                "lat": 38.8037827,
                                                "lng": -77.0460568
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003ePrince St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8035084,
                                                "lng": -77.04388969999999
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "144 ft",
                                                "value": 44
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 38.8033974,
                                                "lng": -77.0461566
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS St Asaph St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8037827,
                                                "lng": -77.0460568
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "308 ft",
                                                "value": 94
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 14
                                            },
                                            "end_location": {
                                                "lat": 38.8035424,
                                                "lng": -77.0472262
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eNorton Ct\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8033974,
                                                "lng": -77.0461566
                                            },
                                            "travel_mode": "BICYCLING"
                  },
                                        {
                                            "distance": {
                                                "text": "479 ft",
                                                "value": 146
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 47
                                            },
                                            "end_location": {
                                                "lat": 38.804842,
                                                "lng": -77.0469806
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eGeorge Washington Memorial Pkwy/S Washington St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8035424,
                                                "lng": -77.0472262
                                            },
                                            "travel_mode": "BICYCLING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "Mt Vernon Trail",
                            "warnings": [
            "Bicycling directions are in beta. Use caution – This route may contain streets that aren't suited for bicycling."
         ],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                for (var i = 0; i < msg.payload.routes[0].legs[0].steps.lenght; i++) {
                    msg.payload.routes[0].legs[0].steps[i].should.have.property('travel_mode', 'BICYCLING');
                }
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Alexandria, VA',
                mode: 'bicycling',
                key: 'KEY'
            });
        });
    });

    it("should filter based on avoid set", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&avoid=highways')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2905919,
                                    "lng": -76.6086858
                                },
                                "southwest": {
                                    "lat": 38.9070195,
                                    "lng": -77.03690619999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "38.2 mi",
                                        "value": 61435
                                    },
                                    "duration": {
                                        "text": "1 hour 23 mins",
                                        "value": 4954
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "285 ft",
                                                "value": 87
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 9
                                            },
                                            "end_location": {
                                                "lat": 38.90724700000001,
                                                "lng": -77.03610239999999
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAMCEGICEACAAEGCACAAAGC"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "161 ft",
                                                "value": 49
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.9075291,
                                                "lng": -77.0357143
                                            },
                                            "html_instructions": "Exit the traffic circle",
                                            "polyline": {
                                                "points": "ianlFrbeuMA?A?A@AKAEAEEIGKQWKI"
                                            },
                                            "start_location": {
                                                "lat": 38.90724700000001,
                                                "lng": -77.03610239999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 519
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 95
                                            },
                                            "end_location": {
                                                "lat": 38.909307,
                                                "lng": -77.0302051
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "acnlFd`euMS}@e@kBU{@i@uBG[I[c@iB]qAw@_DwA{FE]AI?KAI?E?E@G?G@E"
                                            },
                                            "start_location": {
                                                "lat": 38.9075291,
                                                "lng": -77.0357143
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.2 mi",
                                                "value": 6771
                                            },
                                            "duration": {
                                                "text": "13 mins",
                                                "value": 765
                                            },
                                            "end_location": {
                                                "lat": 38.9363586,
                                                "lng": -76.9608492
                                            },
                                            "html_instructions": "At the traffic circle, take the \u003cb\u003e4th\u003c/b\u003e exit and stay on \u003cb\u003eRhode Island Ave NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.909307,
                                                "lng": -77.0302051
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.5 mi",
                                                "value": 2466
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 204
                                            },
                                            "end_location": {
                                                "lat": 38.9516314,
                                                "lng": -76.9407635
                                            },
                                            "html_instructions": "At the traffic circle, continue straight onto \u003cb\u003eRhode Island Ave\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9363586,
                                                "lng": -76.9608492
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "24.1 mi",
                                                "value": 38823
                                            },
                                            "duration": {
                                                "text": "46 mins",
                                                "value": 2735
                                            },
                                            "end_location": {
                                                "lat": 39.2270446,
                                                "lng": -76.6955114
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eU.S. 1 N/Baltimore Ave\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow U.S. 1 N\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9516314,
                                                "lng": -76.9407635
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "5.3 mi",
                                                "value": 8582
                                            },
                                            "duration": {
                                                "text": "10 mins",
                                                "value": 623
                                            },
                                            "end_location": {
                                                "lat": 39.2826165,
                                                "lng": -76.6448599
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eU.S. 1 N/Southwestern Blvd\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow U.S. 1 N\u003c/div\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.2270446,
                                                "lng": -76.6955114
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 295
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 30
                                            },
                                            "end_location": {
                                                "lat": 39.28526919999999,
                                                "lng": -76.64502499999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Fulton Ave\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "kkwnFjuxrMO?m@Bu@DqBFmB@uADgBD"
                                            },
                                            "start_location": {
                                                "lat": 39.2826165,
                                                "lng": -76.6448599
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3132
                                            },
                                            "duration": {
                                                "text": "6 mins",
                                                "value": 372
                                            },
                                            "end_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Pratt St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.28526919999999,
                                                "lng": -76.64502499999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 434
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Gay St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ydxnFhsqrMeCHuA@cDJiFTaDL"
                                            },
                                            "start_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 277
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 52
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "e}xnFduqrMHpEBJF`@@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "U.S. 1 N",
                            "warnings": [],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].should.not.have.property('summary', 'MD-295 N and Baltimore-Washington Pkwy');
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                avoid: 'highways',
                key: 'KEY'
            });
        });
    });

    it("should provide alternatives", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&alternatives=true')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2905919,
                                    "lng": -76.6086858
                                },
                                "southwest": {
                                    "lat": 38.9029101,
                                    "lng": -77.03690619999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "38.6 mi",
                                        "value": 62187
                                    },
                                    "duration": {
                                        "text": "53 mins",
                                        "value": 3161
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "184 ft",
                                                "value": 56
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 6
                                            },
                                            "end_location": {
                                                "lat": 38.9070341,
                                                "lng": -77.0363313
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAM"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1167
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 165
                                            },
                                            "end_location": {
                                                "lat": 38.9029535,
                                                "lng": -77.0239636
                                            },
                                            "html_instructions": "Exit the traffic circle onto \u003cb\u003eMassachusetts Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9070341,
                                                "lng": -77.0363313
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 157
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 20
                                            },
                                            "end_location": {
                                                "lat": 38.9029543,
                                                "lng": -77.0221461
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMt Vernon Pl NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "mfmlFvvbuM?Q?U?aI"
                                            },
                                            "start_location": {
                                                "lat": 38.9029535,
                                                "lng": -77.0239636
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.8 mi",
                                                "value": 7657
                                            },
                                            "duration": {
                                                "text": "11 mins",
                                                "value": 653
                                            },
                                            "end_location": {
                                                "lat": 38.9185504,
                                                "lng": -76.93857989999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eNew York Ave NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9029543,
                                                "lng": -77.0221461
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 882
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 35
                                            },
                                            "end_location": {
                                                "lat": 38.9233845,
                                                "lng": -76.93080519999999
                                            },
                                            "html_instructions": "Take the \u003cb\u003eBalt-Wash Pkwy\u003c/b\u003e ramp on the \u003cb\u003eleft\u003c/b\u003e to \u003cb\u003eBaltimore\u003c/b\u003e",
                                            "polyline": {
                                                "points": "}gplFbartMIWCMGYg@cDWsAUeAYkA]gAe@sAMa@o@yAYk@[o@i@}@q@gAeAyAUW_@a@q@w@cEeEoAoAw@u@_@]GGCCCEAE"
                                            },
                                            "start_location": {
                                                "lat": 38.9185504,
                                                "lng": -76.93857989999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "18.3 mi",
                                                "value": 29389
                                            },
                                            "duration": {
                                                "text": "19 mins",
                                                "value": 1166
                                            },
                                            "end_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eBaltimore-Washington Pkwy\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9233845,
                                                "lng": -76.93080519999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "12.0 mi",
                                                "value": 19233
                                            },
                                            "duration": {
                                                "text": "12 mins",
                                                "value": 726
                                            },
                                            "end_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMD-295 N/Baltimore-Washington Pkwy\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.0 mi",
                                                "value": 1672
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 125
                                            },
                                            "end_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eBaltimore-Washington Pkwy/Russell St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow Baltimore-Washington Pkwy\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "354 ft",
                                                "value": 108
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 13
                                            },
                                            "end_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eS Paca St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "i|wnFthtrMMMGGIEGCGEEASGUEIAW?U@_@@"
                                            },
                                            "start_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1155
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 136
                                            },
                                            "end_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Pratt St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "abxnF`gtrMAmGIgG?K?QASKkIIiGEoDCqAKmGEwGA]CqAEmDCkC?OC}AAsAAu@?O"
                                            },
                                            "start_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 434
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Gay St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ydxnFhsqrMeCHuA@cDJiFTaDL"
                                            },
                                            "start_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 277
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 52
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "e}xnFduqrMHpEBJF`@@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "MD-295 N and Baltimore-Washington Pkwy",
                            "warnings": [],
                            "waypoint_order": []
      },
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2904841,
                                    "lng": -76.61022389999999
                                },
                                "southwest": {
                                    "lat": 38.9070195,
                                    "lng": -77.041465
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "40.9 mi",
                                        "value": 65750
                                    },
                                    "duration": {
                                        "text": "55 mins",
                                        "value": 3319
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "377 ft",
                                                "value": 115
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 14
                                            },
                                            "end_location": {
                                                "lat": 38.9074348,
                                                "lng": -77.0362911
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAMCEGICEACAAEGCACAAAGCA?A?A@IFEDEFCDCF"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 165
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 20
                                            },
                                            "end_location": {
                                                "lat": 38.9088875,
                                                "lng": -77.03647749999999
                                            },
                                            "html_instructions": "Exit the traffic circle",
                                            "polyline": {
                                                "points": "mbnlFxceuMCDEBK@CBE@E@E?E?E?I@K?aB?M?I@I?I?I?I@K?K@[H"
                                            },
                                            "start_location": {
                                                "lat": 38.9074348,
                                                "lng": -77.0362911
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "5.7 mi",
                                                "value": 9249
                                            },
                                            "duration": {
                                                "text": "15 mins",
                                                "value": 912
                                            },
                                            "end_location": {
                                                "lat": 38.992045,
                                                "lng": -77.0361771
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003e16th St NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9088875,
                                                "lng": -77.03647749999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.1 mi",
                                                "value": 1767
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 152
                                            },
                                            "end_location": {
                                                "lat": 39.0061504,
                                                "lng": -77.0389577
                                            },
                                            "html_instructions": "At \u003cb\u003eBlair Cir\u003c/b\u003e, take the \u003cb\u003e2nd\u003c/b\u003e exit onto \u003cb\u003e16th St\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.992045,
                                                "lng": -77.0361771
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 708
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 93
                                            },
                                            "end_location": {
                                                "lat": 39.0120715,
                                                "lng": -77.041465
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eGeorgia Ave\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "mkamFnteuMIYqAz@}@h@}@`@KNGJ}@^GBC@UFYJ[JcA\\YHSF}@Te@LiAXODq@Pu@RUFQFMD]Hs@Rk@N[HyA\\IBqAX"
                                            },
                                            "start_location": {
                                                "lat": 39.0061504,
                                                "lng": -77.0389577
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 205
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 17
                                            },
                                            "end_location": {
                                                "lat": 39.0132656,
                                                "lng": -77.03975819999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto the \u003cb\u003eI-495 E/Beltway\u003c/b\u003e ramp to \u003cb\u003eBaltimore\u003c/b\u003e",
                                            "polyline": {
                                                "points": "mpbmFbdfuMw@i@QSGIEMEQESAICGCGCGIMIIIGSOKIEEEGIIEIEKEMCOCMCMEIEI"
                                            },
                                            "start_location": {
                                                "lat": 39.0120715,
                                                "lng": -77.041465
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.5 mi",
                                                "value": 7204
                                            },
                                            "duration": {
                                                "text": "5 mins",
                                                "value": 282
                                            },
                                            "end_location": {
                                                "lat": 39.0191157,
                                                "lng": -76.95912679999999
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eI-495 E\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.0132656,
                                                "lng": -77.03975819999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.3 mi",
                                                "value": 2105
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 92
                                            },
                                            "end_location": {
                                                "lat": 39.0298832,
                                                "lng": -76.94748229999999
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e27\u003c/b\u003e for \u003cb\u003eI-95 N\u003c/b\u003e toward \u003cb\u003eBaltimore\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.0191157,
                                                "lng": -76.95912679999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "18.4 mi",
                                                "value": 29628
                                            },
                                            "duration": {
                                                "text": "17 mins",
                                                "value": 1004
                                            },
                                            "end_location": {
                                                "lat": 39.2207556,
                                                "lng": -76.7231611
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eI-95 N\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.0298832,
                                                "lng": -76.94748229999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "6.5 mi",
                                                "value": 10536
                                            },
                                            "duration": {
                                                "text": "6 mins",
                                                "value": 383
                                            },
                                            "end_location": {
                                                "lat": 39.268874,
                                                "lng": -76.63131229999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork to stay on \u003cb\u003eI-95 N\u003c/b\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.2207556,
                                                "lng": -76.7231611
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.6 mi",
                                                "value": 1041
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 46
                                            },
                                            "end_location": {
                                                "lat": 39.2711399,
                                                "lng": -76.6222576
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e53\u003c/b\u003e for \u003cb\u003eInterstate 395 N\u003c/b\u003e toward \u003cb\u003eDowntown/Inner Harbor\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.268874,
                                                "lng": -76.63131229999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.9 mi",
                                                "value": 1430
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 74
                                            },
                                            "end_location": {
                                                "lat": 39.283564,
                                                "lng": -76.61902139999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eI-395 N\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.2711399,
                                                "lng": -76.6222576
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 517
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2842045,
                                                "lng": -76.6133052
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Conway St\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "gqwnFzssrMg@OCAAACCCCCECECECEAGAEAICe@C_DMcJA[E}BCuAEq@CwAGeC"
                                            },
                                            "start_location": {
                                                "lat": 39.283564,
                                                "lng": -76.61902139999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 260
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 31
                                            },
                                            "end_location": {
                                                "lat": 39.2861423,
                                                "lng": -76.6123047
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eLight St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "guwnFdprrMEy@YByAF_@DI?M?K?OCMCOEMEMEIGOMEECEEEIMKM_@a@MQCCIK"
                                            },
                                            "start_location": {
                                                "lat": 39.2842045,
                                                "lng": -76.6133052
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 393
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 46
                                            },
                                            "end_location": {
                                                "lat": 39.28965,
                                                "lng": -76.612295
                                            },
                                            "html_instructions": "\u003cb\u003eLight St\u003c/b\u003e turns slightly \u003cb\u003eleft\u003c/b\u003e and becomes \u003cb\u003eS Calvert St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "kaxnFzirrM_@Ie@OOE_@ESA[?eDH{AFW@o@Bw@BqADcAD"
                                            },
                                            "start_location": {
                                                "lat": 39.2861423,
                                                "lng": -76.6123047
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 178
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 32
                                            },
                                            "end_location": {
                                                "lat": 39.2897306,
                                                "lng": -76.61022389999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eE Baltimore St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "iwxnFzirrMIgGEwC"
                                            },
                                            "start_location": {
                                                "lat": 39.28965,
                                                "lng": -76.612295
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "276 ft",
                                                "value": 84
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 18
                                            },
                                            "end_location": {
                                                "lat": 39.2904841,
                                                "lng": -76.61026769999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e at the 2nd cross street onto \u003cb\u003eHolliday St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ywxnFz|qrMuCH"
                                            },
                                            "start_location": {
                                                "lat": 39.2897306,
                                                "lng": -76.61022389999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 165
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 39
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eDestination will be on the right\u003c/div\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "o|xnFd}qrM@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2904841,
                                                "lng": -76.61026769999999
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": [
                                        {
                                            "location": {
                                                "lat": 39.0608621,
                                                "lng": -76.9207079
                                            },
                                            "step_index": 8,
                                            "step_interpolation": 0.1436067259480345
                  }
               ]
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "I-95 N",
                            "warnings": [],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.be.above(1);
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                alternatives: 'true',
                key: 'KEY'
            });
        });
    });

    it("should use waypoints", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&waypoints=Arlington%2C%20VA')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2905919,
                                    "lng": -76.6086858
                                },
                                "southwest": {
                                    "lat": 38.8649668,
                                    "lng": -77.10675959999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "5.1 mi",
                                        "value": 8269
                                    },
                                    "duration": {
                                        "text": "12 mins",
                                        "value": 735
                                    },
                                    "end_address": "Arlington, VA, USA",
                                    "end_location": {
                                        "lat": 38.8799318,
                                        "lng": -77.10675959999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 185
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 22
                                            },
                                            "end_location": {
                                                "lat": 38.9072574,
                                                "lng": -77.0369797
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAMCEGICEACAAEGCACAAAGCA?A?A@IFEDEFCDCFCDAJAH?N@n@@Dd@f@"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "174 ft",
                                                "value": 53
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.9069418,
                                                "lng": -77.03741939999999
                                            },
                                            "html_instructions": "Exit the traffic circle onto \u003cb\u003eScott Cir NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "kanlFbheuMD@x@tA"
                                            },
                                            "start_location": {
                                                "lat": 38.9072574,
                                                "lng": -77.0369797
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 343
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 41
                                            },
                                            "end_location": {
                                                "lat": 38.905678,
                                                "lng": -77.04103719999999
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "k_nlFzjeuMPn@Pn@j@vBnAnFLd@Jd@Ld@H\\DPRv@H\\DR"
                                            },
                                            "start_location": {
                                                "lat": 38.9069418,
                                                "lng": -77.03741939999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 376
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 56
                                            },
                                            "end_location": {
                                                "lat": 38.9026467,
                                                "lng": -77.0395137
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eConnecticut Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "owmlFnafuMHZtDeBbEqBrCsA\\QHCDCFADADABA"
                                            },
                                            "start_location": {
                                                "lat": 38.905678,
                                                "lng": -77.04103719999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 620
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 80
                                            },
                                            "end_location": {
                                                "lat": 38.8970753,
                                                "lng": -77.0394534
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003e17th St NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "qdmlF|weuMV?X?jA?nB?XAXCj@Ir@?dA?^?X?rC?J@H?J@Z?j@?f@?x@?`E?t@?"
                                            },
                                            "start_location": {
                                                "lat": 38.9026467,
                                                "lng": -77.0395137
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 253
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.8959836,
                                                "lng": -77.0417212
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eNew York Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "wallFpweuMn@TZ?B@B?B?@@B@B@@BBB@BHb@Pf@BL@JBNBNbAnF?D@F?F?F@F"
                                            },
                                            "start_location": {
                                                "lat": 38.8970753,
                                                "lng": -77.0394534
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 224
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.8959863,
                                                "lng": -77.04431319999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eE St NW/Rawlings Square NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow E St NW\u003c/div\u003e",
                                            "polyline": {
                                                "points": "{zklFvefuM?rFAhB?fD"
                                            },
                                            "start_location": {
                                                "lat": 38.8959836,
                                                "lng": -77.0417212
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 575
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 47
                                            },
                                            "end_location": {
                                                "lat": 38.8959126,
                                                "lng": -77.0509225
                                            },
                                            "html_instructions": "Slight \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Street Expressway\u003c/b\u003e",
                                            "maneuver": "turn-slight-left",
                                            "polyline": {
                                                "points": "}zklF|ufuMJvBVrCB`@BX@\\BX@Z?XAd@Ch@Aj@A\\Ab@AD?b@AN?@A^?d@AJEz@Ev@AT?\\An@?nI"
                                            },
                                            "start_location": {
                                                "lat": 38.8959863,
                                                "lng": -77.04431319999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1197
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 69
                                            },
                                            "end_location": {
                                                "lat": 38.8919357,
                                                "lng": -77.06218109999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork, follow signs for \u003cb\u003eInterstate 66 W\u003c/b\u003e and merge onto \u003cb\u003eI-66 W\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eParts of this road are HOV only Mon–Fri 4:00 – 7:00 pm\u003c/div\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "mzklFf_huM@xA?v@A^?b@Ad@?b@Af@EzB?FAH?H@H?F@JBH@H@HBJDHBJDJFJDFFHFFFHHFFDFDFDHBFBF@HBH@J@H@H?J@L@R?P@XBJ@H@HBJ@NBLBJBJBJDFBF@FDHBFDHDLFJHXXFFDHJHd@l@FPDLDJBNDNDRDVBR@LBPlDb_@\\vD"
                                            },
                                            "start_location": {
                                                "lat": 38.8959126,
                                                "lng": -77.0509225
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "463 ft",
                                                "value": 141
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 38.8919504,
                                                "lng": -77.0637985
                                            },
                                            "html_instructions": "Take the \u003cb\u003eU.S. 50 W/Arlington Boulevard W/George Washington Memorial Parkway\u003c/b\u003e exit\u003cdiv style=\"font-size:0.9em\"\u003eEntering Virginia\u003c/div\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "saklFrejuMDjA@P@J@R@R?N?V?XATATANCXEX"
                                            },
                                            "start_location": {
                                                "lat": 38.8919357,
                                                "lng": -77.06218109999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 475
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 28
                                            },
                                            "end_location": {
                                                "lat": 38.89096079999999,
                                                "lng": -77.06860230000001
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e, follow signs for \u003cb\u003eUS 50 W\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "uaklFvojuMKr@CNELAJCJANALALAN?L?N?N@P?@@NBNBPDNBNDNDLFNHLDHDHFHDFFH`AdAHHHHHJFHFJHJDJHNDJDLDNDLBLBNBLBR@L@N?J@L?N?L?PALALCRAPENCNADMl@"
                                            },
                                            "start_location": {
                                                "lat": 38.8919504,
                                                "lng": -77.0637985
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.9 mi",
                                                "value": 1438
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 73
                                            },
                                            "end_location": {
                                                "lat": 38.8868996,
                                                "lng": -77.08245239999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eUS-50 W/Arlington Blvd\u003c/b\u003e",
                                            "polyline": {
                                                "points": "o{jlFvmkuMIRKRMVMTMTMTKTMVKVIVKVIRI\\GV_@`BCNKp@Iz@ARCZALAjA?hADt@Dn@LhA?JJf@J^J^FXPj@`AnD@BRv@h@nBr@jCZl@Tb@Tb@T\\T^TVTXTXTTJLZ\\jBvBjAvAf@n@jBtBZ^HJV^\\n@Tj@Tv@Ln@Jj@TzANx@"
                                            },
                                            "start_location": {
                                                "lat": 38.89096079999999,
                                                "lng": -77.06860230000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "56 ft",
                                                "value": 17
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 2
                                            },
                                            "end_location": {
                                                "lat": 38.8869518,
                                                "lng": -77.08263359999999
                                            },
                                            "html_instructions": "Take the exit toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "cbjlFhdnuMIZ?D?@"
                                            },
                                            "start_location": {
                                                "lat": 38.8868996,
                                                "lng": -77.08245239999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "223 ft",
                                                "value": 68
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.886691,
                                                "lng": -77.0833427
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork, follow signs for \u003cb\u003eHwy 237 W\u003c/b\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "mbjlFlenuMb@`BNj@"
                                            },
                                            "start_location": {
                                                "lat": 38.8869518,
                                                "lng": -77.08263359999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 226
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 22
                                            },
                                            "end_location": {
                                                "lat": 38.8851616,
                                                "lng": -77.0849996
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e at the fork to continue toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "fork-right",
                                            "polyline": {
                                                "points": "y`jlFzinuMPf@`@v@NT@@RZ`@f@v@p@t@f@p@d@BBPJ"
                                            },
                                            "start_location": {
                                                "lat": 38.886691,
                                                "lng": -77.0833427
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "449 ft",
                                                "value": 137
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 11
                                            },
                                            "end_location": {
                                                "lat": 38.8846786,
                                                "lng": -77.08636109999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e at the fork to continue toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "fork-right",
                                            "polyline": {
                                                "points": "gwilFftnuMNJZ\\R`@FTFVBX@RBX@^Bl@"
                                            },
                                            "start_location": {
                                                "lat": 38.8851616,
                                                "lng": -77.0849996
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1058
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 114
                                            },
                                            "end_location": {
                                                "lat": 38.8845212,
                                                "lng": -77.0985608
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "polyline": {
                                                "points": "gtilFv|nuMDdA@lAB`CBfEBvEBrDBnA?vBB`E?d@?b@?p@?p@BfD@d@?j@@dB?f@FfGBjEEp@AVK~@"
                                            },
                                            "start_location": {
                                                "lat": 38.8846786,
                                                "lng": -77.08636109999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 883
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 106
                                            },
                                            "end_location": {
                                                "lat": 38.8799318,
                                                "lng": -77.10675959999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eWilson Blvd\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "gsilF~hquMRTj@f@VVZ^bBlBFHPZ`@~@t@nBn@vAh@rAn@nBPd@T~@fAhCnAjCpEhK`@dAHh@BZ"
                                            },
                                            "start_location": {
                                                "lat": 38.8845212,
                                                "lng": -77.0985608
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            },
                                {
                                    "distance": {
                                        "text": "45.7 mi",
                                        "value": 73522
                                    },
                                    "duration": {
                                        "text": "58 mins",
                                        "value": 3502
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Arlington, VA, USA",
                                    "start_location": {
                                        "lat": 38.8799318,
                                        "lng": -77.10675959999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 839
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 87
                                            },
                                            "end_location": {
                                                "lat": 38.8842008,
                                                "lng": -77.0988734
                                            },
                                            "html_instructions": "Head \u003cb\u003eeast\u003c/b\u003e on \u003cb\u003eWilson Blvd\u003c/b\u003e toward \u003cb\u003eN Pollard St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "qvhlFf|ruMC[Ii@a@eAqEiKoAkCgAiCU_AQe@o@oBi@sAo@wAu@oBa@_AQ[GIcBmB[_@WW"
                                            },
                                            "start_location": {
                                                "lat": 38.8799318,
                                                "lng": -77.10675959999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 515
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 53
                                            },
                                            "end_location": {
                                                "lat": 38.8844372,
                                                "lng": -77.09296920000001
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003e10th St N\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "gqilF|jquMGSCKEKAGAGIa@BW?W?W?c@EiEEgGAwDCoE?k@AkA"
                                            },
                                            "start_location": {
                                                "lat": 38.8842008,
                                                "lng": -77.0988734
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3035
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 194
                                            },
                                            "end_location": {
                                                "lat": 38.8651439,
                                                "lng": -77.06979799999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eWashington Blvd\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "wrilF`fpuMRSNMRQn@i@HILIPI|BmAd@Y`Ag@h@Y~EkC~Ay@JI`CmAp@e@`@[|@}@b@k@t@mA~@wArBcD`A}AhBsChAgBf@y@zDgGh@{@@ADIJOBEb@o@NUj@w@Z_@NUb@c@b@]n@e@bAo@RKbCyAh@[^Ud@UxAaAlAu@bBoAv@m@n@k@rAiA~AcBhAmAdAqAz@gAv@eAZc@r@eAd@u@h@}@NWXi@Zi@n@mAN]n@{At@sBXu@Tu@@C@CBIPo@XeAR_ANu@Jq@LsAFk@N{ATcCH_ADk@"
                                            },
                                            "start_location": {
                                                "lat": 38.8844372,
                                                "lng": -77.09296920000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "2.2 mi",
                                                "value": 3558
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 196
                                            },
                                            "end_location": {
                                                "lat": 38.8782794,
                                                "lng": -77.03721899999999
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eI-395 N\u003c/b\u003e via the ramp to \u003cb\u003eWashington\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering District of Columbia\u003c/div\u003e",
                                            "polyline": {
                                                "points": "czelFfukuMB]@YB[B]Di@Bc@BWFs@?IBYB[?A@[@]?OAq@?IAA?MEc@CSAMMq@U}@c@_BcBmFGEACCEk@kBaA{C_@oACEEOACGWAAI_@GYG_@CWCUAY?OAW?Y@e@@[LmCDs@BQD]Lo@?E@A?EFYBM?C?C?G?Kl@sDJu@Lu@V}Af@_DD]DYD_@BYHu@RqBJ}AFiA@U@Y@O@sA?O?q@Ae@Cs@C_@Ei@Ec@O_BO_AAEAC?AWiAEWAA?AS}@U{@CGCICIAEOg@c@{AwAeDkAoBmAsA][YWa@[k@]a@UEC]O{DiBSMUOWQWQSOQOQQOQOSMQMUKOO[KUKWKUKWKWIWKYKWKWKWMSMUOUMSOS]k@MMOMMMMMKIs@u@q@u@AAwAsAmAkAmAkAa@]qBsB]]]]qEgE_@]uCmCCEy@u@q@o@KIY[SQGEg@g@QOGI"
                                            },
                                            "start_location": {
                                                "lat": 38.8651439,
                                                "lng": -77.06979799999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.1 mi",
                                                "value": 1786
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 105
                                            },
                                            "end_location": {
                                                "lat": 38.8823579,
                                                "lng": -77.0181583
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e to stay on \u003cb\u003eI-395 N\u003c/b\u003e",
                                            "maneuver": "keep-right",
                                            "polyline": {
                                                "points": "glhlFrieuMKUEIGKGKMUMWKYKWK_@GUGYE]E]CUCWAWAU?[A]?_@?]?a@?iA?]AYA[AWC]Ea@Ea@COEOKe@Og@Ma@KWUg@IMi@}@EEc@q@ACSYSYCCEIMOOSYc@[g@s@eAS[Wa@Ye@Wg@MYISISM]Qg@Mc@IU?AAEGSAEI_@Q}@?CAIEYAA?CCSCQCWE_@?C?AAQAKC_@?YAWA]?i@?K?C?A?C?S?S?E?[?}FAyAAE?_BAy@Co@EaE?A?[CsBAe@?c@@gD@iCAqDA_A"
                                            },
                                            "start_location": {
                                                "lat": 38.8782794,
                                                "lng": -77.03721899999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3059
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 151
                                            },
                                            "end_location": {
                                                "lat": 38.8721,
                                                "lng": -76.9899106
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork to continue on \u003cb\u003eI-695\u003c/b\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "weilFnrauM?gA?m@?e@?yKAwF?k@?A?A?uD@KDqA@MJaBH}@?C?AHm@Hm@Nu@xAqHHe@DS?CLq@b@cCb@aCXsBFq@B_@Bq@BwAFwJBi@Bu@Bk@Fk@Hi@He@Ny@Jk@?A@ED[r@_EHc@F[?C^oBP_AX{ATmA?C@?Ny@`AqFN}@H{@Jm@p@kF~@gHv@}FZ_BT_APa@R[V[ZY^Q`@M^Gp@CrADxCRVDP?p@Dp@BXBV@X?XAp@I`@EVCb@KDCDAx@a@PKbAu@jB}AXU"
                                            },
                                            "start_location": {
                                                "lat": 38.8823579,
                                                "lng": -77.0181583
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 561
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 31
                                            },
                                            "end_location": {
                                                "lat": 38.8705815,
                                                "lng": -76.98483779999999
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e2B\u003c/b\u003e for \u003cb\u003eState Hwy 295 N\u003c/b\u003e toward \u003cb\u003eUS-50 S\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "seglF|a|tMJ@B?D?FE`Ao@pAo@l@_@JIHGDCFIDCR[T]N]HSHYJ_@F[F[Hw@Dg@B]Bq@Ae@C{@Ck@Gi@Ii@GYEUa@}AIm@Ea@"
                                            },
                                            "start_location": {
                                                "lat": 38.8721,
                                                "lng": -76.9899106
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.4 mi",
                                                "value": 7121
                                            },
                                            "duration": {
                                                "text": "6 mins",
                                                "value": 369
                                            },
                                            "end_location": {
                                                "lat": 38.9165922,
                                                "lng": -76.9323079
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eDistrict of Columbia Hwy 295/State Hwy 295\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "c|flFfb{tMqAkDGOw@wBc@oAYw@i@uAWq@Uq@GKqBgFqA_D]}@Ys@Yw@Um@IUKWSk@Uq@a@_By@kCSy@[gA?AIWEOAC_AkDWcA?CKc@AESy@M_AMcAAE?GAEGs@Eg@Cg@Cw@IiBEe@IyA?EIgAQoACOKm@UcAQm@Uo@Og@Q_@S_@S_@]m@e@s@u@_Au@aA}@_Aw@{@k@k@m@i@YWYUYWi@_@KKWSs@g@o@a@i@_@KIm@]YSYMk@[k@QYM_@QOGe@Qm@Uk@Sg@Qs@UKEsA_@cA[uAa@e@OkCw@{Bq@sDkAgBq@UMg@W_@Sk@i@c@_@a@e@UWc@o@_@m@i@aAkBoDO[e@}@m@gAeAmBMUYk@_A_Ba@k@UUc@_@_Ay@UGm@o@_C_CiBgBqBoBkAgAwAyAaAoA_AsAW_@q@}@CEQUW]KMm@o@MMAAEEGGCCCEa@a@}@eAQQ[[{AaB[]q@u@c@k@IM{AuBu@aAaDmE{@mA{AuBc@o@GIq@_AOSg@q@KOc@k@[a@[_@]_@]a@m@u@gBwBIK?Ai@o@AAKMMOIKAAUWoJ_MEGmA_BeAuA}@y@iA_AqAiA[Yo@m@eKqIa@]kBaBECq@m@GGKIs@q@c@a@WSu@m@cBqAOMw@s@uAiAe@_@A?QQCAAAQOA?oBeBWSkDoB]OoCk@q@Ka@Ei@Ei@AeBEA?aBG"
                                            },
                                            "start_location": {
                                                "lat": 38.8705815,
                                                "lng": -76.98483779999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "18.7 mi",
                                                "value": 30169
                                            },
                                            "duration": {
                                                "text": "20 mins",
                                                "value": 1200
                                            },
                                            "end_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e to continue on \u003cb\u003eBaltimore-Washington Pkwy\u003c/b\u003e, follow signs for \u003cb\u003eInterstate 95/Baltimore-Washington Parkway N/Baltimore\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "u{olF|yptMe@AaJ[k@Cc@Am@@gCE]AmCKy@EeAIi@IGAKAa@Kk@Sc@Q]OYQo@a@OMWUa@]e@_@E?E?wBcBcAw@_@WSMSOu@e@cC_BoAy@wBsASMUOWO{AcAiCeB{B{AiAu@{AgAk@e@YW][YYi@i@Y]OS_@e@U]]g@k@{@c@y@m@mAg@kAYs@k@_Be@_BeAwDOm@y@sCq@sBOa@Qc@Yu@_@w@c@}@Q]KOoB{CgAwAAAQUAAAA}AsA}AmAmAw@}BcAsFaCc@ScBeAAAOKCAAAYUo@g@}@s@s@q@]a@a@c@c@g@a@c@eAiASS]c@_AeAk@m@UWgAcAaBuA]UWSm@a@MIWM[QUMYMYKi@Sq@Uc@O_@K]Ie@M]G]Gw@Mc@Ek@Gg@Ce@C_@Ck@AW?U?[?g@@y@Bs@BaABaADW@U@S?W@sAD{@@o@@s@Au@Aa@Cg@Ca@Ce@Eu@Kg@G_AQy@S[GOESGWIMEWK_@MWKYKi@UYOe@We@UYQ_Am@s@g@y@i@_@W[Uo@c@uAcAiAu@w@g@k@]_@SSIQI[M}As@aB]i@Oq@Mu@MsAOQAaAEo@CwAEkAGA?oBGi@Ea@Cs@Ei@Gk@Ge@Ii@MqAYyBq@wAg@gAa@k@SOGs@_@QI_@SWO]Ue@[e@[}@o@WQc@Ye@_@aBkAyAcAwA}@g@[}@g@o@_@oAo@gB{@g@UmGiCWMe@Sg@WSKg@YWOc@WgAu@QMy@k@e@]QMu@m@u@s@u@u@{B}Bg@g@]_@]]wAwAc@_@e@a@c@_@kA}@w@i@a@[{@g@UMeAk@cBy@m@Wm@UiA_@a@OoA_@kHkBoA[gEgAuA_@kBm@eBk@iBo@}@]}@_@{@]y@_@kAk@YQo@a@s@_@SM{@i@sA}@e@[yAcA{@u@qBgBmAoA_CiCcBoBKO]c@?AIK]e@wCcEU]MSg@u@w@sAm@cAo@mAc@_Ag@kAMYmBkFGUAA?CEKEOCKAACISw@o@kCuA_HeDyQm@kDIa@iAiFw@eCaA_DACu@wBi@wAy@sBo@wAqAqCwAmCu@kAi@y@[_@_B{Bo@w@gCkCeB{Ac@[a@[q@c@eAm@aAk@KGOIc@SoAm@_@KUG}@_@cAa@kBq@a@OKCGCCAQG_A[yAa@qDaAa@MaFcAeCi@yCq@gDq@mCm@_Ce@gCi@}@Q{GyA_GmA{FuAyCw@qCw@cAWmA]AAA?A?sAa@sFcBgA_@qBq@uAc@cBo@gHaCeBo@aEwAwBu@_Bo@uDuAeBo@aBo@k@SmCgAs@WmAc@aHoCaDqA{@]c@Q]QkAg@{FaCuDcBa@Q_@UgD{AsGuCcFcCsBaAkDeBqDkBaCmA_By@{@e@yAy@gAo@oFyC}KgGwBkAwCwAqBaAeEmBqCiAgA_@OGs@Y{@[cAa@}@]{EkBwAi@kCcAaAa@k@UGCGCo@Wa@OeAc@mCaA{@[u@YA?i@UeCaAyBy@_Bo@q@W_@OoAq@eBs@QKqAk@aD_Bw@_@qCuAoHcEsBmA_CyAgAq@}B{AcM}IcEyCqI}GgFkEwGaGaEyDcFaFaAeAgAiAqB}BiB}BsAiBmBoCgMqRoDsF_FqHiDaF{@qAo@{@_AkA_C{CmDiEcCwCgAoAq@w@yCaDaEgEgDgDsCwCkBkBcCaC_BcBuAwAcBkBiDyD{@cAgAqAqEyFeCcDwAmBoAeBoF_IqCkEs@kAuA}BOWgAgBiAkBgAiByAaCwA}BeBuCgCyDiD_F{B_DoK_NaJiLUWOS}C_E}BaD{BcDoDyFwA_CqBiDEGaAcBS_@Ua@y@{Au@qA_CcEcByCu@qAk@cA{AgCOWe@u@m@_A{@sAo@cAw@gAu@gAw@iAkBiCcAqAu@_Ay@cAi@o@g@m@}@cA}AiBsCyCgBiBkCeCw@s@cA}@cDqCoB_BmBwAiA{@wB{AqBuAgAu@kAw@gC_BeEeCeCwA{@g@g@WaB}@oAo@oAo@cBy@cBy@{@c@s@]q@Wg@WqAk@yBcA}CuAcAa@{@]_Bm@qDuAyGeCsC_A"
                                            },
                                            "start_location": {
                                                "lat": 38.9165922,
                                                "lng": -76.9323079
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "12.0 mi",
                                                "value": 19233
                                            },
                                            "duration": {
                                                "text": "12 mins",
                                                "value": 726
                                            },
                                            "end_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMD-295 N/Baltimore-Washington Pkwy\u003c/b\u003e",
                                            "polyline": {
                                                "points": "_r{mFxgnsMiKqDaCu@iCw@g@QeA_@wBy@wG_CaFgBk@SkC_A}By@_A]mAi@s@]o@Y{@e@y@e@e@Ys@c@UOg@]MKgBqAa@[_@[cA}@_DcDiOoPgPuQcGwG}BiCu@w@mBuB_AgA}PiReBmBeAgAa@a@KKUUuAsAs@q@aDuC_A{@m@i@eA}@eA_A{AqAuAmAoAgA}@w@a@_@m@g@_@]eA}@aDoCsBiBiEuD}BqB_HcGkKcJcA{@USwAmAwAoAkBaBeB{AcA{@y@s@a@_@aAy@][WUUSeYqVeGmFOMMK_@]CCAAc@]oBcBqAkAg@c@mC}BkBaBgAaAgB}AyAoAyAoAWUo@k@cA}@i@e@_B}AY[u@w@u@}@]a@OOe@o@g@q@OSSYg@u@e@q@MWi@y@{@}Aw@yAq@uAm@sAWs@Wg@]_Ai@{AWs@]eAMc@KYKa@K[Ke@Oe@GQCI?AK_@eCcJs@cC[kAGSGQ[gAWcASq@Oi@Qo@Yy@K]Qm@GWEQCMGYQo@GWOi@K[Ok@Ok@Oi@COEOCKEMGSCKCGAGEMKYEO_@kAm@wA[u@Yo@e@}@i@cA]k@KOMSGKQYKOU[Y]UYsA{AuAqAcA{@u@k@uB{AMQIIMMIGA?CCCCGEMMe@c@]_@_@a@]e@q@y@GKECEEGIQWYa@U]IMCCe@q@{@qAe@u@cAyA_B_C}AyBwAyBeBeCu@oAy@qAu@kAu@qA_AmBYa@e@_Aq@cBg@uAg@wAc@yAa@wAc@kBEQAGeHoYaA{DkBoHuEoRcGuUIe@GUAS_@_BYkAQq@WgA}AqG}CiMiByGcA_Do@aBSe@g@kA{@eBc@{@O]m@gASUU]i@y@U[_@i@SUIKSW}@iAiBmBWY_DoCiBqAqAs@_A_@iA[QEeASOCqBSqCW_AIeCQuCSqEa@iDWi@E}BUu@GA?C?e@EA?A?IA{AKmAI}BQkCSy@GiDY{BQyAMsCWyCWyCUuCQuCQuCMuCKwCQyCYiAQiASmBg@k@S?Ag@Q{@a@u@a@y@g@]Us@e@m@g@s@m@e@e@o@s@W[m@s@u@cA_AoAaAsAa@o@SU_AuA{@mAw@iA_@k@W_@SYOSqJuN}@oA[c@eFkHy@{@kAcAu@a@_Ac@oAa@wAUuBQcF_@{CSe@C}CSmGg@QAw@GeBOo@EG?A?A?aBKq@Cw@AyCEeBCqCIQCK@W?E?aCKkAAuAIg@CWE[E[Go@OUI[Ic@Oy@a@o@_@u@k@OOCCEG][KKGGAAEEACA??ACCKKOSAACC[c@?AAAEEUYe@m@]_@CCAAACA?WYeL{N"
                                            },
                                            "start_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.0 mi",
                                                "value": 1672
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 125
                                            },
                                            "end_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eBaltimore-Washington Pkwy/Russell St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow Baltimore-Washington Pkwy\u003c/div\u003e",
                                            "polyline": {
                                                "points": "ujunFxxurMEGCGUWyAsBMSwAkBuEqGoAcB_@e@w@{@{@{@ACAAcAy@MIUO[SYOOGWIOGGC_A]eC_AA?WKIE}@]}B_AkCw@m@UkCeAOG_@MEAQGQEWEA?OAOCA?c@G}@@aBBoFLwABy@BW?K?YA]KMEMGIEIGKKWWIICGIOWi@O]"
                                            },
                                            "start_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "354 ft",
                                                "value": 108
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 13
                                            },
                                            "end_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eS Paca St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "i|wnFthtrMMMGGIEGCGEEASGUEIAW?U@_@@"
                                            },
                                            "start_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1155
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 136
                                            },
                                            "end_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Pratt St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "abxnF`gtrMAmGIgG?K?QASKkIIiGEoDCqAKmGEwGA]CqAEmDCkC?OC}AAsAAu@?O"
                                            },
                                            "start_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 434
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Gay St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ydxnFhsqrMeCHuA@cDJiFTaDL"
                                            },
                                            "start_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 277
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 52
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "e}xnFduqrMHpEBJF`@@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "MD-295 N and Baltimore-Washington Pkwy",
                            "warnings": [],
                            "waypoint_order": [0]
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].legs.length.should.equal(2);
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                waypoints: 'Arlington, VA',
                key: 'KEY'
            });
        });
    });

    it("should optimize waypoints", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&waypoints=optimize%3Atrue%7CAlexandria%2C%20VA%7CArlington%2C%20VA')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2905919,
                                    "lng": -76.6087704
                                },
                                "southwest": {
                                    "lat": 38.8039323,
                                    "lng": -77.10675959999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "5.1 mi",
                                        "value": 8269
                                    },
                                    "duration": {
                                        "text": "12 mins",
                                        "value": 735
                                    },
                                    "end_address": "Arlington, VA, USA",
                                    "end_location": {
                                        "lat": 38.8799318,
                                        "lng": -77.10675959999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 185
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 22
                                            },
                                            "end_location": {
                                                "lat": 38.9072574,
                                                "lng": -77.0369797
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAMCEGICEACAAEGCACAAAGCA?A?A@IFEDEFCDCFCDAJAH?N@n@@Dd@f@"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "174 ft",
                                                "value": 53
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.9069418,
                                                "lng": -77.03741939999999
                                            },
                                            "html_instructions": "Exit the traffic circle onto \u003cb\u003eScott Cir NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "kanlFbheuMD@x@tA"
                                            },
                                            "start_location": {
                                                "lat": 38.9072574,
                                                "lng": -77.0369797
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 343
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 41
                                            },
                                            "end_location": {
                                                "lat": 38.905678,
                                                "lng": -77.04103719999999
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "k_nlFzjeuMPn@Pn@j@vBnAnFLd@Jd@Ld@H\\DPRv@H\\DR"
                                            },
                                            "start_location": {
                                                "lat": 38.9069418,
                                                "lng": -77.03741939999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 376
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 56
                                            },
                                            "end_location": {
                                                "lat": 38.9026467,
                                                "lng": -77.0395137
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eConnecticut Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "owmlFnafuMHZtDeBbEqBrCsA\\QHCDCFADADABA"
                                            },
                                            "start_location": {
                                                "lat": 38.905678,
                                                "lng": -77.04103719999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 620
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 80
                                            },
                                            "end_location": {
                                                "lat": 38.8970753,
                                                "lng": -77.0394534
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003e17th St NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "qdmlF|weuMV?X?jA?nB?XAXCj@Ir@?dA?^?X?rC?J@H?J@Z?j@?f@?x@?`E?t@?"
                                            },
                                            "start_location": {
                                                "lat": 38.9026467,
                                                "lng": -77.0395137
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 253
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.8959836,
                                                "lng": -77.0417212
                                            },
                                            "html_instructions": "Slight \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eNew York Ave NW\u003c/b\u003e",
                                            "maneuver": "turn-slight-right",
                                            "polyline": {
                                                "points": "wallFpweuMn@TZ?B@B?B?@@B@B@@BBB@BHb@Pf@BL@JBNBNbAnF?D@F?F?F@F"
                                            },
                                            "start_location": {
                                                "lat": 38.8970753,
                                                "lng": -77.0394534
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 224
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.8959863,
                                                "lng": -77.04431319999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eE St NW/Rawlings Square NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow E St NW\u003c/div\u003e",
                                            "polyline": {
                                                "points": "{zklFvefuM?rFAhB?fD"
                                            },
                                            "start_location": {
                                                "lat": 38.8959836,
                                                "lng": -77.0417212
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 575
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 47
                                            },
                                            "end_location": {
                                                "lat": 38.8959126,
                                                "lng": -77.0509225
                                            },
                                            "html_instructions": "Slight \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Street Expressway\u003c/b\u003e",
                                            "maneuver": "turn-slight-left",
                                            "polyline": {
                                                "points": "}zklF|ufuMJvBVrCB`@BX@\\BX@Z?XAd@Ch@Aj@A\\Ab@AD?b@AN?@A^?d@AJEz@Ev@AT?\\An@?nI"
                                            },
                                            "start_location": {
                                                "lat": 38.8959863,
                                                "lng": -77.04431319999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1197
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 69
                                            },
                                            "end_location": {
                                                "lat": 38.8919357,
                                                "lng": -77.06218109999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork, follow signs for \u003cb\u003eInterstate 66 W\u003c/b\u003e and merge onto \u003cb\u003eI-66 W\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eParts of this road are HOV only Mon–Fri 4:00 – 7:00 pm\u003c/div\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "mzklFf_huM@xA?v@A^?b@Ad@?b@Af@EzB?FAH?H@H?F@JBH@H@HBJDHBJDJFJDFFHFFFHHFFDFDFDHBFBF@HBH@J@H@H?J@L@R?P@XBJ@H@HBJ@NBLBJBJBJDFBF@FDHBFDHDLFJHXXFFDHJHd@l@FPDLDJBNDNDRDVBR@LBPlDb_@\\vD"
                                            },
                                            "start_location": {
                                                "lat": 38.8959126,
                                                "lng": -77.0509225
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "463 ft",
                                                "value": 141
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 8
                                            },
                                            "end_location": {
                                                "lat": 38.8919504,
                                                "lng": -77.0637985
                                            },
                                            "html_instructions": "Take the \u003cb\u003eU.S. 50 W/Arlington Boulevard W/George Washington Memorial Parkway\u003c/b\u003e exit\u003cdiv style=\"font-size:0.9em\"\u003eEntering Virginia\u003c/div\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "saklFrejuMDjA@P@J@R@R?N?V?XATATANCXEX"
                                            },
                                            "start_location": {
                                                "lat": 38.8919357,
                                                "lng": -77.06218109999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 475
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 28
                                            },
                                            "end_location": {
                                                "lat": 38.89096079999999,
                                                "lng": -77.06860230000001
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e, follow signs for \u003cb\u003eUS 50 W\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "uaklFvojuMKr@CNELAJCJANALALAN?L?N?N@P?@@NBNBPDNBNDNDLFNHLDHDHFHDFFH`AdAHHHHHJFHFJHJDJHNDJDLDNDLBLBNBLBR@L@N?J@L?N?L?PALALCRAPENCNADMl@"
                                            },
                                            "start_location": {
                                                "lat": 38.8919504,
                                                "lng": -77.0637985
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.9 mi",
                                                "value": 1438
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 73
                                            },
                                            "end_location": {
                                                "lat": 38.8868996,
                                                "lng": -77.08245239999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eUS-50 W/Arlington Blvd\u003c/b\u003e",
                                            "polyline": {
                                                "points": "o{jlFvmkuMIRKRMVMTMTMTKTMVKVIVKVIRI\\GV_@`BCNKp@Iz@ARCZALAjA?hADt@Dn@LhA?JJf@J^J^FXPj@`AnD@BRv@h@nBr@jCZl@Tb@Tb@T\\T^TVTXTXTTJLZ\\jBvBjAvAf@n@jBtBZ^HJV^\\n@Tj@Tv@Ln@Jj@TzANx@"
                                            },
                                            "start_location": {
                                                "lat": 38.89096079999999,
                                                "lng": -77.06860230000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "56 ft",
                                                "value": 17
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 2
                                            },
                                            "end_location": {
                                                "lat": 38.8869518,
                                                "lng": -77.08263359999999
                                            },
                                            "html_instructions": "Take the exit toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "cbjlFhdnuMIZ?D?@"
                                            },
                                            "start_location": {
                                                "lat": 38.8868996,
                                                "lng": -77.08245239999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "223 ft",
                                                "value": 68
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 38.886691,
                                                "lng": -77.0833427
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork, follow signs for \u003cb\u003eHwy 237 W\u003c/b\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "mbjlFlenuMb@`BNj@"
                                            },
                                            "start_location": {
                                                "lat": 38.8869518,
                                                "lng": -77.08263359999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 mi",
                                                "value": 226
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 22
                                            },
                                            "end_location": {
                                                "lat": 38.8851616,
                                                "lng": -77.0849996
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e at the fork to continue toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "fork-right",
                                            "polyline": {
                                                "points": "y`jlFzinuMPf@`@v@NT@@RZ`@f@v@p@t@f@p@d@BBPJ"
                                            },
                                            "start_location": {
                                                "lat": 38.886691,
                                                "lng": -77.0833427
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "449 ft",
                                                "value": 137
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 11
                                            },
                                            "end_location": {
                                                "lat": 38.8846786,
                                                "lng": -77.08636109999999
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e at the fork to continue toward \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "maneuver": "fork-right",
                                            "polyline": {
                                                "points": "gwilFftnuMNJZ\\R`@FTFVBX@RBX@^Bl@"
                                            },
                                            "start_location": {
                                                "lat": 38.8851616,
                                                "lng": -77.0849996
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1058
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 114
                                            },
                                            "end_location": {
                                                "lat": 38.8845212,
                                                "lng": -77.0985608
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eHwy 237 W/VA-237 W/10th St N\u003c/b\u003e",
                                            "polyline": {
                                                "points": "gtilFv|nuMDdA@lAB`CBfEBvEBrDBnA?vBB`E?d@?b@?p@?p@BfD@d@?j@@dB?f@FfGBjEEp@AVK~@"
                                            },
                                            "start_location": {
                                                "lat": 38.8846786,
                                                "lng": -77.08636109999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 883
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 106
                                            },
                                            "end_location": {
                                                "lat": 38.8799318,
                                                "lng": -77.10675959999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eWilson Blvd\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "gsilF~hquMRTj@f@VVZ^bBlBFHPZ`@~@t@nBn@vAh@rAn@nBPd@T~@fAhCnAjCpEhK`@dAHh@BZ"
                                            },
                                            "start_location": {
                                                "lat": 38.8845212,
                                                "lng": -77.0985608
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            },
                                {
                                    "distance": {
                                        "text": "9.5 mi",
                                        "value": 15254
                                    },
                                    "duration": {
                                        "text": "18 mins",
                                        "value": 1068
                                    },
                                    "end_address": "Alexandria, VA, USA",
                                    "end_location": {
                                        "lat": 38.804842,
                                        "lng": -77.0469806
                                    },
                                    "start_address": "Arlington, VA, USA",
                                    "start_location": {
                                        "lat": 38.8799318,
                                        "lng": -77.10675959999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.5 mi",
                                                "value": 839
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 87
                                            },
                                            "end_location": {
                                                "lat": 38.8842008,
                                                "lng": -77.0988734
                                            },
                                            "html_instructions": "Head \u003cb\u003eeast\u003c/b\u003e on \u003cb\u003eWilson Blvd\u003c/b\u003e toward \u003cb\u003eN Pollard St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "qvhlFf|ruMC[Ii@a@eAqEiKoAkCgAiCU_AQe@o@oBi@sAo@wAu@oBa@_AQ[GIcBmB[_@WW"
                                            },
                                            "start_location": {
                                                "lat": 38.8799318,
                                                "lng": -77.10675959999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 515
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 53
                                            },
                                            "end_location": {
                                                "lat": 38.8844372,
                                                "lng": -77.09296920000001
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003e10th St N\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "gqilF|jquMGSCKEKAGAGIa@BW?W?W?c@EiEEgGAwDCoE?k@AkA"
                                            },
                                            "start_location": {
                                                "lat": 38.8842008,
                                                "lng": -77.0988734
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3035
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 194
                                            },
                                            "end_location": {
                                                "lat": 38.8651439,
                                                "lng": -77.06979799999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eWashington Blvd\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "wrilF`fpuMRSNMRQn@i@HILIPI|BmAd@Y`Ag@h@Y~EkC~Ay@JI`CmAp@e@`@[|@}@b@k@t@mA~@wArBcD`A}AhBsChAgBf@y@zDgGh@{@@ADIJOBEb@o@NUj@w@Z_@NUb@c@b@]n@e@bAo@RKbCyAh@[^Ud@UxAaAlAu@bBoAv@m@n@k@rAiA~AcBhAmAdAqAz@gAv@eAZc@r@eAd@u@h@}@NWXi@Zi@n@mAN]n@{At@sBXu@Tu@@C@CBIPo@XeAR_ANu@Jq@LsAFk@N{ATcCH_ADk@"
                                            },
                                            "start_location": {
                                                "lat": 38.8844372,
                                                "lng": -77.09296920000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.5 mi",
                                                "value": 2385
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 122
                                            },
                                            "end_location": {
                                                "lat": 38.8703337,
                                                "lng": -77.0459805
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eI-395 N\u003c/b\u003e via the ramp to \u003cb\u003eWashington\u003c/b\u003e",
                                            "polyline": {
                                                "points": "czelFfukuMB]@YB[B]Di@Bc@BWFs@?IBYB[?A@[@]?OAq@?IAA?MEc@CSAMMq@U}@c@_BcBmFGEACCEk@kBaA{C_@oACEEOACGWAAI_@GYG_@CWCUAY?OAW?Y@e@@[LmCDs@BQD]Lo@?E@A?EFYBM?C?C?G?Kl@sDJu@Lu@V}Af@_DD]DYD_@BYHu@RqBJ}AFiA@U@Y@O@sA?O?q@Ae@Cs@C_@Ei@Ec@O_BO_AAEAC?AWiAEWAA?AS}@U{@CGCICIAEOg@c@{AwAeDkAoBmAsA][YWa@[k@]a@UEC]O{DiBSMUOWQWQSOQO"
                                            },
                                            "start_location": {
                                                "lat": 38.8651439,
                                                "lng": -77.06979799999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 371
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 23
                                            },
                                            "end_location": {
                                                "lat": 38.8710091,
                                                "lng": -77.04193840000001
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e10A-10B\u003c/b\u003e for \u003cb\u003eGeorge Washington Memorial Parkway S\u003c/b\u003e toward \u003cb\u003eReagan National Airport\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "qzflFj`guM[y@MQKOIOGMEMEKEMCOCMCOAOCM?Kg@iJEaA?_@@UNkA"
                                            },
                                            "start_location": {
                                                "lat": 38.8703337,
                                                "lng": -77.0459805
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.8 mi",
                                                "value": 7680
                                            },
                                            "duration": {
                                                "text": "8 mins",
                                                "value": 490
                                            },
                                            "end_location": {
                                                "lat": 38.8050703,
                                                "lng": -77.0470725
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eGeorge Washington Memorial Pkwy\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8710091,
                                                "lng": -77.04193840000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "299 ft",
                                                "value": 91
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 21
                                            },
                                            "end_location": {
                                                "lat": 38.8052016,
                                                "lng": -77.0481125
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eKing St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "ubzkFdgguMMlBK`B"
                                            },
                                            "start_location": {
                                                "lat": 38.8050703,
                                                "lng": -77.0470725
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "420 ft",
                                                "value": 128
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 25
                                            },
                                            "end_location": {
                                                "lat": 38.8040617,
                                                "lng": -77.048355
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e at the 1st cross street onto \u003cb\u003eS Columbus St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "oczkFtmguMbFp@"
                                            },
                                            "start_location": {
                                                "lat": 38.8052016,
                                                "lng": -77.0481125
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "302 ft",
                                                "value": 92
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 29
                                            },
                                            "end_location": {
                                                "lat": 38.8039323,
                                                "lng": -77.0473016
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e at the 1st cross street onto \u003cb\u003ePrince St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "k|ykFfoguMNiCHiA"
                                            },
                                            "start_location": {
                                                "lat": 38.8040617,
                                                "lng": -77.048355
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "387 ft",
                                                "value": 118
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 24
                                            },
                                            "end_location": {
                                                "lat": 38.804842,
                                                "lng": -77.0469806
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e at the 1st cross street onto \u003cb\u003eGeorge Washington Memorial Pkwy/S Washington St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "q{ykFrhguMB][E}C["
                                            },
                                            "start_location": {
                                                "lat": 38.8039323,
                                                "lng": -77.0473016
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            },
                                {
                                    "distance": {
                                        "text": "46.2 mi",
                                        "value": 74277
                                    },
                                    "duration": {
                                        "text": "59 mins",
                                        "value": 3517
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Alexandria, VA, USA",
                                    "start_location": {
                                        "lat": 38.804842,
                                        "lng": -77.0469806
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "4.8 mi",
                                                "value": 7694
                                            },
                                            "duration": {
                                                "text": "8 mins",
                                                "value": 485
                                            },
                                            "end_location": {
                                                "lat": 38.8708752,
                                                "lng": -77.04154849999999
                                            },
                                            "html_instructions": "Head \u003cb\u003enorth\u003c/b\u003e on \u003cb\u003eGeorge Washington Memorial Pkwy/S Washington St\u003c/b\u003e toward \u003cb\u003eKing St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow George Washington Memorial Pkwy\u003c/div\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.804842,
                                                "lng": -77.0469806
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.6 mi",
                                                "value": 1008
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 60
                                            },
                                            "end_location": {
                                                "lat": 38.8782794,
                                                "lng": -77.03721899999999
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eI-395 N\u003c/b\u003e via the ramp to \u003cb\u003eWashington\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering District of Columbia\u003c/div\u003e",
                                            "polyline": {
                                                "points": "_~flFtdfuMMDYZk@f@q@f@gAz@_@XIFKDIDI@IBC?E?C?EAE?CAMEIGKIKGEAOAAAwAsAmAkAmAkAa@]qBsB]]]]qEgE_@]uCmCCEy@u@q@o@KIY[SQGEg@g@QOGI"
                                            },
                                            "start_location": {
                                                "lat": 38.8708752,
                                                "lng": -77.04154849999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.1 mi",
                                                "value": 1786
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 105
                                            },
                                            "end_location": {
                                                "lat": 38.8823579,
                                                "lng": -77.0181583
                                            },
                                            "html_instructions": "Keep \u003cb\u003eright\u003c/b\u003e to stay on \u003cb\u003eI-395 N\u003c/b\u003e",
                                            "maneuver": "keep-right",
                                            "polyline": {
                                                "points": "glhlFrieuMKUEIGKGKMUMWKYKWK_@GUGYE]E]CUCWAWAU?[A]?_@?]?a@?iA?]AYA[AWC]Ea@Ea@COEOKe@Og@Ma@KWUg@IMi@}@EEc@q@ACSYSYCCEIMOOSYc@[g@s@eAS[Wa@Ye@Wg@MYISISM]Qg@Mc@IU?AAEGSAEI_@Q}@?CAIEYAA?CCSCQCWE_@?C?AAQAKC_@?YAWA]?i@?K?C?A?C?S?S?E?[?}FAyAAE?_BAy@Co@EaE?A?[CsBAe@?c@@gD@iCAqDA_A"
                                            },
                                            "start_location": {
                                                "lat": 38.8782794,
                                                "lng": -77.03721899999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3059
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 151
                                            },
                                            "end_location": {
                                                "lat": 38.8721,
                                                "lng": -76.9899106
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e at the fork to continue on \u003cb\u003eI-695\u003c/b\u003e",
                                            "maneuver": "fork-left",
                                            "polyline": {
                                                "points": "weilFnrauM?gA?m@?e@?yKAwF?k@?A?A?uD@KDqA@MJaBH}@?C?AHm@Hm@Nu@xAqHHe@DS?CLq@b@cCb@aCXsBFq@B_@Bq@BwAFwJBi@Bu@Bk@Fk@Hi@He@Ny@Jk@?A@ED[r@_EHc@F[?C^oBP_AX{ATmA?C@?Ny@`AqFN}@H{@Jm@p@kF~@gHv@}FZ_BT_APa@R[V[ZY^Q`@M^Gp@CrADxCRVDP?p@Dp@BXBV@X?XAp@I`@EVCb@KDCDAx@a@PKbAu@jB}AXU"
                                            },
                                            "start_location": {
                                                "lat": 38.8823579,
                                                "lng": -77.0181583
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 561
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 31
                                            },
                                            "end_location": {
                                                "lat": 38.8705815,
                                                "lng": -76.98483779999999
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e2B\u003c/b\u003e for \u003cb\u003eState Hwy 295 N\u003c/b\u003e toward \u003cb\u003eUS-50 S\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "seglF|a|tMJ@B?D?FE`Ao@pAo@l@_@JIHGDCFIDCR[T]N]HSHYJ_@F[F[Hw@Dg@B]Bq@Ae@C{@Ck@Gi@Ii@GYEUa@}AIm@Ea@"
                                            },
                                            "start_location": {
                                                "lat": 38.8721,
                                                "lng": -76.9899106
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "4.4 mi",
                                                "value": 7121
                                            },
                                            "duration": {
                                                "text": "6 mins",
                                                "value": 369
                                            },
                                            "end_location": {
                                                "lat": 38.9165922,
                                                "lng": -76.9323079
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eDistrict of Columbia Hwy 295/State Hwy 295\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.8705815,
                                                "lng": -76.98483779999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "18.7 mi",
                                                "value": 30169
                                            },
                                            "duration": {
                                                "text": "20 mins",
                                                "value": 1200
                                            },
                                            "end_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "html_instructions": "Keep \u003cb\u003eleft\u003c/b\u003e to continue on \u003cb\u003eBaltimore-Washington Pkwy\u003c/b\u003e, follow signs for \u003cb\u003eInterstate 95/Baltimore-Washington Parkway N/Baltimore\u003c/b\u003e",
                                            "maneuver": "keep-left",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 38.9165922,
                                                "lng": -76.9323079
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "12.0 mi",
                                                "value": 19233
                                            },
                                            "duration": {
                                                "text": "12 mins",
                                                "value": 726
                                            },
                                            "end_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMD-295 N/Baltimore-Washington Pkwy\u003c/b\u003e",
                                            "polyline": {
                                                "points": "POINTS"
                                            },
                                            "start_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.0 mi",
                                                "value": 1672
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 125
                                            },
                                            "end_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eBaltimore-Washington Pkwy/Russell St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow Baltimore-Washington Pkwy\u003c/div\u003e",
                                            "polyline": {
                                                "points": "ujunFxxurMEGCGUWyAsBMSwAkBuEqGoAcB_@e@w@{@{@{@ACAAcAy@MIUO[SYOOGWIOGGC_A]eC_AA?WKIE}@]}B_AkCw@m@UkCeAOG_@MEAQGQEWEA?OAOCA?c@G}@@aBBoFLwABy@BW?K?YA]KMEMGIEIGKKWWIICGIOWi@O]"
                                            },
                                            "start_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "354 ft",
                                                "value": 108
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 13
                                            },
                                            "end_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eS Paca St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "i|wnFthtrMMMGGIEGCGEEASGUEIAW?U@_@@"
                                            },
                                            "start_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 mi",
                                                "value": 1155
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 136
                                            },
                                            "end_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Pratt St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "abxnF`gtrMAmGIgG?K?QASKkIIiGEoDCqAKmGEwGA]CqAEmDCkC?OC}AAsAAu@?O"
                                            },
                                            "start_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 mi",
                                                "value": 434
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Gay St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ydxnFhsqrMeCHuA@cDJiFTaDL"
                                            },
                                            "start_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 mi",
                                                "value": 277
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 52
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "e}xnFduqrMHpEBJF`@@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "POINTS"
                            },
                            "summary": "MD-295 N and Baltimore-Washington Pkwy",
                            "warnings": [],
                            "waypoint_order": [1, 0]
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].legs.length.should.equal(3);
                msg.payload.routes[0].waypoint_order.should.eql([1, 0]);
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                waypoints: 'optimize:true|Alexandria, VA|Arlington, VA',
                key: 'KEY'
            });
        });
    });

    it("should return metric units", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&units=metric')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.2905919,
                                    "lng": -76.6086858
                                },
                                "southwest": {
                                    "lat": 38.9029101,
                                    "lng": -77.03690619999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "62.2 km",
                                        "value": 62187
                                    },
                                    "duration": {
                                        "text": "53 mins",
                                        "value": 3161
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.2904035,
                                        "lng": -76.61218579999999
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "56 m",
                                                "value": 56
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 6
                                            },
                                            "end_location": {
                                                "lat": 38.9070341,
                                                "lng": -77.0363313
                                            },
                                            "html_instructions": "Head \u003cb\u003esoutheast\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e toward \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "w`nlFtgeuMR[@EBI@M@O?MAMAM"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.2 km",
                                                "value": 1167
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 165
                                            },
                                            "end_location": {
                                                "lat": 38.9029535,
                                                "lng": -77.0239636
                                            },
                                            "html_instructions": "Exit the traffic circle onto \u003cb\u003eMassachusetts Ave NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "}_nlF`deuMCEDS@K?K@I@K@K@IBKBMHo@@C@GT_AXs@FUJc@Ni@\\mAJo@jAyEzAoGtAkFRy@Je@DU@GBMDOB]BIPs@t@wC\\wAj@{Bf@uB^yAt@sCd@kBR}@BG@G@I@K?I@K?K@O"
                                            },
                                            "start_location": {
                                                "lat": 38.9070341,
                                                "lng": -77.0363313
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 157
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 20
                                            },
                                            "end_location": {
                                                "lat": 38.9029543,
                                                "lng": -77.0221461
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMt Vernon Pl NW\u003c/b\u003e",
                                            "polyline": {
                                                "points": "mfmlFvvbuM?Q?U?aI"
                                            },
                                            "start_location": {
                                                "lat": 38.9029535,
                                                "lng": -77.0239636
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "7.7 km",
                                                "value": 7657
                                            },
                                            "duration": {
                                                "text": "11 mins",
                                                "value": 653
                                            },
                                            "end_location": {
                                                "lat": 38.9185504,
                                                "lng": -76.93857989999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eNew York Ave NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eEntering Maryland\u003c/div\u003e",
                                            "polyline": {
                                                "points": "mfmlFlkbuMFMBg@Eu@CQGUkBoHi@mB]uA]wAEQwB}I_@wAUcAo@iC[oAy@cDWaAOu@sAkFkCkKi@eCKWAKI[AGOm@GSOo@{BiJGSU_Aa@_Ba@cBi@uBQu@Om@eBeHm@aCMe@Mg@YkA_BuGYg@s@wCo@oCKe@Qu@i@uB[qA]uAmB{HWcAa@cBi@sB?AAC?A?AAAACAGCIAEAGCGEQCMOy@EYCOm@eCk@aCMc@_A{Dw@aDGYu@_D[yA{DyOmCwKESi@mBGYYiAESWiAc@aBCOE]Gk@Ci@A[AQAo@Aw@?u@Aw@AuA?Q?mA?iACgB?iECkDCwB@eA@cB?C@y@AiECi@CyEEwBEaD?a@?e@@UFqGPaIRoHJyDJ_FDgBF}FFkEBsABo@?yA?qAAw@IeAG]I]G[y@aCi@yAUk@]{@i@wAe@mAISCGCEAEM]Q_@Oa@m@eB[eAUiAKq@IkAI{ACu@?_BBaABk@@SFy@b@eEbA{Kf@_Gl@}GL_BFgB@gA@qC?iAEiAEkAE{@Eo@SiBUuBQ}A[eC"
                                            },
                                            "start_location": {
                                                "lat": 38.9029543,
                                                "lng": -77.0221461
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.9 km",
                                                "value": 882
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 35
                                            },
                                            "end_location": {
                                                "lat": 38.9233845,
                                                "lng": -76.93080519999999
                                            },
                                            "html_instructions": "Take the \u003cb\u003eBalt-Wash Pkwy\u003c/b\u003e ramp on the \u003cb\u003eleft\u003c/b\u003e to \u003cb\u003eBaltimore\u003c/b\u003e",
                                            "polyline": {
                                                "points": "}gplFbartMIWCMGYg@cDWsAUeAYkA]gAe@sAMa@o@yAYk@[o@i@}@q@gAeAyAUW_@a@q@w@cEeEoAoAw@u@_@]GGCCCEAE"
                                            },
                                            "start_location": {
                                                "lat": 38.9185504,
                                                "lng": -76.93857989999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "29.4 km",
                                                "value": 29389
                                            },
                                            "duration": {
                                                "text": "19 mins",
                                                "value": 1166
                                            },
                                            "end_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "html_instructions": "Merge onto \u003cb\u003eBaltimore-Washington Pkwy\u003c/b\u003e",
                                            "maneuver": "merge",
                                            "polyline": {
                                                "points": "cfqlFppptMwBcBcAw@_@WSMSOu@e@cC_BoAy@wBsASMUOWO{AcAiCeB{B{AiAu@{AgAk@e@YW][YYi@i@Y]OS_@e@U]]g@k@{@c@y@m@mAg@kAYs@k@_Be@_BeAwDOm@y@sCq@sBOa@Qc@Yu@_@w@c@}@Q]KOoB{CgAwAAAQUAAAA}AsA}AmAmAw@}BcAsFaCc@ScBeAAAOKCAAAYUo@g@}@s@s@q@]a@a@c@c@g@a@c@eAiASS]c@_AeAk@m@UWgAcAaBuA]UWSm@a@MIWM[QUMYMYKi@Sq@Uc@O_@K]Ie@M]G]Gw@Mc@Ek@Gg@Ce@C_@Ck@AW?U?[?g@@y@Bs@BaABaADW@U@S?W@sAD{@@o@@s@Au@Aa@Cg@Ca@Ce@Eu@Kg@G_AQy@S[GOESGWIMEWK_@MWKYKi@UYOe@We@UYQ_Am@s@g@y@i@_@W[Uo@c@uAcAiAu@w@g@k@]_@SSIQI[M}As@aB]i@Oq@Mu@MsAOQAaAEo@CwAEkAGA?oBGi@Ea@Cs@Ei@Gk@Ge@Ii@MqAYyBq@wAg@gAa@k@SOGs@_@QI_@SWO]Ue@[e@[}@o@WQc@Ye@_@aBkAyAcAwA}@g@[}@g@o@_@oAo@gB{@g@UmGiCWMe@Sg@WSKg@YWOc@WgAu@QMy@k@e@]QMu@m@u@s@u@u@{B}Bg@g@]_@]]wAwAc@_@e@a@c@_@kA}@w@i@a@[{@g@UMeAk@cBy@m@Wm@UiA_@a@OoA_@kHkBoA[gEgAuA_@kBm@eBk@iBo@}@]}@_@{@]y@_@kAk@YQo@a@s@_@SM{@i@sA}@e@[yAcA{@u@qBgBmAoA_CiCcBoBKO]c@?AIK]e@wCcEU]MSg@u@w@sAm@cAo@mAc@_Ag@kAMYmBkFGUAA?CEKEOCKAACISw@o@kCuA_HeDyQm@kDIa@iAiFw@eCaA_DACu@wBi@wAy@sBo@wAqAqCwAmCu@kAi@y@[_@_B{Bo@w@gCkCeB{Ac@[a@[q@c@eAm@aAk@KGOIc@SoAm@_@KUG}@_@cAa@kBq@a@OKCGCCAQG_A[yAa@qDaAa@MaFcAeCi@yCq@gDq@mCm@_Ce@gCi@}@Q{GyA_GmA{FuAyCw@qCw@cAWmA]AAA?A?sAa@sFcBgA_@qBq@uAc@cBo@gHaCeBo@aEwAwBu@_Bo@uDuAeBo@aBo@k@SmCgAs@WmAc@aHoCaDqA{@]c@Q]QkAg@{FaCuDcBa@Q_@UgD{AsGuCcFcCsBaAkDeBqDkBaCmA_By@{@e@yAy@gAo@oFyC}KgGwBkAwCwAqBaAeEmBqCiAgA_@OGs@Y{@[cAa@}@]{EkBwAi@kCcAaAa@k@UGCGCo@Wa@OeAc@mCaA{@[u@YA?i@UeCaAyBy@_Bo@q@W_@OoAq@eBs@QKqAk@aD_Bw@_@qCuAoHcEsBmA_CyAgAq@}B{AcM}IcEyCqI}GgFkEwGaGaEyDcFaFaAeAgAiAqB}BiB}BsAiBmBoCgMqRoDsF_FqHiDaF{@qAo@{@_AkA_C{CmDiEcCwCgAoAq@w@yCaDaEgEgDgDsCwCkBkBcCaC_BcBuAwAcBkBiDyD{@cAgAqAqEyFeCcDwAmBoAeBoF_IqCkEs@kAuA}BOWgAgBiAkBgAiByAaCwA}BeBuCgCyDiD_F{B_DoK_NaJiLUWOS}C_E}BaD{BcDoDyFwA_CqBiDEGaAcBS_@Ua@y@{Au@qA_CcEcByCu@qAk@cA{AgCOWe@u@m@_A{@sAo@cAw@gAu@gAw@iAkBiCcAqAu@_Ay@cAi@o@g@m@}@cA}AiBsCyCgBiBkCeCw@s@cA}@cDqCoB_BmBwAiA{@wB{AqBuAgAu@kAw@gC_BeEeCeCwA{@g@g@WaB}@oAo@oAo@cBy@cBy@{@c@s@]q@Wg@WqAk@yBcA}CuAcAa@{@]_Bm@qDuAyGeCsC_A"
                                            },
                                            "start_location": {
                                                "lat": 38.9233845,
                                                "lng": -76.93080519999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "19.2 km",
                                                "value": 19233
                                            },
                                            "duration": {
                                                "text": "12 mins",
                                                "value": 726
                                            },
                                            "end_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eMD-295 N/Baltimore-Washington Pkwy\u003c/b\u003e",
                                            "polyline": {
                                                "points": "_r{mFxgnsMiKqDaCu@iCw@g@QeA_@wBy@wG_CaFgBk@SkC_A}By@_A]mAi@s@]o@Y{@e@y@e@e@Ys@c@UOg@]MKgBqAa@[_@[cA}@_DcDiOoPgPuQcGwG}BiCu@w@mBuB_AgA}PiReBmBeAgAa@a@KKUUuAsAs@q@aDuC_A{@m@i@eA}@eA_A{AqAuAmAoAgA}@w@a@_@m@g@_@]eA}@aDoCsBiBiEuD}BqB_HcGkKcJcA{@USwAmAwAoAkBaBeB{AcA{@y@s@a@_@aAy@][WUUSeYqVeGmFOMMK_@]CCAAc@]oBcBqAkAg@c@mC}BkBaBgAaAgB}AyAoAyAoAWUo@k@cA}@i@e@_B}AY[u@w@u@}@]a@OOe@o@g@q@OSSYg@u@e@q@MWi@y@{@}Aw@yAq@uAm@sAWs@Wg@]_Ai@{AWs@]eAMc@KYKa@K[Ke@Oe@GQCI?AK_@eCcJs@cC[kAGSGQ[gAWcASq@Oi@Qo@Yy@K]Qm@GWEQCMGYQo@GWOi@K[Ok@Ok@Oi@COEOCKEMGSCKCGAGEMKYEO_@kAm@wA[u@Yo@e@}@i@cA]k@KOMSGKQYKOU[Y]UYsA{AuAqAcA{@u@k@uB{AMQIIMMIGA?CCCCGEMMe@c@]_@_@a@]e@q@y@GKECEEGIQWYa@U]IMCCe@q@{@qAe@u@cAyA_B_C}AyBwAyBeBeCu@oAy@qAu@kAu@qA_AmBYa@e@_Aq@cBg@uAg@wAc@yAa@wAc@kBEQAGeHoYaA{DkBoHuEoRcGuUIe@GUAS_@_BYkAQq@WgA}AqG}CiMiByGcA_Do@aBSe@g@kA{@eBc@{@O]m@gASUU]i@y@U[_@i@SUIKSW}@iAiBmBWY_DoCiBqAqAs@_A_@iA[QEeASOCqBSqCW_AIeCQuCSqEa@iDWi@E}BUu@GA?C?e@EA?A?IA{AKmAI}BQkCSy@GiDY{BQyAMsCWyCWyCUuCQuCQuCMuCKwCQyCYiAQiASmBg@k@S?Ag@Q{@a@u@a@y@g@]Us@e@m@g@s@m@e@e@o@s@W[m@s@u@cA_AoAaAsAa@o@SU_AuA{@mAw@iA_@k@W_@SYOSqJuN}@oA[c@eFkHy@{@kAcAu@a@_Ac@oAa@wAUuBQcF_@{CSe@C}CSmGg@QAw@GeBOo@EG?A?A?aBKq@Cw@AyCEeBCqCIQCK@W?E?aCKkAAuAIg@CWE[E[Go@OUI[Ic@Oy@a@o@_@u@k@OOCCEG][KKGGAAEEACA??ACCKKOSAACC[c@?AAAEEUYe@m@]_@CCAAACA?WYeL{N"
                                            },
                                            "start_location": {
                                                "lat": 39.1403167,
                                                "lng": -76.7553332
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.7 km",
                                                "value": 1672
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 125
                                            },
                                            "end_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eBaltimore-Washington Pkwy/Russell St\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eContinue to follow Baltimore-Washington Pkwy\u003c/div\u003e",
                                            "polyline": {
                                                "points": "ujunFxxurMEGCGUWyAsBMSwAkBuEqGoAcB_@e@w@{@{@{@ACAAcAy@MIUO[SYOOGWIOGGC_A]eC_AA?WKIE}@]}B_AkCw@m@UkCeAOG_@MEAQGQEWEA?OAOCA?c@G}@@aBBoFLwABy@BW?K?YA]KMEMGIEIGKKWWIICGIOWi@O]"
                                            },
                                            "start_location": {
                                                "lat": 39.27227389999999,
                                                "lng": -76.63005249999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 km",
                                                "value": 108
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 13
                                            },
                                            "end_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eS Paca St\u003c/b\u003e",
                                            "polyline": {
                                                "points": "i|wnFthtrMMMGGIEGCGEEASGUEIAW?U@_@@"
                                            },
                                            "start_location": {
                                                "lat": 39.2853338,
                                                "lng": -76.622349
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.2 km",
                                                "value": 1155
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 136
                                            },
                                            "end_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e onto \u003cb\u003eW Pratt St\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "abxnF`gtrMAmGIgG?K?QASKkIIiGEoDCqAKmGEwGA]CqAEmDCkC?OC}AAsAAu@?O"
                                            },
                                            "start_location": {
                                                "lat": 39.2862516,
                                                "lng": -76.62209059999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 km",
                                                "value": 434
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 64
                                            },
                                            "end_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eS Gay St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "ydxnFhsqrMeCHuA@cDJiFTaDL"
                                            },
                                            "start_location": {
                                                "lat": 39.2866929,
                                                "lng": -76.6086858
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.3 km",
                                                "value": 277
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 52
                                            },
                                            "end_location": {
                                                "lat": 39.2904035,
                                                "lng": -76.61218579999999
                                            },
                                            "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eE Fayette St\u003c/b\u003e",
                                            "maneuver": "turn-left",
                                            "polyline": {
                                                "points": "e}xnFduqrMHpEBJF`@@RDbCFvE?L?@"
                                            },
                                            "start_location": {
                                                "lat": 39.2905919,
                                                "lng": -76.6089855
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "w`nlFtgeuMZy@Ay@J}ARmAx@qCvI{]v@}DvHyZLwA?g@?aIFMA}AKg@qEkQsDkOwLsf@qM{h@cB{G_BuGYg@cBgHcBcHeEyPq@kCk@sC_VyaAeAyEOcCGuMKuQDgFSeYXsQ^iN`@qWFoHK}BQ{@aCcHwBuFy@sBiAkDa@{BSgDCuCP{D|D_c@TgEByEQ{GaAmJq@eEoBiKaCwGqCaFmDkEkJiJQWoFaE}GoEeR}L_EaDmBuB_CgDsCgGgDeLmCmIoBiEeEeGsBmBkDeCqJeEiC{AUO{DcDeCqCwDgEaAeAiDyCqBuAcB{@yCeAaCk@eDc@yCMcJRmILaDMcEk@wEsAuB}@eDmBqLeIqBeAyBaAkCm@mEm@uGW}DQoD_@{Bg@qEyAwD}AiG}DeGiEmFaDwDkBuH_DyBeAkDwBcCeByMsMyD_DkD{BeGsCgN{DyMqDkIyC{E{BsDyBoGsE_EwDcFyFs@aAyE{G}D{GgEqK_@oAcAcE{FyZw@mEaCoJyB{GeFuLmCyEeAyAoCsDmFgF}DiCaCqAcEaB}EgB}Ai@kGcBcGqAuQ{DaR{D{NcDkHoBuCw@qKeDsQgGi\\wLqYgL_P_H_UkKsQaJ}HiE}[eQwHoDyEiBcE_B}NwFcLmEoPoGgFaC}LaGkR}KaQyLuOwL_OmMeL{KeJkKaEyFwReZuNaTqNiQuMqNkPmPcMaN{MsPgDsEaKkOaFiIcIuMmFoIeH_KwWu\\{GaJkH}KqGuK_NcV_EuGyEgH}GeJiEeFqFcGsFoFoKcJaLeIaNsIkIuEgJsEwRyIgRgHiX_Ju_@aNqF_CoEiCsDkCeHyGueAgkAyEcFaIqHyPcO{{@yu@an@ki@mVcTeFoEyEwE}FuHyCaFoDwHwBwFcAeDeEiO{GeVkCyJWw@cCiGmDgGyCoDyCmCkDgCo@q@QMqBsB}AoBcCkDwQkXeDoFyAoCwAcDuC_JqIu]gSqx@s@oDaDwMgGcVsBaG{CsGgByCsBuCeE{EwDiD{DeCiC{@wAYsIy@wS_BmGi@}WqBaPsAwQ}@qHk@sCe@yC}@sE}BsDqC{CiDyEwGcH}JqTu[eC_CuBeAgDw@yIq@mRsAmIk@yO[_DKaFU}Bg@iD{AcCyBk@q@oQaU_PoTwB}BcCgB_HkCaBo@iGwByD{AgA_@{@MsBIcNXc@?w@Mo@[q@u@_AeBa@Wy@Qm@@_@@AmGIsGAe@_@wYWuSMgLCiC?OeCHyFLkKb@VrGLjJ"
                            },
                            "summary": "MD-295 N and Baltimore-Washington Pkwy",
                            "warnings": [],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].legs[0].distance.text.should.containEql('km');
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                units: 'metric',
                key: 'KEY'
            });
        });
    });

    it("should return metric units", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Madrid&destination=Toledo&region=es')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 40.4167511,
                                    "lng": -3.6922241
                                },
                                "southwest": {
                                    "lat": 39.8625777,
                                    "lng": -4.0273884
                                }
                            },
                            "copyrights": "Map data ©2015 Google, basado en BCN IGN España",
                            "legs": [
                                {
                                    "distance": {
                                        "text": "72.3 km",
                                        "value": 72349
                                    },
                                    "duration": {
                                        "text": "49 mins",
                                        "value": 2923
                                    },
                                    "end_address": "Toledo, Toledo, Spain",
                                    "end_location": {
                                        "lat": 39.8628115,
                                        "lng": -4.0273884
                                    },
                                    "start_address": "Madrid, Madrid, Spain",
                                    "start_location": {
                                        "lat": 40.4167158,
                                        "lng": -3.7037799
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.1 km",
                                                "value": 125
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 28
                                            },
                                            "end_location": {
                                                "lat": 40.4167429,
                                                "lng": -3.7023092
                                            },
                                            "html_instructions": "Head \u003cb\u003eeast\u003c/b\u003e on \u003cb\u003ePlaza Puerta del Sol\u003c/b\u003e toward \u003cb\u003eCalle de Carretas\u003c/b\u003e",
                                            "polyline": {
                                                "points": "o{tuFrkrUEy@?S?Q?g@@}C"
                                            },
                                            "start_location": {
                                                "lat": 40.4167158,
                                                "lng": -3.7037799
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 km",
                                                "value": 447
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 74
                                            },
                                            "end_location": {
                                                "lat": 40.416112,
                                                "lng": -3.6971516
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eCarrera de S. Jerónimo\u003c/b\u003e",
                                            "polyline": {
                                                "points": "s{tuFlbrULeCH}DB{@?YDwB?aD?[^_B\\mB\\iB"
                                            },
                                            "start_location": {
                                                "lat": 40.4167429,
                                                "lng": -3.7023092
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 229
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 50
                                            },
                                            "end_location": {
                                                "lat": 40.4155197,
                                                "lng": -3.694626399999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003ePlaza de las Cortes\u003c/b\u003e",
                                            "polyline": {
                                                "points": "uwtuFdbqUHa@RmAHc@RgALYv@mEKs@"
                                            },
                                            "start_location": {
                                                "lat": 40.416112,
                                                "lng": -3.6971516
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "26 m",
                                                "value": 26
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 3
                                            },
                                            "end_location": {
                                                "lat": 40.4153278,
                                                "lng": -3.694443
                                            },
                                            "html_instructions": "Turn \u003cb\u003eright\u003c/b\u003e to stay on \u003cb\u003ePlaza de las Cortes\u003c/b\u003e",
                                            "maneuver": "turn-right",
                                            "polyline": {
                                                "points": "_ttuFlrpUX[JI"
                                            },
                                            "start_location": {
                                                "lat": 40.4155197,
                                                "lng": -3.694626399999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.7 km",
                                                "value": 699
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 62
                                            },
                                            "end_location": {
                                                "lat": 40.4092673,
                                                "lng": -3.692322
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e1st\u003c/b\u003e exit onto \u003cb\u003ePaseo del Prado\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "yrtuFfqpUD@D?B?D?BADABCBCBCBCZE`@G^MfCu@zBs@nA[VGb@M\\KfCq@bAWvBc@HApEcA\\I`AS"
                                            },
                                            "start_location": {
                                                "lat": 40.4153278,
                                                "lng": -3.694443
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "36 m",
                                                "value": 36
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 4
                                            },
                                            "end_location": {
                                                "lat": 40.4089517,
                                                "lng": -3.6922241
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003ePlaza Emperador Carlos V\u003c/b\u003e",
                                            "polyline": {
                                                "points": "}lsuF~cpUh@MTE"
                                            },
                                            "start_location": {
                                                "lat": 40.4092673,
                                                "lng": -3.692322
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.1 km",
                                                "value": 107
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 10
                                            },
                                            "end_location": {
                                                "lat": 40.4081395,
                                                "lng": -3.6928509
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e1st\u003c/b\u003e exit and stay on \u003cb\u003ePlaza Emperador Carlos V\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "}jsuFjcpUBHDFFDDDFBFBF?H?B?r@p@n@d@"
                                            },
                                            "start_location": {
                                                "lat": 40.4089517,
                                                "lng": -3.6922241
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 206
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 19
                                            },
                                            "end_location": {
                                                "lat": 40.4065903,
                                                "lng": -3.694192
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003ePaseo de Santa María de la Cabeza\u003c/b\u003e",
                                            "polyline": {
                                                "points": "{esuFhgpUl@f@NNJFPLDBj@d@ZRLLRP`@ZfAbA"
                                            },
                                            "start_location": {
                                                "lat": 40.4081395,
                                                "lng": -3.6928509
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "3.1 km",
                                                "value": 3074
                                            },
                                            "duration": {
                                                "text": "3 mins",
                                                "value": 184
                                            },
                                            "end_location": {
                                                "lat": 40.3856274,
                                                "lng": -3.7171448
                                            },
                                            "html_instructions": "Continue straight to stay on \u003cb\u003ePaseo de Santa María de la Cabeza\u003c/b\u003e",
                                            "maneuver": "straight",
                                            "polyline": {
                                                "points": "e|ruFtopUtEhEfA~@|AvAlBjBHHj@b@hB|ANL^\\v@l@|@z@^T`@^XV`@^LJTV^Zr@j@JJDDRRj@d@@?FFd@b@^`@RRVVv@p@~@v@n@f@z@r@f@`@FFFDTTRTTRTTp@j@p@j@LLNLFFHH`A~@JHd@d@VTl@d@@?BDFFFDRRvCtCz@t@LJXXn@j@bAz@j@f@DD@?rCfC^ZTRVTFDDDtChCl@n@VZZ^PXZ`@Zh@Td@Rf@Th@Pf@Lb@^lAPl@fBdGJ^ZbAPp@Tt@Xv@Th@^v@R^\\j@b@l@X^f@j@vAzAbDdDxAxAxA|AjAnAvAvAPRRP"
                                            },
                                            "start_location": {
                                                "lat": 40.4065903,
                                                "lng": -3.694192
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 km",
                                                "value": 444
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 25
                                            },
                                            "end_location": {
                                                "lat": 40.381856,
                                                "lng": -3.718727899999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eCalle Princesa de Austria\u003c/b\u003e",
                                            "polyline": {
                                                "points": "eynuFb_uUPTDDPPVRZRd@TFBLDLD^HNFp@Pb@JbB^tCl@hATv@P\\Hh@P"
                                            },
                                            "start_location": {
                                                "lat": 40.3856274,
                                                "lng": -3.7171448
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "64.5 km",
                                                "value": 64486
                                            },
                                            "duration": {
                                                "text": "37 mins",
                                                "value": 2225
                                            },
                                            "end_location": {
                                                "lat": 39.8817002,
                                                "lng": -4.0196613
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eA-42\u003c/b\u003e (signs for \u003cb\u003eGetafe/Toledo/R-5/Badajoz\u003c/b\u003e)",
                                            "polyline": {
                                                "points": "sanuF`iuUZDj@L~@N^FJBTBN?R?RAj@Al@@pALJ?x@FnAHlF\\~AJ`@Bz@FtAHJ@bAF|AJdBLzAJvAHJ@B?h@D@?P@h@D|@D|CRzCPZ@jCPlHf@pBJt@BpEPjFT@?@@@?hF\\VBF?D@D?D?H@jAHtN`ArQnA|AJ~@H`CNtCRl@DvCRvAJhF^fAFpF^`BLvCRvHf@~Fh@rTlBhCRf@DR@R@r@DbHf@L?N@bAHJ?D@`@BZBhBLV@XBv@DrKp@z@F@?D@xFVx@DdADzKp@hAFrADnNz@fABz@?v@Bj@Bl@Fb@Fp@Nf@N`@RZL^Th@\\`@Z`@Zd@`@x@n@hA`AvC~BtExDfA~@vAjA^ZnAjAd@`@t@p@f@b@pAfAr@j@d@^f@^pA~@zBhBbAz@zAnAhDrC`MdKbFbE`Ax@JF@BRNv@p@lA~@PNdA~@bBtAnDtCr@l@t@j@j@`@p@h@^RXNj@ZVJZJb@LTDVF\\Df@DXBT?d@@HAXA\\C^C\\EfBUbBWlB[bBYpAQlAS`BWbBWvEu@~AUj@KnCa@p@K~IwArDk@dJuA`BW`@Gn@G~@G\\?Z?j@@j@Dl@H^HZHj@Nh@Rd@Tp@^p@^~@h@jAt@rAv@pAv@tAv@~A`ArAv@pAv@nAr@fC|ApAt@nAr@b@RjAn@lAp@dExBnDpBb@XfBbArFbDdEfCr@b@p@`@vKnGbI|E~@h@nGvDlEfCPJbAp@x@d@dEbCdHfEjBfAhBfAdEbCfI|E`@VvBnAjHhEjBfAtErCfI~EdHdERJb@XpBjApGvDj@\\fAp@tAv@bAh@t@\\|@ZdA^hBf@|Ad@^JnF`B`@Pb@RpAt@^TXRVN^Zh@b@XXXXTVTVTXV\\PVf@x@R^P\\P\\N^P^N^L\\L`@FJFTJ`@Rp@Nr@VfATfAH`@hAvG|@~Ep@zDPfATdA^hBVfA^pAPj@Rn@Zz@j@nADHTd@R^b@v@f@t@h@r@n@t@TVVVn@j@TTZTPLJHn@`@XPXP\\P\\NZN`A`@r@Tp@RnA\\lCn@xCp@pDz@hDv@`E|@|V|Fl@Nj@L`LhCtCn@vB^xAVzAR|APzALzAL|AH~AHzAH|AH|BLdBHJ?tAHbBH`CLpMp@nETrEXjALhBXp@LzBl@lAb@lAj@fAh@fAl@fAr@^ZfBnA|@r@ZV@?FFPLRNBBTPBBXTlCvBn@f@vAfApDxCdCjBhBvAp@l@zAjA~@l@j@ZzAr@l@T`@Jt@RfAPF@VDB?XBV@p@Dr@?p@AbBMt@IdBYz@OvCg@jAUnDq@tF_A~MeCzB_@vBa@nB]~ASF?r@Gf@A\\?X?r@@^D`@DZDz@Pb@Ll@R|@`@z@f@t@j@`@\\l@n@PVRTRVV^RZLT`@v@j@tAh@|AxL~^`DpJ~BhHp@pBZ~@d@jAVn@Zp@b@x@Zj@n@~@d@n@^d@b@d@~@|@fAz@^Vj@^b@Vv@^pDrAvBx@vBv@fC~@lCbAnCbAzEhB|EhBnEbBhKxDJD@@NDxAh@~RjH`HfCnE`BnDrAn@TlDnAhBr@tBv@fC~@t@XxGdC~GfCd@PzAp@rAr@z@f@l@Z~@`@z@^~@\\zAj@rAf@bCz@l@TrA`@j@Nz@TlAVPF|@Tj@PfA\\|CfAfBr@pBt@hDnA`A^pBt@jAd@~@\\rAf@zAj@xAj@\\Nt@Zb@Rn@ZlAp@v@`@p@^r@\\NHtAl@nAf@j@RnG`CfHjCn@T~Al@rAb@~Ab@tA^xA\\f@JtATB@n@JtC`@bAL|ARtCf@nB`@tAXj@N@?lAZvBl@nBl@vBt@lCbAxAl@`C~@`Bv@vClAz@ZjCdApC`ArBr@lIpCpAb@dA\\dA^^LfA^b@NfBl@pExAvDfA`Bd@fAXfJ~Bj@Ln@Z^N\\HvA`@fAV^JrJ`C|@VtCr@x@TrCr@tCr@x@R~@VzBl@n@PpFrArA\\zFxAnBd@nCp@~Bn@v@Rv@Vz@Zd@NjAd@x@`@pAn@ZRt@`@pAx@fBpAt@j@fA`AhAhAZXzAbBn@v@`AlAl@x@n@bALRV^f@|@v@xAv@|Af@dAZj@dAnBf@x@h@z@f@r@n@~@TZf@n@t@|@b@h@^^fAhAJJZZDBt@p@|@r@nA~@~B|ArAz@jAt@~CrBf@ZVPrBrArIvFPL@?RNxGfErBtAhBhApC`BxC`BnEzBfCjA|U`LFBlBz@l@ZxKjFpGvCxDhBl@X\\PtBbArAn@lAr@nAx@r@h@XVXTXXTRTVTV\\^f@l@TZTXV\\Vb@RXTb@`@r@Vd@f@bAZx@Vj@\\bAXz@Tv@Rt@Pr@ThARbAPfAPjANnALjANlALfANrAFf@VxBZtCVxBNpALfATxBVtBZxC\\xCVvBd@`E^`DZpCFp@TpB\\zCNlAj@lFf@dE\\tCd@fE`@vDPtAVrBVxBTvBPlAN`AJh@Jf@L`@X`AN`@Pb@L\\R^P^PZp@bAl@t@p@r@l@n@p@p@n@p@n@p@p@r@p@r@xA`BjAlAZ\\j@l@xA|A`@b@RTdAjAn@v@j@t@h@v@h@x@f@~@d@z@d@~@b@dA`@bA^bA^dAZdALd@Lf@VfAJd@RhAPhARlAHf@Hd@Hd@Jd@Jd@Jb@Lb@Ld@L^N`@N`@R`@R`@Tb@\\j@V\\\\b@TXTVLLb@`@XTXRZR\\TZPZLXLZL\\Jd@Ln@L^F^F^D\\Bd@Dt@B~@BdABpBBz@@d@BP?^@\\B\\B^D^Dz@J\\HZH`@HZJj@RPFXLXN\\NZPv@b@r@d@r@f@p@f@jA~@ZTZVXTpAbAp@h@t@l@p@j@fAz@x@p@l@d@x@n@p@h@nB|Aj@d@r@j@b@\\NL\\Vn@h@n@f@lA`ArB`Bj@b@p@h@TRVRXVZRVTZTXTXV\\Xn@d@t@l@j@d@rB~AVRz@p@l@d@n@h@t@j@n@h@pAbAXTp@h@r@j@p@h@r@j@r@j@t@l@jA|@fAz@b@\\p@h@v@j@jA|@fBpApA~@t@l@n@d@B@`DhCf@`@j@d@n@f@NLnAbAn@j@r@j@t@n@lAbAfA~@r@l@lA`AbDhCj@f@ZTZV\\VdAz@bBrAhBvAr@h@nAbApB`B`@\\l@h@p@j@t@p@p@l@j@h@lAjAj@l@l@l@VXl@p@n@r@l@p@l@t@l@t@l@t@j@t@j@t@`AtA~@rAf@x@l@|@x@tAV`@NXT\\d@x@z@bBb@v@b@z@d@`Az@fB^x@v@fBFNd@hAb@fA\\~@\\~@^bATl@HVj@dB\\dAd@|APh@tAtEh@hBj@hBXdAtBlH`@vAfAnDZhAX`Av@jCXdANf@V|@Nb@Lb@Nd@Z`APf@Vr@^fAb@hAN^P`@N^P^P`@P\\R^R\\R^R^V`@RXT\\f@p@TXTXVZTXVVXZXX\\XLLVTZVZTVRZTZRTNZPXPZPXNVL`@P^PTHZN^L`@Lx@Vz@Rn@L`@FXFb@Fr@Hf@Dt@D^B`@@x@B|@?r@Ad@A\\?^C~@Cv@E`@Cx@Gz@G`@EzAM|@GtAMvCS|@GvAGzAEhACp@Av@?^?\\?\\@\\@\\?|AD\\@ZB^@|AJn@Dd@F\\B\\D\\D\\D\\D^Db@Ft@L\\F\\F\\F\\F\\H|@RtA\\^H|Ab@jA^vAd@x@ZtAh@^PtB~@l@XpAp@v@b@t@`@t@d@~CnBjBnAtCjBdFdDXRhAp@|@j@dC~AnAz@fAr@r@d@t@d@x@h@bBhAr@d@nAx@r@d@lAx@pAx@r@d@rA|@~BzAt@f@r@d@t@d@r@f@nAv@t@d@t@f@r@d@nAx@nAx@`@Vl@`@t@d@nAz@b@Xj@\\XRt@d@b@Xt@f@r@d@dAp@t@d@nAx@nAz@jBjAlAx@pAx@hBjAtBtA|AdAnAx@nAv@hBlAhD|BpClBbBjAjAr@fBjA`CzAnAt@jAp@vA|@hAr@nAv@`BdAxBxA^Tj@^lAv@nBtAh@b@l@`@x@p@pB~AfAx@~@p@n@b@jAr@nBdAv@^fBz@n@\\pAr@VNVNh@\\r@d@ZTj@d@r@j@`@\\t@p@|@x@TPTRp@f@`@X\\Tl@`@lCfBlFjDdAr@~DfCbBhA`Al@bAj@d@VZLjAb@x@XjCt@zBp@d@LbBh@t@Xv@XLHPF^Rl@ZzA|@xAbAh@\\v@l@vGxEr@h@j@`@`An@lAr@~BnAp@^fAr@nBrAjDdCxB~An@`@zAx@f@Vb@P|@\\p@Rb@LtAXtAT|ARrAT`AP`Bb@h@Nv@VHB^LzCbAhFfBjBl@pA`@tBh@tCf@lG`AhEp@hBXjARhB\\`@J~@T|@X|Bx@zBz@bBn@xQ|GfE|A~B|@h@RfA`@f@RjAb@v@X`A\\pK`EpEbBnE`BbDlAh@RTHtDtAdDnAjBp@rAf@lAf@d@PbC`AhAh@f@Vt@`@bAl@dAr@RNLHd@XjBbAhB~@hFtB`C`An@VrCdAxBr@hBh@`Bb@x@RpCp@v@Tn@Nf@LdAVhMzCdCj@t@NpATlCZbBVvBf@rCr@pBd@xBh@pD|@nCl@rATfANbBNl@BvC?tBA`BAL?j@@`CClB?vCBrBBTBjAHbAR^Jr@R"
                                            },
                                            "start_location": {
                                                "lat": 40.381856,
                                                "lng": -3.718727899999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.9 km",
                                                "value": 887
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 47
                                            },
                                            "end_location": {
                                                "lat": 39.8740815,
                                                "lng": -4.0209104
                                            },
                                            "html_instructions": "Take exit \u003cb\u003e68B\u003c/b\u003e toward \u003cb\u003eToledo/Centro Urbano\u003c/b\u003e",
                                            "maneuver": "ramp-right",
                                            "polyline": {
                                                "points": "sklrFzapWJNFFHDlAj@zAx@lBfAx@f@h@Vf@P`A^`@Fr@Hv@Dr@@VA^Aj@E`@E`@Gd@Ij@SPA|@Wj@Kh@Kl@E`@CXAPGvEHNHPDVB"
                                            },
                                            "start_location": {
                                                "lat": 39.8817002,
                                                "lng": -4.0196613
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.6 km",
                                                "value": 569
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 61
                                            },
                                            "end_location": {
                                                "lat": 39.8690836,
                                                "lng": -4.021372500000001
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e3rd\u003c/b\u003e exit onto \u003cb\u003eCtra. Madrid\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "_|jrFtipW@D@B@@@BB@@@@@B@@@@?@?@@@?@?@?@?@?@?@?@A@?@A@?BA@A@C@A@A@C@A@Cx@Av@@j@@V?v@@jBBz@B`A@J?bCD|BFN?L?f@Fz@Zz@X"
                                            },
                                            "start_location": {
                                                "lat": 39.8740815,
                                                "lng": -4.0209104
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.4 km",
                                                "value": 381
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 50
                                            },
                                            "end_location": {
                                                "lat": 39.86603390000001,
                                                "lng": -4.0230983
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e3rd\u003c/b\u003e exit onto \u003cb\u003eCalle Marqués de Mendigorría\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "w|irFplpW?@?@?@?@?@?@?@@??@?@@@?@@@?@@??@@??@@?@@@??@@?@?@?@?@?B?@?@?@?@?@?@?@?@A@A@A@A@A?A@AVNFBNJDBF@D?D?@@FDDBDDLHVRJHNLDBHFPJNJLHJFPJXN@?FDnBt@nBn@DBJFFDJF"
                                            },
                                            "start_location": {
                                                "lat": 39.8690836,
                                                "lng": -4.021372500000001
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 180
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 22
                                            },
                                            "end_location": {
                                                "lat": 39.86460330000001,
                                                "lng": -4.024071999999999
                                            },
                                            "html_instructions": "Continue onto \u003cb\u003eCalle Cardenal Tavera\u003c/b\u003e",
                                            "polyline": {
                                                "points": "uiirFjwpW@@FDFFFDHHPNZT~@h@h@Zl@ZD@LDNFB@JF"
                                            },
                                            "start_location": {
                                                "lat": 39.86603390000001,
                                                "lng": -4.0230983
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 214
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 27
                                            },
                                            "end_location": {
                                                "lat": 39.8631215,
                                                "lng": -4.025026599999999
                                            },
                                            "html_instructions": "At the roundabout, continue straight onto \u003cb\u003ePaseo Merchán\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "w`irFl}pWA??@A@?@A??@?@A@?@?@?@?@?@?@?@?@?@?@?@?@@??@?@@@@@?@@??@@?@@@??@@?@?@@@?@?@A@?@?@A@A@??A@??A@??A?A@??A?A@A?A?A?A?A?APF|@ZpAp@h@VFPn@f@"
                                            },
                                            "start_location": {
                                                "lat": 39.86460330000001,
                                                "lng": -4.024071999999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "0.2 km",
                                                "value": 199
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 27
                                            },
                                            "end_location": {
                                                "lat": 39.8625936,
                                                "lng": -4.027066
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e1st\u003c/b\u003e exit and stay on \u003cb\u003ePaseo Merchán\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "owhrFlcqW@DBB@BB@B@@@B@B?B?B?BABAJ\\@Nr@hGAlA"
                                            },
                                            "start_location": {
                                                "lat": 39.8631215,
                                                "lng": -4.025026599999999
                                            },
                                            "travel_mode": "DRIVING"
                  },
                                        {
                                            "distance": {
                                                "text": "40 m",
                                                "value": 40
                                            },
                                            "duration": {
                                                "text": "1 min",
                                                "value": 5
                                            },
                                            "end_location": {
                                                "lat": 39.8628115,
                                                "lng": -4.0273884
                                            },
                                            "html_instructions": "At the roundabout, take the \u003cb\u003e1st\u003c/b\u003e exit onto \u003cb\u003eAv. Reconquista\u003c/b\u003e",
                                            "maneuver": "roundabout-right",
                                            "polyline": {
                                                "points": "ethrFdpqWC@C@CBCBCBADCDAB?DAD?JMF"
                                            },
                                            "start_location": {
                                                "lat": 39.8625936,
                                                "lng": -4.027066
                                            },
                                            "travel_mode": "DRIVING"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "o{tuFrkrUEgC\\}ODoIdByI~@sEv@mEKs@d@e@T@PKdAUrJsCxRuE~Cq@V\\`@FtC~B|CbChSzQvO~MzDrDpHjGnKpJ~RrQz@t@vFtF~AjChA|CbGdSfBlD|DtErP`QjA~@hAd@`OdDpGnAbBCdEV`TrA|h@fDtYvAfCPdu@dFll@fErf@xDdHd@|YbB~RdAvP~@rBBnDb@dCfAdSbPdNrLxStPn[pWrP`N|BjAlBf@tBNfBEzRsCja@mG|SaDhDOdDZvCbAjQhKnSnLfNvHtQrK`k@v\\vtA|x@vNrIlGzClHxBpGrBtBhApBtArBnBtAfB~AtChBbFpAtFbEtU~A~H`BhFzA~CdDvE|E`EnBdAbEzA`u@~PzUfFnJjAbUlAlWrAbLn@tDf@lDz@zCnAnCvAfBnA`EzCZTxEvDvVtRvEpB|Cl@fBJ~FYfk@_KnIsArCIpCR~A^jBt@pBrAnAlApAdBnB~DdWxv@jClHjCvEhDxDvDjCza@vOvwAzh@tSxHxGhDvGjCxIzCfEdAnIlCvWzJhGbCxEbCjEtBrThIbIjClH~AlG|@xLvBrFxAnMtEvL`F~UlIbTfHhUfGxCbAt]|I|^jJvLzCdFhB|EfCvHxFpF~FlD~E`JpPvCjE`DvDtBtBbIbGxYlRbLlHzFjDhJ|Ez]lPr[hOtG~CjFnDpE|EpEvHjBdFpAjFfAfHz@tH~CzXpEda@xFhg@vArLt@tDhAdDhB~CbKvKbM~MnD~EvC`G|BrG~@zDnB`Lt@lCfAfChBpC|A`BlBrAlBz@rCn@bCV`MVzBRvCh@rBt@jCtAhK|HvXvTzSrPxZhVpOlLxLrJ~_@d[vMbLxJnKrDvEvE`H`H`MhHlP~E|NbSvq@zDpK|C~FbEjFfEtDpElCrB|@vDfAnCd@pDXlEBbDI`NcAhKi@rEEnHPhIt@nGdApG~ArHjCtG|CbIzE~YnRna@`X`fApr@hLxHtJ`G~RnMbGvEbGbEjNpHnDlCjDzCvRtMhLjHfEbBpK~ClCdAbGpDlLnIzHtEtKlHlHrEvDpA|IxAdG|AnL|D|DnAjGpAlS`DhGxApj@tSde@dQnUvIjHdDjDzBpC|ArItD~LrElR~EvUlFpFr@jGzAlPzDlHx@pXAhCFnC\\rA^RV`HrDlEpB`EXdCOfI}Az@EhF@z@XRRN@NEFI~@KhLN~GL~C~@?HDJRHZKjAb@vAfAvBpAnGdCpCnBhCpAEVDTPFNKBI?E`DrApBbBLBFANZt@xGEnAOLWn@"
                            },
                            "summary": "A-42",
                            "warnings": [],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                done();
            });
            input.send({
                origin: 'Madrid',
                destination: 'Toledo',
                region: 'es',
                key: 'KEY'
            });
        });
    });

    it("should return metric units", function (done) {
        helper.load([googleNode, directionsNode], [{
                id: "input",
                type: "helper",
                wires: [["directions"]]
     }, {
                id: "directions",
                type: "google directions",
                wires: [["output"]],
     }, {
                id: "output",
                type: "helper"
     }
    ], function () {
            nock('https://maps.googleapis.com:443')
                .get('/maps/api/directions/json?key=KEY&origin=Washington%2C%20DC&destination=Baltimore%2C%20MD&mode=transit')
                .reply(200, {
                    "routes": [
                        {
                            "bounds": {
                                "northeast": {
                                    "lat": 39.310798,
                                    "lng": -76.61552329999999
                                },
                                "southwest": {
                                    "lat": 38.896121,
                                    "lng": -77.04103719999999
                                }
                            },
                            "copyrights": "Map data ©2015 Google",
                            "legs": [
                                {
                                    "arrival_time": {
                                        "text": "7:23pm",
                                        "time_zone": "America/New_York",
                                        "value": 1427239380
                                    },
                                    "departure_time": {
                                        "text": "5:59pm",
                                        "time_zone": "America/New_York",
                                        "value": 1427234390
                                    },
                                    "distance": {
                                        "text": "42.5 mi",
                                        "value": 68436
                                    },
                                    "duration": {
                                        "text": "1 hour 23 mins",
                                        "value": 4990
                                    },
                                    "end_address": "Baltimore, MD, USA",
                                    "end_location": {
                                        "lat": 39.307096,
                                        "lng": -76.615881
                                    },
                                    "start_address": "Washington, DC, USA",
                                    "start_location": {
                                        "lat": 38.9071647,
                                        "lng": -77.03690619999999
                                    },
                                    "steps": [
                                        {
                                            "distance": {
                                                "text": "0.4 mi",
                                                "value": 681
                                            },
                                            "duration": {
                                                "text": "8 mins",
                                                "value": 489
                                            },
                                            "end_location": {
                                                "lat": 38.90329699999999,
                                                "lng": -77.039502
                                            },
                                            "html_instructions": "Walk to Farragut North Metro Station",
                                            "polyline": {
                                                "points": "w`nlFtgeuMMNx@tAPn@Pn@j@vBnAnFLd@Jd@Ld@H\\DPRv@H\\DRvDmBfEqBfAg@Rk@"
                                            },
                                            "start_location": {
                                                "lat": 38.9071647,
                                                "lng": -77.03690619999999
                                            },
                                            "steps": [
                                                {
                                                    "distance": {
                                                        "text": "33 ft",
                                                        "value": 10
                                                    },
                                                    "duration": {
                                                        "text": "1 min",
                                                        "value": 7
                                                    },
                                                    "end_location": {
                                                        "lat": 38.9072261,
                                                        "lng": -77.0369851
                                                    },
                                                    "html_instructions": "Head \u003cb\u003enorthwest\u003c/b\u003e on \u003cb\u003eScott Cir NW\u003c/b\u003e",
                                                    "polyline": {
                                                        "points": "w`nlFtgeuMMN"
                                                    },
                                                    "start_location": {
                                                        "lat": 38.9071647,
                                                        "lng": -77.03690619999999
                                                    },
                                                    "travel_mode": "WALKING"
                        },
                                                {
                                                    "distance": {
                                                        "text": "240 ft",
                                                        "value": 73
                                                    },
                                                    "duration": {
                                                        "text": "1 min",
                                                        "value": 60
                                                    },
                                                    "end_location": {
                                                        "lat": 38.9068501,
                                                        "lng": -77.03766379999999
                                                    },
                                                    "html_instructions": "Exit the traffic circle onto \u003cb\u003eScott Cir NW\u003c/b\u003e",
                                                    "polyline": {
                                                        "points": "eanlFdheuMx@tAPn@"
                                                    },
                                                    "start_location": {
                                                        "lat": 38.9072261,
                                                        "lng": -77.0369851
                                                    },
                                                    "travel_mode": "WALKING"
                        },
                                                {
                                                    "distance": {
                                                        "text": "0.2 mi",
                                                        "value": 320
                                                    },
                                                    "duration": {
                                                        "text": "4 mins",
                                                        "value": 222
                                                    },
                                                    "end_location": {
                                                        "lat": 38.905678,
                                                        "lng": -77.04103719999999
                                                    },
                                                    "html_instructions": "Continue onto \u003cb\u003eRhode Island Ave NW\u003c/b\u003e",
                                                    "polyline": {
                                                        "points": "y~mlFjleuMPn@j@vBnAnFLd@Jd@Ld@H\\DPRv@H\\DR"
                                                    },
                                                    "start_location": {
                                                        "lat": 38.9068501,
                                                        "lng": -77.03766379999999
                                                    },
                                                    "travel_mode": "WALKING"
                        },
                                                {
                                                    "distance": {
                                                        "text": "0.2 mi",
                                                        "value": 278
                                                    },
                                                    "duration": {
                                                        "text": "3 mins",
                                                        "value": 200
                                                    },
                                                    "end_location": {
                                                        "lat": 38.90329699999999,
                                                        "lng": -77.039502
                                                    },
                                                    "html_instructions": "Turn \u003cb\u003eleft\u003c/b\u003e onto \u003cb\u003eConnecticut Ave NW\u003c/b\u003e\u003cdiv style=\"font-size:0.9em\"\u003eDestination will be on the left\u003c/div\u003e",
                                                    "maneuver": "turn-left",
                                                    "polyline": {
                                                        "points": "owmlFnafuMvDmBfEqBfAg@Rk@"
                                                    },
                                                    "start_location": {
                                                        "lat": 38.905678,
                                                        "lng": -77.04103719999999
                                                    },
                                                    "travel_mode": "WALKING"
                        }
                     ],
                                            "travel_mode": "WALKING"
                  },
                                        {
                                            "distance": {
                                                "text": "1.9 mi",
                                                "value": 3088
                                            },
                                            "duration": {
                                                "text": "8 mins",
                                                "value": 480
                                            },
                                            "end_location": {
                                                "lat": 38.89777,
                                                "lng": -77.00640199999999
                                            },
                                            "html_instructions": "Metro rail towards Silver Spring",
                                            "polyline": {
                                                "points": "shmlFzweuM`^ghACaf@|Ls_@iI}|@"
                                            },
                                            "start_location": {
                                                "lat": 38.90329699999999,
                                                "lng": -77.039502
                                            },
                                            "transit_details": {
                                                "arrival_stop": {
                                                    "location": {
                                                        "lat": 38.89777,
                                                        "lng": -77.00640199999999
                                                    },
                                                    "name": "Union Station Metro Station"
                                                },
                                                "arrival_time": {
                                                    "text": "6:16pm",
                                                    "time_zone": "America/New_York",
                                                    "value": 1427235360
                                                },
                                                "departure_stop": {
                                                    "location": {
                                                        "lat": 38.90329699999999,
                                                        "lng": -77.039502
                                                    },
                                                    "name": "Farragut North Metro Station"
                                                },
                                                "departure_time": {
                                                    "text": "6:08pm",
                                                    "time_zone": "America/New_York",
                                                    "value": 1427234880
                                                },
                                                "headsign": "Silver Spring",
                                                "line": {
                                                    "agencies": [
                                                        {
                                                            "name": "MET",
                                                            "phone": "1 202-637-7000",
                                                            "url": "http://www.wmata.com/tripplanner"
                              }
                           ],
                                                    "color": "#e94333",
                                                    "name": "Metrorail Red Line",
                                                    "short_name": "Red",
                                                    "vehicle": {
                                                        "icon": "//maps.gstatic.com/mapfiles/transit/iw/6/metro.png",
                                                        "name": "Metro rail",
                                                        "type": "SUBWAY"
                                                    }
                                                },
                                                "num_stops": 4
                                            },
                                            "travel_mode": "TRANSIT"
                  },
                                        {
                                            "distance": {
                                                "text": "472 ft",
                                                "value": 144
                                            },
                                            "duration": {
                                                "text": "2 mins",
                                                "value": 144
                                            },
                                            "end_location": {
                                                "lat": 38.899036,
                                                "lng": -77.006795
                                            },
                                            "html_instructions": "Walk to UNION STATION MARC Washington",
                                            "polyline": {
                                                "points": "afllF~h_uM}FnA"
                                            },
                                            "start_location": {
                                                "lat": 38.89777,
                                                "lng": -77.00640199999999
                                            },
                                            "steps": [
                                                {
                                                    "distance": {
                                                        "text": "472 ft",
                                                        "value": 144
                                                    },
                                                    "duration": {
                                                        "text": "2 mins",
                                                        "value": 144
                                                    },
                                                    "end_location": {
                                                        "lat": 38.899036,
                                                        "lng": -77.006795
                                                    },
                                                    "polyline": {
                                                        "points": "afllF~h_uM}FnA"
                                                    },
                                                    "start_location": {
                                                        "lat": 38.89777,
                                                        "lng": -77.00640199999999
                                                    },
                                                    "travel_mode": "WALKING"
                        }
                     ],
                                            "travel_mode": "WALKING"
                  },
                                        {
                                            "distance": {
                                                "text": "40.1 mi",
                                                "value": 64523
                                            },
                                            "duration": {
                                                "text": "1 hour 0 mins",
                                                "value": 3600
                                            },
                                            "end_location": {
                                                "lat": 39.307096,
                                                "lng": -76.615881
                                            },
                                            "html_instructions": "Train towards PERRYVILLE LOCAL (Train 544)",
                                            "polyline": {
                                                "points": "_nllFnk_uMF]gEyAqAk@ICc@MCA[I]IUO[Sm@c@_@YWSWUWQSK_@QUI_AWECUK_@UYQQGWMOIYKWIKCOEQEc@Kc@SIEMEo@SGCwDaAUGWGgLyCMCUE_@MWG]MMEUK[MIEAA[QSQ[USSUSOSOMcA_Ay@cAy@iAYa@We@Ue@Wi@MYM]Uo@g@gB{@gDAIo@{CEU_@_BeFqSs@wC_@{AcA_EwA_GsDgOwDqO{AeGg@uBi@}B]aBY}A[iB]aCMgAOuAGc@Iw@C[CYMeBG_AGaAGyAEgAEiAE_DAqB?_A?kABwBDcBBkCBy@Bw@dCgyA@m@nBqkADiCFuCBmBB{AFaCByBDgCFgDFuCDuBDyCDeCFeCDgCDyBDgCDyCHkEFwCD}BD_CBoBFqCDoCFsDDkCBsBB}B?}@@{@Au@?u@A{AAyAC_BGqBEgBIgBIkBKgBMiBOkBS}BKiA[mCY_C]gCc@sCYyA[eBe@aCe@wBq@oCCMGUSy@W_AU{@Sq@Ww@Oi@So@]aAYy@Y{@[w@Ws@_@_AWm@[w@Yq@Ui@]u@O]a@{@i@iAa@w@i@aAi@aAi@_Ak@aAi@}@i@{@k@y@q@aAe@s@c@k@u@cAu@}@u@_Aw@{@u@y@_A_AgAcAu@u@_A{@y@w@k@k@a@_@e@e@y@y@s@q@}@y@u@u@k@k@o@m@e@c@u@s@q@o@e@e@k@g@w@s@}@cA{@}@u@u@[]mAsAu@{@cAoAk@s@c@o@_AuAq@gAaDkFiAkBuA_CcCeEiGeKwAcCk@_AqA{BmCqEkAoBy@{A_CuDeAiBwFiJcBkCOW_@k@o@aAy@kA}@oAw@gAGIuCqDIKy@cA}AoBwAeB{HiJ{BgCMOoB{Bu@{@mAuAwAaBs@w@u@{@qB}BoAuAkAkAuAmAoAeAeAu@cQ{KaGmD]S{BwA}AaAmAy@uBuA_BkA{@o@qAeAs@o@{@w@gAiAiAoA_AgAs@w@m@u@o@q@k@s@q@u@QUs@y@i@o@s@{@u@{@sAaBcAmAw@}@_AgAw@}@u@}@w@}@eAqAgAoAy@gAU[KOIKYa@_@k@_@m@a@m@Wc@e@y@e@}@Wc@Sc@k@mAq@wAaA{By@kBkAqCmAuC}@mBAEeBeE_CoFo@{AuAgDeAcCe@iAq@_BKUIUACkAmCAEaA{By@qBqFgMqBwEy@oBiAmCy@oBi@oAk@sAu@gBu@cBw@kBiAoCm@uAm@yAeAgCgAiCiAgC}@uBcAaCw@kBw@gB_@_AEIa@aAg@mAu@eB_AuBaAaC{@oBaA}B_AyB}@uB}@wBoAwCWm@e@gAeAeC_A}B}AoDuDyIw@mBkAoCe@gAkAoCcAaCi@oAYs@y@qBcA}BkAoCmCoGaAyBy@oBs@cBSe@}@uBiBiE_@aAeAaC}AuDkAqCsA}Co@}Ay@mBw@eBs@}Ak@oAe@cAi@kAq@wAo@qA_@y@g@eAq@yAs@{Ao@sAo@uAi@iAi@iAc@_Ac@}@m@qAm@sAg@gAq@uAi@mAk@iAg@gAw@cBs@{As@{Ay@eBo@wAi@gAk@oAo@sA_@w@}@oBy@eBq@yA{@iBkAgC_AmBiA_CoAmC}@qBm@qAm@oAGOqAoC_@y@Uk@c@kAgFyKIQO_@m@mAa@u@w@yAKQs@{Ak@mA_AqBy@iBy@cBy@eBy@_BcAkBuA_CeAaBiA_BgA{AKOeAwAkAaB_AqAkA_B_@e@qBsCeBaCmBmC}AoBoBiCmAyAgAqA{@aAeAiA{@y@cAeA}@y@u@u@s@o@o@i@GGYWe@a@QKa@_@g@a@e@_@k@a@g@a@_Aq@m@c@k@_@g@]c@[eAq@e@[q@e@}@m@_BeAsA}@mAy@g@[iEwCwBuA}@k@w@k@o@a@yA_A{@k@}B{AwEcDk@_@{AaAwByAgCcBkBoAeAy@kA}@{@u@eC{B{ByBuDyDkBqBiDiDaEiEuD{DmDsDsAiBcBoBkBgC}EaGy@_As@w@aAcAu@s@sBkBaAy@gCkBwBuAqAy@gCqA}BcAqEiBgCu@iDw@sCk@qE{@aDk@qCq@gBg@}@[mC_Ak@W}@a@gAg@}Ay@kBgAwA{@_DkBoD{BcDsBiBgAaC}AeBiAiBiAwBqAqA_AaCuAeDqBkBkAq@a@w@e@IE}@k@q@c@gCiBwAgASOeA}@aB{A}@{@y@}@_@a@gCyCg@q@{AuBeA}A{@qAiBoC}@sAoAoBaFsHoBwCoByCcA{AaBgCuBaDoDmFeGcJgBoCq@aA]g@c@o@w@cAy@gA[_@iAoAmAqA}AyA{@y@uBeBi@a@w@m@cAq@eAq@}@i@cB_A{C{AqB_Aw@]yBeAkD_By@_@oB_AgF_Cy@a@}@a@iBu@iBq@{Ae@gBi@sA]oAWuAYi@Ku@Ku@MiEu@{B]mDk@SCeGcAqQwC_Ca@a@E}AYmAS{AW}AWaC_@k@MwAWUCoAWcASWGgASyJaBUCiF}@sCe@eHiA}Ci@}Cg@sVaE}WoEeNoBqH_@yBCmC@oBF_ADgAFkAJ{@HmIdAsOrBeBZcBPeAN]FwBVqB@_ELY?aD?sAAiA?cGAC@cDAyFAiCC_@@mDAeFAcE?wLC}FBwB@wA?uCAwB?aDAs@?oEAqJCyTM}CAsTGaLe@oD[}C_@wBY}Dk@iEq@oBYoDg@wCc@mC_@iBYud@yGiDi@cBSoBWyAUuCa@mC]mAO_AOaC[qC_@sBUaAKoAEgBAaBFyAH}AJcAL_ALy@NgAVgA`@w@V_AV_Bf@mKnDk@VMDk@RqA^OHcA\\yPtFqA`@cCp@_@Jg@JqAVoAVkBTkBTqBL[@cADuBBqA@_AAg@A_BG{AIgBOwAOyXcE_WuDKC[EkEo@eBW_AOy@K_Ek@eBSuBUmBOiBKeDOs@AoCCyBIm@AQEsAEqDKmDKuAGw@AkAEi@A}AG{Eu@eBWOEmKqBkFcAy@Q{AWqC_@{AQi@Cs@CMAc@E_CIoCIaACkAIA?QBc@AaBGeAEiFOc@?_BGa@Co@AsAE]AsBIq@A_BE{@CWA}AC{ACaCCyBAqBAuA?yAA_ECiAAi@AgAA_AAkAA_@?eB?iBAc@?iBAaB?Y?K?e@Ae@?k@?y@Au@?iUOuAEk@E]Au@IqBQmC_@wDy@}@Um@Qi@Sg@M{@YYIi@S}@a@{@_@s@[qAq@y@e@u@a@c@W}@o@g@]g@_@o@c@m@c@QOi@_@iA{@YUg@[mCmBq@i@q@g@iA{@_BmAsA_Au@k@{@o@mA{@mBwASOeAu@q@i@_@Ws@g@{@m@eAy@iAy@}@q@_Aq@cAs@mA}@sAaAcE}CiBuA_Aq@uAaAgAy@s@i@eAw@u@i@iAy@cAs@qA_A_Ao@i@c@{AiAmCmBgAu@k@a@AAaAq@uAaAeAu@sAaA}@o@c@Y{AeAoA{@q@a@}@g@YQ{Aw@iAk@}@a@_Ac@aAi@k@[s@a@w@g@_Au@SQ[YOKcAeA_AgAq@{@KOk@w@e@u@i@}@eAoBKUw@cBA?Uk@e@gAk@kAc@eAi@kAaA{BMYM[c@gAy@eBMYO[AA_@{@{@qBO[y@mBmAoCqA{CO[O_@Qc@c@aA[s@]w@Sc@a@aAi@mAc@cAsB_Fk@uAe@aAmAoCSe@g@gAm@uAq@iAGIKSIKU[KKKMKMIGCEIISQKKSQECg@a@k@c@o@_@YOe@U}@[g@Ou@Qc@Kw@Mi@Ki@Gq@Iq@Eu@Gk@CE?i@CyBIS?c@Cm@Gq@E_AKk@Iu@S]Mg@Sm@Yg@]g@_@{@w@k@s@a@m@Yg@]q@KUe@mAGSK]EOI_@K_@Gc@EYMy@Gu@Eq@Cw@Aw@AA?U@u@?u@?k@?aD@eB?e@CaBc@gc@C{DEiBCy@CYGYYo@Sg@u@gAsTi\\qTi\\o@eBMi@Kk@M}AIiDOiFI{DF]HYHYL]Tc@Zi@dC{D\\g@BCl@w@V_@VUXa@Zg@R]Pc@Vk@l@oBj@eBt@yB\\eA~AfA"
                                            },
                                            "start_location": {
                                                "lat": 38.899036,
                                                "lng": -77.006795
                                            },
                                            "transit_details": {
                                                "arrival_stop": {
                                                    "location": {
                                                        "lat": 39.307096,
                                                        "lng": -76.615881
                                                    },
                                                    "name": "PENN STATION MARC nb"
                                                },
                                                "arrival_time": {
                                                    "text": "7:23pm",
                                                    "time_zone": "America/New_York",
                                                    "value": 1427239380
                                                },
                                                "departure_stop": {
                                                    "location": {
                                                        "lat": 38.899036,
                                                        "lng": -77.006795
                                                    },
                                                    "name": "UNION STATION MARC Washington"
                                                },
                                                "departure_time": {
                                                    "text": "6:23pm",
                                                    "time_zone": "America/New_York",
                                                    "value": 1427235780
                                                },
                                                "headsign": "PERRYVILLE LOCAL (Train 544)",
                                                "line": {
                                                    "agencies": [
                                                        {
                                                            "name": "Maryland Transit Administration",
                                                            "phone": "1 410-539-5000",
                                                            "url": "http://mta.maryland.gov/"
                              }
                           ],
                                                    "color": "#f27a00",
                                                    "name": "Penn - Washington",
                                                    "short_name": "MARC",
                                                    "text_color": "#ffffff",
                                                    "vehicle": {
                                                        "icon": "//maps.gstatic.com/mapfiles/transit/iw/6/rail.png",
                                                        "name": "Train",
                                                        "type": "HEAVY_RAIL"
                                                    }
                                                },
                                                "num_stops": 8
                                            },
                                            "travel_mode": "TRANSIT"
                  }
               ],
                                    "via_waypoint": []
            }
         ],
                            "overview_polyline": {
                                "points": "w`nlFtgeuMMNx@tAb@~AtCrLp@lCNp@~J_FfAg@Rk@`^ghACaf@|Ls_@iI}|@}FnAF]yGeCm@QsAe@aCeBcBeAqBq@cB}@mAc@iBk@oAc@mSkF{A_@}Am@{@k@uAqAsAmAsBmC_BwCyAoEsBcJaZ_mAkE{QaBqKe@mEa@aGYkK@uJnGsvDp@a`@hBgfAL{LAcGSsKm@eLkAaMw@gG}@mFaAgFwAgGw@}CwDwLuEcL}B{EiDeGqDuFuDaFcFuFwFmFaKyJ}DuDgEeE{EeFiEoF}IuN{PoYoYcf@cEqGwDmFwHqJ}OgRwRwTaDyCuC{BeYiQyCkBaK}G}F}EeGyG{DqEiLeNeFaG}EeGoEcH}BsEyFqM_Qga@_GiNic@mdA}z@kqBwa@gaAoUag@gVgh@{MgYyJgTeHwOsCoFyEeKqFuK{CaFqC{D}E{GcI{KiKaNeGwGkFeFyFyEyHsFeO{J{VoPwM_JsFsDqCwBaEqDqHsHmSaTmDsDsAiBoEwFmK}LiD_DiEeDiEoCeGuCqEiBgCu@}HcBsJgByFyAuHuCeDaBcEcC}QcLiMcIeNsIqDyBeHeFgDyCwByBgD{DcCgDiHsK}]ii@}L}QqD{EwCaDyCsC{GgFcC{A_G{CoMcGkMaGgDwAeEwA{DgAeDq@_J{Auk@kJiKcBiFaA}OqCyTqDmy@cNeNoBqH_@gGAoDLsCRiKnAyRnC_I`AqHN{D?eLAgQEo_@GcRB}OC}z@[aLe@oD[uGy@gT_Deq@wJwMkBqL_BiM}AwDG{DPaDXyB\\gGhBmNvEy@\\qEzAkSvGcD|@yBb@{Dl@}Eb@_BFoH@{DQ_E_@ar@cKkLcBeH_AcFe@oG[cEEmGWmNa@uBG}AG{Eu@uB]yRuDuCi@mFq@oCO}Ka@yCEwRk@uSc@wWOkRGw]SuEW_Gq@uFoA{DmA}D_BuFuCqDeCsLsImG{EsGwEoMoJ{UeQ{OgL{OeL_QwLeFsCiG{C_B}@wB}AcC}BiDkEaDyFqHqPyDwImTmg@sDmIoCqF}AqB}@y@iCiB_Ae@eBk@{Dw@cE_@uEQwCQkBUsAa@uAm@oA}@gBkB{@uAwAiDg@mBc@mDMcD?}Pq@gn@Ks@m@wAiVq^qTi\\o@eBYuAWgGYeLPw@hAeCtE_HdB_Cd@aAdA{C`B_F\\eA~AfA"
                            },
                            "summary": "",
                            "warnings": [
            "Walking directions are in beta.    Use caution – This route may be missing sidewalks or pedestrian paths."
         ],
                            "waypoint_order": []
      }
   ],
                    "status": "OK"
                }, {
                    'content-type': 'application/json; charset=UTF-8',
                    'transfer-encoding': 'chunked'
                });
            var input = helper.getNode("input");
            input.should.have.property('id', 'input');
            var directions = helper.getNode("directions");
            directions.should.have.property('id', 'directions');
            var output = helper.getNode("output");
            output.should.have.property('id', 'output');
            output.on("input", function (msg) {
                msg.should.have.property('payload');
                msg.payload.should.have.property('status', 'OK');
                msg.payload.should.have.property('routes');
                msg.payload.routes.length.should.equal(1);
                msg.payload.routes[0].legs[0].should.have.property('arrival_time');
                msg.payload.routes[0].legs[0].should.have.property('departure_time');
                done();
            });
            input.send({
                origin: 'Washington, DC',
                destination: 'Baltimore, MD',
                mode: 'transit',
                key: 'KEY'
            });
        });
    });

});