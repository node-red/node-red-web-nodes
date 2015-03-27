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
var geocodingNode = require("../../google/geocoding.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('google geocoding', function () {

	before(function (done) {
		helper.startServer(done);
	});

	afterEach(function () {
		helper.unload();
	});

	describe("query node", function () {

		it('can be loaded without credentials', function (done) {
			helper.load(geocodingNode,
				[{
						id : "geocoding",
						type : "google geocoding"
					}
				], function () {
				var n = helper.getNode("geocoding");
				n.should.have.property('id', 'geocoding');
				done();
			});
		});

		if (!nock)
			return;

		it("should return lat/lon from address", function (done) {
			helper.load([googleNode, geocodingNode], [{
						id : "input",
						type : "helper",
						wires : [["geocoding"]]
					}, {
						id : "geocoding",
						type : "google geocoding",
						wires : [["output"]],
						geocodeBy : 'address'
					}, {
						id : "output",
						type : "helper"
					}
				], function () {
				nock('https://maps.googleapis.com:443')
				.get('/maps/api/geocode/json?address=1600%20Pennsylvania%20Ave%2C%20Washington%20DC')
				.reply(200, {
					"results" : [{
							"address_components" : [{
									"long_name" : "1600",
									"short_name" : "1600",
									"types" : ["street_number"]
								}, {
									"long_name" : "Pennsylvania Avenue Southeast",
									"short_name" : "Pennsylvania Ave SE",
									"types" : ["route"]
								}, {
									"long_name" : "Hill East",
									"short_name" : "Hill East",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Washington",
									"short_name" : "D.C.",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "District of Columbia",
									"short_name" : "DC",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}, {
									"long_name" : "20003",
									"short_name" : "20003",
									"types" : ["postal_code"]
								}
							],
							"formatted_address" : "1600 Pennsylvania Avenue Southeast, Washington, DC 20003, USA",
							"geometry" : {
								"location" : {
									"lat" : 38.8786589,
									"lng" : -76.9816788
								},
								"location_type" : "ROOFTOP",
								"viewport" : {
									"northeast" : {
										"lat" : 38.88000788029149,
										"lng" : -76.98032981970849
									},
									"southwest" : {
										"lat" : 38.8773099197085,
										"lng" : -76.98302778029151
									}
								}
							},
							"partial_match" : true,
							"types" : ["street_address"]
						}, {
							"address_components" : [{
									"long_name" : "1600",
									"short_name" : "1600",
									"types" : ["street_number"]
								}, {
									"long_name" : "Pennsylvania Avenue Northwest",
									"short_name" : "Pennsylvania Ave NW",
									"types" : ["route"]
								}, {
									"long_name" : "Northwest Washington",
									"short_name" : "Northwest Washington",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Washington",
									"short_name" : "D.C.",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "District of Columbia",
									"short_name" : "DC",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}, {
									"long_name" : "20500",
									"short_name" : "20500",
									"types" : ["postal_code"]
								}
							],
							"formatted_address" : "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, USA",
							"geometry" : {
								"location" : {
									"lat" : 38.8977332,
									"lng" : -77.0365305
								},
								"location_type" : "ROOFTOP",
								"viewport" : {
									"northeast" : {
										"lat" : 38.8990821802915,
										"lng" : -77.0351815197085
									},
									"southwest" : {
										"lat" : 38.8963842197085,
										"lng" : -77.03787948029151
									}
								}
							},
							"partial_match" : true,
							"types" : ["street_address"]
						}
					],
					"status" : "OK"
				}, {
					'content-type' : 'application/json; charset=UTF-8',
					'transfer-encoding' : 'chunked'
				});
				var input = helper.getNode("input");
				input.should.have.property('id', 'input');
				var geocoding = helper.getNode("geocoding");
				geocoding.should.have.property('id', 'geocoding');
				var output = helper.getNode("output");
				output.should.have.property('id', 'output');
				output.on("input", function (msg) {
					msg.should.have.property('payload');
					msg.payload.should.have.property('lat', 38.8786589);
					msg.payload.should.have.property('lon', -76.9816788);
					msg.should.have.property('title', '38.8786589, -76.9816788');
					msg.should.have.property('description', '38.8786589, -76.9816788');
					msg.should.have.property('location');
					msg.location.should.have.property('lat', 38.8786589);
					msg.location.should.have.property('lon', -76.9816788);
					msg.location.should.have.property('description', '38.8786589, -76.9816788');
					done();
				});
				input.send({
					location : {
						address : "1600 Pennsylvania Ave, Washington DC"
					}
				});
			});
		});

		it("should return address from lat/lon", function (done) {
			helper.load([googleNode, geocodingNode], [{
						id : "input",
						type : "helper",
						wires : [["geocoding"]]
					}, {
						id : "geocoding",
						type : "google geocoding",
						wires : [["output"]],
						geocodeBy : 'coordinates'
					}, {
						id : "output",
						type : "helper"
					}
				], function () {
				nock('https://maps.googleapis.com:443')
				.get('/maps/api/geocode/json?latlng=40.689759%2C-74.045138')
				.reply(200, {
					"results" : [{
							"address_components" : [{
									"long_name" : "1",
									"short_name" : "1",
									"types" : ["street_number"]
								}, {
									"long_name" : "Liberty Island",
									"short_name" : "Liberty Island",
									"types" : ["establishment"]
								}, {
									"long_name" : "Liberty Island",
									"short_name" : "Liberty Island",
									"types" : ["route"]
								}, {
									"long_name" : "Liberty Island",
									"short_name" : "Liberty Island",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Manhattan",
									"short_name" : "Manhattan",
									"types" : ["sublocality_level_1", "sublocality", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "New York County",
									"short_name" : "New York County",
									"types" : ["administrative_area_level_2", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}, {
									"long_name" : "10004",
									"short_name" : "10004",
									"types" : ["postal_code"]
								}, {
									"long_name" : "1418",
									"short_name" : "1418",
									"types" : ["postal_code_suffix"]
								}
							],
							"formatted_address" : "Liberty Island, 1 Liberty Island, New York, NY 10004, USA",
							"geometry" : {
								"location" : {
									"lat" : 40.689758,
									"lng" : -74.04513799999999
								},
								"location_type" : "ROOFTOP",
								"viewport" : {
									"northeast" : {
										"lat" : 40.69110698029149,
										"lng" : -74.0437890197085
									},
									"southwest" : {
										"lat" : 40.6884090197085,
										"lng" : -74.0464869802915
									}
								}
							},
							"types" : ["street_address"]
						}, {
							"address_components" : [{
									"long_name" : "Liberty Island",
									"short_name" : "Liberty Island",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Manhattan",
									"short_name" : "Manhattan",
									"types" : ["sublocality_level_1", "sublocality", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "New York County",
									"short_name" : "New York County",
									"types" : ["administrative_area_level_2", "political"]
								}, {
									"long_name" : "New Jersey",
									"short_name" : "NJ",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "Liberty Island, New York, NJ, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 40.691185,
										"lng" : -74.0435129
									},
									"southwest" : {
										"lat" : 40.68854210000001,
										"lng" : -74.0472852
									}
								},
								"location" : {
									"lat" : 40.6900495,
									"lng" : -74.0450675
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 40.69121253029151,
										"lng" : -74.0435129
									},
									"southwest" : {
										"lat" : 40.68851456970851,
										"lng" : -74.0472852
									}
								}
							},
							"types" : ["neighborhood", "political"]
						}, {
							"address_components" : [{
									"long_name" : "11231",
									"short_name" : "11231",
									"types" : ["postal_code"]
								}, {
									"long_name" : "Brooklyn",
									"short_name" : "Brooklyn",
									"types" : ["sublocality_level_1", "sublocality", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "Brooklyn, NY 11231, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 40.6937918,
										"lng" : -73.9880799
									},
									"southwest" : {
										"lat" : 40.664569,
										"lng" : -74.0478164
									}
								},
								"location" : {
									"lat" : 40.6772802,
									"lng" : -74.0094471
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 40.6937918,
										"lng" : -73.9880799
									},
									"southwest" : {
										"lat" : 40.664569,
										"lng" : -74.02666599999999
									}
								}
							},
							"types" : ["postal_code"]
						}, {
							"address_components" : [{
									"long_name" : "Manhattan",
									"short_name" : "Manhattan",
									"types" : ["sublocality_level_1", "sublocality", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "New York County",
									"short_name" : "New York County",
									"types" : ["administrative_area_level_2", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "Manhattan, New York, NY, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 40.882214,
										"lng" : -73.907
									},
									"southwest" : {
										"lat" : 40.6795479,
										"lng" : -74.047285
									}
								},
								"location" : {
									"lat" : 40.790278,
									"lng" : -73.959722
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 40.820045,
										"lng" : -73.90331300000001
									},
									"southwest" : {
										"lat" : 40.698078,
										"lng" : -74.03514899999999
									}
								}
							},
							"types" : ["sublocality_level_1", "sublocality", "political"]
						}, {
							"address_components" : [{
									"long_name" : "New York County",
									"short_name" : "New York County",
									"types" : ["administrative_area_level_2", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "New York County, NY, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 40.8792779,
										"lng" : -73.907
									},
									"southwest" : {
										"lat" : 40.6795929,
										"lng" : -74.04726289999999
									}
								},
								"location" : {
									"lat" : 40.7830603,
									"lng" : -73.9712488
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 40.8792779,
										"lng" : -73.907
									},
									"southwest" : {
										"lat" : 40.6795929,
										"lng" : -74.04726289999999
									}
								}
							},
							"types" : ["administrative_area_level_2", "political"]
						}, {
							"address_components" : [{
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "Kings County",
									"short_name" : "Kings County",
									"types" : ["administrative_area_level_2", "political"]
								}, {
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "New York, NY, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 40.91525559999999,
										"lng" : -73.70027209999999
									},
									"southwest" : {
										"lat" : 40.4913699,
										"lng" : -74.25908989999999
									}
								},
								"location" : {
									"lat" : 40.7127837,
									"lng" : -74.0059413
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 40.91525559999999,
										"lng" : -73.70027209999999
									},
									"southwest" : {
										"lat" : 40.4913699,
										"lng" : -74.25908989999999
									}
								}
							},
							"types" : ["locality", "political"]
						}, {
							"address_components" : [{
									"long_name" : "New York",
									"short_name" : "NY",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "New York, USA",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 45.015865,
										"lng" : -71.85626429999999
									},
									"southwest" : {
										"lat" : 40.4913686,
										"lng" : -79.76214379999999
									}
								},
								"location" : {
									"lat" : 43.2994285,
									"lng" : -74.21793260000001
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 45.0126113,
										"lng" : -73.24139099999999
									},
									"southwest" : {
										"lat" : 40.6997812,
										"lng" : -79.76214379999999
									}
								}
							},
							"types" : ["administrative_area_level_1", "political"]
						}, {
							"address_components" : [{
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}
							],
							"formatted_address" : "United States",
							"geometry" : {
								"bounds" : {
									"northeast" : {
										"lat" : 71.389888,
										"lng" : -66.94539469999999
									},
									"southwest" : {
										"lat" : 18.9110642,
										"lng" : 172.4458955
									}
								},
								"location" : {
									"lat" : 37.09024,
									"lng" : -95.712891
								},
								"location_type" : "APPROXIMATE",
								"viewport" : {
									"northeast" : {
										"lat" : 49.38,
										"lng" : -66.94
									},
									"southwest" : {
										"lat" : 25.82,
										"lng" : -124.39
									}
								}
							},
							"types" : ["country", "political"]
						}
					],
					"status" : "OK"
				}, {
					'content-type' : 'application/json; charset=UTF-8',
					'transfer-encoding' : 'chunked'
				});
				var input = helper.getNode("input");
				input.should.have.property('id', 'input');
				var geocoding = helper.getNode("geocoding");
				geocoding.should.have.property('id', 'geocoding');
				var output = helper.getNode("output");
				output.should.have.property('id', 'output');
				output.on("input", function (msg) {
					msg.should.have.property('payload');
					msg.payload.should.have.property('address', 'Liberty Island, 1 Liberty Island, New York, NY 10004, USA');
					msg.should.have.property('title', 'Liberty Island, 1 Liberty Island, New York, NY 10004, USA');
					msg.should.have.property('description', 'Liberty Island, 1 Liberty Island, New York, NY 10004, USA');
					msg.should.have.property('location');
					msg.location.should.have.property('address', 'Liberty Island, 1 Liberty Island, New York, NY 10004, USA');
					msg.location.should.have.property('description', 'Liberty Island, 1 Liberty Island, New York, NY 10004, USA');
					done();
				});
				input.send({
					location : {
						lat : 40.689759,
						lon : -74.045138
					}
				});
			});
		});

		it("should return lat/lon from address with no 'geocodeBy' provided", function (done) {
			helper.load([googleNode, geocodingNode], [{
						id : "input",
						type : "helper",
						wires : [["geocoding"]]
					}, {
						id : "geocoding",
						type : "google geocoding",
						wires : [["output"]],
					}, {
						id : "output",
						type : "helper"
					}
				], function () {
				nock('https://maps.googleapis.com:443')
				.get('/maps/api/geocode/json?address=1600%20Pennsylvania%20Ave%2C%20Washington%20DC')
				.reply(200, {
					"results" : [{
							"address_components" : [{
									"long_name" : "1600",
									"short_name" : "1600",
									"types" : ["street_number"]
								}, {
									"long_name" : "Pennsylvania Avenue Southeast",
									"short_name" : "Pennsylvania Ave SE",
									"types" : ["route"]
								}, {
									"long_name" : "Hill East",
									"short_name" : "Hill East",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Washington",
									"short_name" : "D.C.",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "District of Columbia",
									"short_name" : "DC",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}, {
									"long_name" : "20003",
									"short_name" : "20003",
									"types" : ["postal_code"]
								}
							],
							"formatted_address" : "1600 Pennsylvania Avenue Southeast, Washington, DC 20003, USA",
							"geometry" : {
								"location" : {
									"lat" : 38.8786589,
									"lng" : -76.9816788
								},
								"location_type" : "ROOFTOP",
								"viewport" : {
									"northeast" : {
										"lat" : 38.88000788029149,
										"lng" : -76.98032981970849
									},
									"southwest" : {
										"lat" : 38.8773099197085,
										"lng" : -76.98302778029151
									}
								}
							},
							"partial_match" : true,
							"types" : ["street_address"]
						}, {
							"address_components" : [{
									"long_name" : "1600",
									"short_name" : "1600",
									"types" : ["street_number"]
								}, {
									"long_name" : "Pennsylvania Avenue Northwest",
									"short_name" : "Pennsylvania Ave NW",
									"types" : ["route"]
								}, {
									"long_name" : "Northwest Washington",
									"short_name" : "Northwest Washington",
									"types" : ["neighborhood", "political"]
								}, {
									"long_name" : "Washington",
									"short_name" : "D.C.",
									"types" : ["locality", "political"]
								}, {
									"long_name" : "District of Columbia",
									"short_name" : "DC",
									"types" : ["administrative_area_level_1", "political"]
								}, {
									"long_name" : "United States",
									"short_name" : "US",
									"types" : ["country", "political"]
								}, {
									"long_name" : "20500",
									"short_name" : "20500",
									"types" : ["postal_code"]
								}
							],
							"formatted_address" : "1600 Pennsylvania Avenue Northwest, Washington, DC 20500, USA",
							"geometry" : {
								"location" : {
									"lat" : 38.8977332,
									"lng" : -77.0365305
								},
								"location_type" : "ROOFTOP",
								"viewport" : {
									"northeast" : {
										"lat" : 38.8990821802915,
										"lng" : -77.0351815197085
									},
									"southwest" : {
										"lat" : 38.8963842197085,
										"lng" : -77.03787948029151
									}
								}
							},
							"partial_match" : true,
							"types" : ["street_address"]
						}
					],
					"status" : "OK"
				}, {
					'content-type' : 'application/json; charset=UTF-8',
					'transfer-encoding' : 'chunked'
				});
				var input = helper.getNode("input");
				input.should.have.property('id', 'input');
				var geocoding = helper.getNode("geocoding");
				geocoding.should.have.property('id', 'geocoding');
				var output = helper.getNode("output");
				output.should.have.property('id', 'output');
				output.on("input", function (msg) {
					msg.should.have.property('payload');
					msg.payload.should.have.property('lat', 38.8786589);
					msg.payload.should.have.property('lon', -76.9816788);
					msg.should.have.property('title', '38.8786589, -76.9816788');
					msg.should.have.property('description', '38.8786589, -76.9816788');
					msg.should.have.property('location');
					msg.location.should.have.property('lat', 38.8786589);
					msg.location.should.have.property('lon', -76.9816788);
					msg.location.should.have.property('description', '38.8786589, -76.9816788');
					done();
				});
				input.send({
					location : {
						address : "1600 Pennsylvania Ave, Washington DC"
					}
				});
			});
		});

		it("warns about invalid API key for address request", function (done) {
			helper.load([googleNode, geocodingNode], [{
						id : "google-api",
						type : "google-api-config"
					}, {
						id : "input",
						type : "helper",
						wires : [["geocoding"]]
					}, {
						id : "geocoding",
						type : "google geocoding",
						wires : [["output"]],
						googleAPI : "google-api",
						geocodeBy : 'address'
					}, {
						id : "output",
						type : "helper"
					}
				], {
				"google-api" : {
					key : "INVALID-KEY"
				}
			}, function () {
				nock('https://maps.googleapis.com:443')
				.get('/maps/api/geocode/json?address=1600%20Pennsylvania%20Ave%2C%20Washington%20DC&key=INVALID-KEY')
				.reply(200, {
					error_message : "The provided API key is invalid.",
					html_attributions : [],
					results : [],
					status : "REQUEST_DENIED"
				}, {
					'content-type' : 'application/json; charset=UTF-8',
					'transfer-encoding' : 'chunked'
				});
				var input = helper.getNode("input");
				input.should.have.property('id', 'input');
				var geocoding = helper.getNode("geocoding");
				geocoding.should.have.property('id', 'geocoding');
				var output = helper.getNode("output");
				output.should.have.property('id', 'output');
				var stub = sinon.stub(geocoding, 'error', function (error) {
						stub.restore();
						stub = null;
						error.message.should.containEql("API key is invalid");
						done();
					});
				input.send({
					location: {
						address: '1600 Pennsylvania Ave, Washington DC'
					}
				});
			});
		});

		it("warns about invalid API key for coordinates request", function (done) {
			helper.load([googleNode, geocodingNode], [{
						id : "google-api",
						type : "google-api-config"
					}, {
						id : "input",
						type : "helper",
						wires : [["geocoding"]]
					}, {
						id : "geocoding",
						type : "google geocoding",
						wires : [["output"]],
						googleAPI : "google-api",
						geocodeBy : 'coordinates'
					}, {
						id : "output",
						type : "helper"
					}
				], {
				"google-api" : {
					key : "INVALID-KEY"
				}
			}, function () {
				nock('https://maps.googleapis.com:443')
				.get('/maps/api/geocode/json?latlng=40.689759%2C-74.045138&key=INVALID-KEY')
				.reply(200, {
					error_message : "The provided API key is invalid.",
					html_attributions : [],
					results : [],
					status : "REQUEST_DENIED"
				}, {
					'content-type' : 'application/json; charset=UTF-8',
					'transfer-encoding' : 'chunked'
				});
				var input = helper.getNode("input");
				input.should.have.property('id', 'input');
				var geocoding = helper.getNode("geocoding");
				geocoding.should.have.property('id', 'geocoding');
				var output = helper.getNode("output");
				output.should.have.property('id', 'output');
				var stub = sinon.stub(geocoding, 'error', function (error) {
						stub.restore();
						stub = null;
						error.message.should.containEql("API key is invalid");
						done();
					});
				input.send({
					location : {
						lat : 40.689759,
						lon : -74.045138
					}
				});
			});
		});
		
	});

});
