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

var should = require("should");
var sinon = require("sinon");
var url = require('url');
var googleNode = require("../../google/google.js");
var placesNode = require("../../google/places.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('google places', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    describe("query node", function() {

        it('can be loaded without credentials', function(done) {
            helper.load(placesNode,
                        [{id:"places",type:"google places"}], function() {
                var n = helper.getNode("places");
                n.should.have.property('id', 'places');
                done();
            });
        });

        if (!nock) return;
        it("should return lat/lon from postcode", function(done) {
            helper.load([googleNode, placesNode], [
                {id: "google-api", type: "google-api-config"},
                {id: "input", type: "helper", wires: [["places"]]},
                {id: "places", type: "google places", wires: [["output"]],
                    googleAPI: "google-api"},
                {id: "output", type: "helper"}
            ], {
                "google-api": {
                    key: "KEY"
                }
            }, function() {
                nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=SE10%208XJ&key=KEY')
                    .reply(200, {
                        html_attributions: [],
                        status: "OK",
                        results: [ {
                            icon: "http://example.com/icon.png",
                            types: [ "postal_code" ],
                            name: "SE10 8XJ",
                            formatted_address: "London SE10 8XJ, UK",
                            reference: "ref",
                            place_id: "pid1",
                            geometry: {
                                viewport: {
                                    southwest: {
                                        lat: 51.4755341,
                                        lng: -0.0039509
                                    },
                                    northeast: {
                                        lat: 51.4808968,
                                        lng: 0.0037231
                                    }
                                },
                                location: {
                                    lat: 51.4778051,
                                    lng: -0.00143
                                }
                            },
                            id: "id1"
                        }
                        ]
                    }, {
                        'content-type': 'application/json; charset=UTF-8',
                        'transfer-encoding': 'chunked' });
                var input = helper.getNode("input");
                input.should.have.property('id', 'input');
                var places = helper.getNode("places");
                places.should.have.property('id', 'places');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                output.on("input", function(msg) {
                    msg.should.have.property('payload',
                        'SE10 8XJ, London SE10 8XJ, UK');
                    msg.should.have.property('title', 'SE10 8XJ');
					msg.should.have.property('location');
					msg.location.should.have.property('lat', 51.4778051);
					msg.location.should.have.property('lon', -0.00143);
					msg.location.should.have.property('description', 'SE10 8XJ, London SE10 8XJ, UK');
					msg.location.should.have.property('address', 'London SE10 8XJ, UK');
                    done();
                });
                input.send({ payload: 'SE10 8XJ' });
            });
        });

        it("should return place in vicinity", function(done) {
            helper.load([googleNode, placesNode], [
                {id: "google-api", type: "google-api-config"},
                {id: "input", type: "helper", wires: [["places"]]},
                {id: "places", type: "google places", wires: [["output"]],
                    googleAPI: "google-api"},
                {id: "output", type: "helper"}
            ], {
                "google-api": {
                    key: "KEY"
                }
            }, function() {
                nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?location=51.5%2C0&radius=50000&query=Subway&key=KEY')
                    .reply(200, {
                        html_attributions: [],
                        next_page_token: "NPT",
                        status: "OK",
                        results: [ {
                            icon: "http://example.com/icon.png",
                            types: [
                                "meal_takeaway",
                                "restaurant",
                                "food",
                                "establishment"
                            ],
                            opening_hours: {
                                open_now: true,
                                weekday_text: []
                            },
                            name: "SUBWAY Royal Victoria Dock",
                            price_level: 1,
                            formatted_address: "The Excel Centre, Western Gateway, Royal Victoria Dock, London, London & Greater London E16 1XL, United Kingdom",
                            reference: "ref2",
                            place_id: "pid2",
                            geometry: {
                                location: {
                                    lat: 51.507998,
                                    lng: 0.030968
                                }
                            },
                            id: "id2"
                        } ]
                    }, {
                        'content-type': 'application/json; charset=UTF-8',
                        'transfer-encoding': 'chunked' });
                var input = helper.getNode("input");
                input.should.have.property('id', 'input');
                var places = helper.getNode("places");
                places.should.have.property('id', 'places');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                output.on("input", function(msg) {
                    msg.should.have.property('payload',
                        'SUBWAY Royal Victoria Dock, The Excel Centre, Western Gateway, Royal Victoria Dock, London, London & Greater London E16 1XL, United Kingdom');
                    msg.should.have.property('title', 'SUBWAY Royal Victoria Dock');
					msg.should.have.property('location');
					msg.location.should.have.property('lat', 51.507998);
					msg.location.should.have.property('lon', 0.030968);
					msg.location.should.have.property('description', 'SUBWAY Royal Victoria Dock, The Excel Centre, Western Gateway, Royal Victoria Dock, London, London & Greater London E16 1XL, United Kingdom');
					msg.location.should.have.property('address', 'The Excel Centre, Western Gateway, Royal Victoria Dock, London, London & Greater London E16 1XL, United Kingdom');
                    done();
                });
                input.send({
                    payload: 'Subway',
                    location: {
                        lat: 51.5,
                        lon: 0
                    }
                });
            });
        });

        it("warns about invalid API key", function(done) {
            helper.load([googleNode, placesNode], [
                {id: "google-api", type: "google-api-config"},
                {id: "input", type: "helper", wires: [["places"]]},
                {id: "places", type: "google places", wires: [["output"]],
                    googleAPI: "google-api"},
                {id: "output", type: "helper"}
            ], {
                "google-api": {
                    key: "INVALID-KEY"
                }
            }, function() {
                nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=foobar&key=INVALID-KEY')
                    .reply(200, {
                        error_message: "The provided API key is invalid.",
                        html_attributions:[],
                        results:[],
                        status:"REQUEST_DENIED"
                    }, {
                        'content-type': 'application/json; charset=UTF-8',
                        'transfer-encoding': 'chunked' });
                var input = helper.getNode("input");
                input.should.have.property('id', 'input');
                var places = helper.getNode("places");
                places.should.have.property('id', 'places');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                var sinon = require("sinon");
                var stub = sinon.stub(places, 'warn', function(warning) {
                    stub.restore();
                    stub = null;
                    warning.should.containEql("API key is invalid");
                    done();
                });
                input.send({ payload: 'foobar' });
            });
        });
    });
});
