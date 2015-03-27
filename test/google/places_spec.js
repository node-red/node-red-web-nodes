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

var should = require("should");
var sinon = require("sinon");
var url = require('url');
var googleNode = require("../../google/google.js");
var placesNode = require("../../google/places.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('google places', function () {

    before(function (done) {
        helper.startServer(done);
    });

    afterEach(function () {
        helper.unload();
    });

    describe("query node", function () {

        describe("places text request", function () {

            it('can be loaded without credentials', function (done) {
                helper.load(placesNode,
                    [{
                            id : "places",
                            type : "google places"
                        }
                    ], function () {
                    var n = helper.getNode("places");
                    n.should.have.property('id', 'places');
                    done();
                });
            });

            if (!nock)
                return;
            it("should return lat/lon from postcode", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=SE10%208XJ&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        status : "OK",
                        results : [{
                                icon : "http://example.com/icon.png",
                                types : ["postal_code"],
                                name : "SE10 8XJ",
                                formatted_address : "London SE10 8XJ, UK",
                                reference : "ref",
                                place_id : "pid1",
                                geometry : {
                                    viewport : {
                                        southwest : {
                                            lat : 51.4755341,
                                            lng : -0.0039509
                                        },
                                        northeast : {
                                            lat : 51.4808968,
                                            lng : 0.0037231
                                        }
                                    },
                                    location : {
                                        lat : 51.4778051,
                                        lng : -0.00143
                                    }
                                },
                                id : "id1"
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
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
                    input.send({
                        payload : 'SE10 8XJ'
                    });
                });
            });

            it("should return place in vicinity", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?location=51.5%2C0&radius=50000&query=Subway&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        next_page_token : "NPT",
                        status : "OK",
                        results : [{
                                icon : "http://example.com/icon.png",
                                types : [
                                    "meal_takeaway",
                                    "restaurant",
                                    "food",
                                    "establishment"
                                ],
                                opening_hours : {
                                    open_now : true,
                                    weekday_text : []
                                },
                                name : "SUBWAY Royal Victoria Dock",
                                price_level : 1,
                                formatted_address : "The Excel Centre, Western Gateway, Royal Victoria Dock, London, London & Greater London E16 1XL, United Kingdom",
                                reference : "ref2",
                                place_id : "pid2",
                                geometry : {
                                    location : {
                                        lat : 51.507998,
                                        lng : 0.030968
                                    }
                                },
                                id : "id2"
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
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
                        payload : 'Subway',
                        location : {
                            lat : 51.5,
                            lon : 0
                        }
                    });
                });
            });

            it("warns about invalid API key", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api"
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
                    .get('/maps/api/place/textsearch/json?query=foobar&key=INVALID-KEY')
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
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    var sinon = require("sinon");
                    var stub = sinon.stub(places, 'error', function (err) {
                            stub.restore();
                            stub = null;
                            err.message.should.containEql("API key is invalid");
                            done();
                        });
                    input.send({
                        payload : 'foobar'
                    });
                });
            });

            it("should return a single result", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            outputnumber : 1,
                            outputas : 'single'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=Restaurants%20in%20Washington%20DC&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        next_page_token : "NPT",
                        status : "OK",
                        results : [{
                                "formatted_address" : "2132 Florida Avenue Northwest, Washington, DC 20008, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.91276,
                                        "lng" : -77.047158
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Restaurant Nora",
                                "opening_hours" : {
                                    "open_now" : false,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid1",
                                "price_level" : 3,
                                "rating" : 4,
                                "reference" : "ref1",
                                "types" : ["restaurant", "food", "establishment"]
                            }, {
                                "formatted_address" : "1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.904436,
                                        "lng" : -77.062631
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Filomena Ristorante",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "price_level" : 2,
                                "rating" : 3.9,
                                "reference" : "ref2",
                                "types" : ["bar", "restaurant", "food", "establishment"]
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('payload', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.payload.should.not.be.an.Array;
                        msg.should.have.property('title', 'Restaurant Nora');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.91276);
                        msg.location.should.have.property('lon', -77.047158);
                        msg.location.should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.location.should.have.property('address', '2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.should.have.property('placeid', 'pid1');
                        done();
                    });
                    input.send({
                        payload : 'Restaurants in Washington DC'
                    });
                });
            });

            it("should return multiple results in a single message", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            outputnumber : 20,
                            outputas : 'single'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=Restaurants%20in%20Washington%20DC&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        next_page_token : "NPT",
                        status : "OK",
                        results : [{
                                "formatted_address" : "2132 Florida Avenue Northwest, Washington, DC 20008, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.91276,
                                        "lng" : -77.047158
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Restaurant Nora",
                                "opening_hours" : {
                                    "open_now" : false,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid1",
                                "price_level" : 3,
                                "rating" : 4,
                                "reference" : "ref1",
                                "types" : ["restaurant", "food", "establishment"]
                            }, {
                                "formatted_address" : "1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.904436,
                                        "lng" : -77.062631
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Filomena Ristorante",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "price_level" : 2,
                                "rating" : 3.9,
                                "reference" : "ref2",
                                "types" : ["bar", "restaurant", "food", "establishment"]
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('payload');
                        msg.payload.should.be.an.Array;
                        msg.payload.length.should.equal(2);
                        msg.should.have.property('title', '2 results returned');
                        msg.should.not.have.property('location');
                        msg.should.not.have.property('placeid');
                        msg.should.not.have.property('description');
                        msg.payload[0].should.have.property('payload', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.payload[0].payload.should.not.be.an.Array;
                        msg.payload[0].should.have.property('title', 'Restaurant Nora');
                        msg.payload[0].should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States')
                        msg.payload[0].should.have.property('location');
                        msg.payload[0].location.should.have.property('lat', 38.91276);
                        msg.payload[0].location.should.have.property('lon', -77.047158);
                        msg.payload[0].location.should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.payload[0].location.should.have.property('address', '2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.payload[0].should.have.property('placeid', 'pid1');

                        msg.payload[1].should.have.property('payload', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                        msg.payload[1].payload.should.not.be.an.Array;
                        msg.payload[1].should.have.property('title', 'Filomena Ristorante');
                        msg.payload[1].should.have.property('description', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States')
                        msg.payload[1].should.have.property('location');
                        msg.payload[1].location.should.have.property('lat', 38.904436);
                        msg.payload[1].location.should.have.property('lon', -77.062631);
                        msg.payload[1].location.should.have.property('description', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                        msg.payload[1].location.should.have.property('address', '1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                        msg.payload[1].should.have.property('placeid', 'pid2');
                        done();
                    });
                    input.send({
                        payload : 'Restaurants in Washington DC'
                    });
                });
            });

            it("should return multiple results in a multiple messages", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            outputnumber : 20,
                            outputas : 'multiple'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=Restaurants%20in%20Washington%20DC&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        next_page_token : "NPT",
                        status : "OK",
                        results : [{
                                "formatted_address" : "2132 Florida Avenue Northwest, Washington, DC 20008, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.91276,
                                        "lng" : -77.047158
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Restaurant Nora",
                                "opening_hours" : {
                                    "open_now" : false,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid1",
                                "price_level" : 3,
                                "rating" : 4,
                                "reference" : "ref1",
                                "types" : ["restaurant", "food", "establishment"]
                            }, {
                                "formatted_address" : "1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.904436,
                                        "lng" : -77.062631
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Filomena Ristorante",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "price_level" : 2,
                                "rating" : 3.9,
                                "reference" : "ref2",
                                "types" : ["bar", "restaurant", "food", "establishment"]
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    var msgs = [];
                    output.on("input", function (msg) {
                        msgs.push(msg);
                        if (msgs.length == 2) {
                            msgs[0].should.have.property('payload', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                            msgs[0].payload.should.not.be.an.Array;
                            msgs[0].should.have.property('title', 'Restaurant Nora');
                            msgs[0].should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States')
                            msgs[0].should.have.property('location');
                            msgs[0].location.should.have.property('lat', 38.91276);
                            msgs[0].location.should.have.property('lon', -77.047158);
                            msgs[0].location.should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                            msgs[0].location.should.have.property('address', '2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                            msgs[0].should.have.property('placeid', 'pid1');

                            msgs[1].should.have.property('payload', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                            msgs[1].payload.should.not.be.an.Array;
                            msgs[1].should.have.property('title', 'Filomena Ristorante');
                            msgs[1].should.have.property('description', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States')
                            msgs[1].should.have.property('location');
                            msgs[1].location.should.have.property('lat', 38.904436);
                            msgs[1].location.should.have.property('lon', -77.062631);
                            msgs[1].location.should.have.property('description', 'Filomena Ristorante, 1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                            msgs[1].location.should.have.property('address', '1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States');
                            msgs[1].should.have.property('placeid', 'pid2');

                            done();
                        } else if (msgs.length < 2) { //haven't gotten all msgs yet
                            return;
                        } else { //should never get here
                            done('Something went terribly wrong here...');
                        }
                    });
                    input.send({
                        payload : 'Restaurants in Washington DC'
                    });
                });
            });

            it("should have additional details attached", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            outputnumber : 1,
                            outputas : 'single'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/textsearch/json?query=Restaurants%20in%20Washington%20DC&key=KEY')
                    .reply(200, {
                        html_attributions : [],
                        next_page_token : "NPT",
                        status : "OK",
                        results : [{
                                "formatted_address" : "2132 Florida Avenue Northwest, Washington, DC 20008, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.91276,
                                        "lng" : -77.047158
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Restaurant Nora",
                                "opening_hours" : {
                                    "open_now" : false,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid1",
                                "price_level" : 3,
                                "rating" : 4,
                                "reference" : "ref1",
                                "types" : ["restaurant", "food", "establishment"]
                            }, {
                                "formatted_address" : "1063 Wisconsin Avenue Northwest, Washington, DC 20007, United States",
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.904436,
                                        "lng" : -77.062631
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Filomena Ristorante",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "price_level" : 2,
                                "rating" : 3.9,
                                "reference" : "ref2",
                                "types" : ["bar", "restaurant", "food", "establishment"]
                            }
                        ]
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('payload', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.payload.should.not.be.an.Array;
                        msg.should.have.property('title', 'Restaurant Nora');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.91276);
                        msg.location.should.have.property('lon', -77.047158);
                        msg.location.should.have.property('description', 'Restaurant Nora, 2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.location.should.have.property('address', '2132 Florida Avenue Northwest, Washington, DC 20008, United States');
                        msg.should.have.property('placeid', 'pid1');
                        msg.should.have.property('detailsJson');
                        msg.detailsJson.should.have.properties(['placeid', 'name', 'address', 'types', 'pricelevel', 'rating', 'opennow']);
                        done();
                    });
                    input.send({
                        payload : 'Restaurants in Washington DC'
                    });
                });
            });

        }); //end places text

        describe("places nearby request", function () {

            it('can be loaded without credentials', function (done) {
                helper.load(placesNode,
                    [{
                            id : "places",
                            type : "google places"
                        }
                    ], function () {
                    var n = helper.getNode("places");
                    n.should.have.property('id', 'places');
                    done();
                });
            });

            if (!nock)
                return;
            it("should return business information", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesNearby"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/nearbysearch/json?location=38.8786589%2C-76.9816788&radius=500&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "results" : [{
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8730523,
                                        "lng" : -76.98338769999999
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.877727,
                                            "lng" : -76.97633689999999
                                        },
                                        "southwest" : {
                                            "lat" : 38.8703838,
                                            "lng" : -76.99116149999999
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Anacostia Park, Section D",
                                "place_id" : "pid1",
                                "reference" : "ref1",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }, {
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8925805,
                                        "lng" : -76.971507
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.8975538,
                                            "lng" : -76.9595896
                                        },
                                        "southwest" : {
                                            "lat" : 38.87801899999999,
                                            "lng" : -76.9806018
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Anacostia Park Section F",
                                "place_id" : "pid2",
                                "reference" : "ref2",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }
                        ],
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('title', 'Anacostia Park, Section D');
                        msg.should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.should.have.property('placeid', 'pid1');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.8730523);
                        msg.location.should.have.property('lon', -76.98338769999999);
                        msg.location.should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.location.should.have.property('vicinity', 'Washington');
                        msg.should.have.property('payload');
                        msg.payload.should.have.property('placeid', 'pid1');
                        msg.payload.should.have.property('name', 'Anacostia Park, Section D');
                        msg.payload.should.have.property('vicinity', 'Washington');
                        msg.payload.should.have.property('types', ['park', 'establishment']);
                        done();
                    });
                    input.send({
                        location : {
                            lat : 38.8786589,
                            lon : -76.9816788,
                            radius : 500
                        }
                    });
                });
            });

            it("should return a single result", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesNearby"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/nearbysearch/json?location=38.8786589%2C-76.9816788&radius=500&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "results" : [{
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8730523,
                                        "lng" : -76.98338769999999
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.877727,
                                            "lng" : -76.97633689999999
                                        },
                                        "southwest" : {
                                            "lat" : 38.8703838,
                                            "lng" : -76.99116149999999
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Anacostia Park, Section D",
                                "place_id" : "pid1",
                                "reference" : "ref1",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }, {
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8925805,
                                        "lng" : -76.971507
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.8975538,
                                            "lng" : -76.9595896
                                        },
                                        "southwest" : {
                                            "lat" : 38.87801899999999,
                                            "lng" : -76.9806018
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Anacostia Park Section F",
                                "place_id" : "pid2",
                                "reference" : "ref2",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }
                        ],
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('title', 'Anacostia Park, Section D');
                        msg.should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.should.have.property('placeid', 'pid1');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.8730523);
                        msg.location.should.have.property('lon', -76.98338769999999);
                        msg.location.should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.location.should.have.property('vicinity', 'Washington');
                        msg.should.have.property('payload');
                        msg.payload.should.not.be.an.Array;
                        msg.payload.should.have.property('placeid', 'pid1');
                        msg.payload.should.have.property('name', 'Anacostia Park, Section D');
                        msg.payload.should.have.property('vicinity', 'Washington');
                        msg.payload.should.have.property('types', ['park', 'establishment']);
                        done();
                    });
                    input.send({
                        location : {
                            lat : 38.8786589,
                            lon : -76.9816788,
                            radius : 500
                        }
                    });
                });
            });

            it("should return multiple results as a single msg", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesNearby",
                            outputnumber : 20,
                            outputas : 'single'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/nearbysearch/json?location=38.8786589%2C-76.9816788&radius=500&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "results" : [{
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8730523,
                                        "lng" : -76.98338769999999
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.877727,
                                            "lng" : -76.97633689999999
                                        },
                                        "southwest" : {
                                            "lat" : 38.8703838,
                                            "lng" : -76.99116149999999
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Anacostia Park, Section D",
                                "place_id" : "pid1",
                                "reference" : "ref1",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }, {
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.88128,
                                        "lng" : -76.98056200000001
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Congressional Cemetery",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "rating" : 4.2,
                                "reference" : "ref2",
                                "scope" : "GOOGLE",
                                "types" : ["cemetery", "establishment"],
                                "vicinity" : "1801 E Street Southeast, Washington"
                            }
                        ],
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('title', '2 results returned');
                        msg.should.not.have.property('description');
                        msg.should.not.have.property('placeid');
                        msg.should.have.property('payload');
                        msg.payload.should.be.an.Array;

                        msg.payload[0].should.have.property('title', 'Anacostia Park, Section D');
                        msg.payload[0].should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.payload[0].should.have.property('placeid', 'pid1');
                        msg.payload[0].should.have.property('location');
                        msg.payload[0].location.should.have.property('lat', 38.8730523);
                        msg.payload[0].location.should.have.property('lon', -76.98338769999999);
                        msg.payload[0].location.should.have.property('description', 'Anacostia Park, Section D, Washington');
                        msg.payload[0].location.should.have.property('vicinity', 'Washington');
                        msg.payload[0].should.have.property('payload');
                        msg.payload[0].payload.should.not.be.an.Array;
                        msg.payload[0].payload.should.have.property('placeid', 'pid1');
                        msg.payload[0].payload.should.have.property('name', 'Anacostia Park, Section D');
                        msg.payload[0].payload.should.have.property('vicinity', 'Washington');
                        msg.payload[0].payload.should.have.property('types', ['park', 'establishment']);

                        msg.payload[1].should.have.property('title', 'Congressional Cemetery');
                        msg.payload[1].should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                        msg.payload[1].should.have.property('placeid', 'pid2');
                        msg.payload[1].should.have.property('location');
                        msg.payload[1].location.should.have.property('lat', 38.88128);
                        msg.payload[1].location.should.have.property('lon', -76.98056200000001);
                        msg.payload[1].location.should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                        msg.payload[1].location.should.have.property('vicinity', '1801 E Street Southeast, Washington');
                        msg.payload[1].should.have.property('payload');
                        msg.payload[1].payload.should.not.be.an.Array;
                        msg.payload[1].payload.should.have.property('placeid', 'pid2');
                        msg.payload[1].payload.should.have.property('name', 'Congressional Cemetery');
                        msg.payload[1].payload.should.have.property('vicinity', '1801 E Street Southeast, Washington');
                        msg.payload[1].payload.should.have.property('types', ['cemetery', 'establishment']);

                        done();
                    });
                    input.send({
                        location : {
                            lat : 38.8786589,
                            lon : -76.9816788,
                            radius : 500
                        }
                    });
                });
            });

            it("should return multiple results as multiple msgs", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesNearby",
                            outputnumber : 20,
                            outputas : 'multiple'
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/nearbysearch/json?location=38.8786589%2C-76.9816788&radius=500&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "results" : [{
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.8730523,
                                        "lng" : -76.98338769999999
                                    },
                                    "viewport" : {
                                        "northeast" : {
                                            "lat" : 38.877727,
                                            "lng" : -76.97633689999999
                                        },
                                        "southwest" : {
                                            "lat" : 38.8703838,
                                            "lng" : -76.99116149999999
                                        }
                                    }
                                },
                                "icon" : "http://example.com/icon1.png",
                                "id" : "id1",
                                "name" : "Anacostia Park, Section D",
                                "place_id" : "pid1",
                                "reference" : "ref1",
                                "scope" : "GOOGLE",
                                "types" : ["park", "establishment"],
                                "vicinity" : "Washington"
                            }, {
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.88128,
                                        "lng" : -76.98056200000001
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id2",
                                "name" : "Congressional Cemetery",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid2",
                                "rating" : 4.2,
                                "reference" : "ref2",
                                "scope" : "GOOGLE",
                                "types" : ["cemetery", "establishment"],
                                "vicinity" : "1801 E Street Southeast, Washington"
                            }
                        ],
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    var msgs = [];
                    output.on("input", function (msg) {
                        msgs.push(msg);
                        if (msgs.length == 2) {
                            msgs[0].should.have.property('title', 'Anacostia Park, Section D');
                            msgs[0].should.have.property('description', 'Anacostia Park, Section D, Washington');
                            msgs[0].should.have.property('placeid', 'pid1');
                            msgs[0].should.have.property('location');
                            msgs[0].location.should.have.property('lat', 38.8730523);
                            msgs[0].location.should.have.property('lon', -76.98338769999999);
                            msgs[0].location.should.have.property('description', 'Anacostia Park, Section D, Washington');
                            msgs[0].location.should.have.property('vicinity', 'Washington');
                            msgs[0].should.have.property('payload');
                            msgs[0].payload.should.not.be.an.Array;
                            msgs[0].payload.should.have.property('placeid', 'pid1');
                            msgs[0].payload.should.have.property('name', 'Anacostia Park, Section D');
                            msgs[0].payload.should.have.property('vicinity', 'Washington');
                            msgs[0].payload.should.have.property('types', ['park', 'establishment']);

                            msgs[1].should.have.property('title', 'Congressional Cemetery');
                            msgs[1].should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                            msgs[1].should.have.property('placeid', 'pid2');
                            msgs[1].should.have.property('location');
                            msgs[1].location.should.have.property('lat', 38.88128);
                            msgs[1].location.should.have.property('lon', -76.98056200000001);
                            msgs[1].location.should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                            msgs[1].location.should.have.property('vicinity', '1801 E Street Southeast, Washington');
                            msgs[1].should.have.property('payload');
                            msgs[1].payload.should.not.be.an.Array;
                            msgs[1].payload.should.have.property('placeid', 'pid2');
                            msgs[1].payload.should.have.property('name', 'Congressional Cemetery');
                            msgs[1].payload.should.have.property('vicinity', '1801 E Street Southeast, Washington');
                            msgs[1].payload.should.have.property('types', ['cemetery', 'establishment']);

                            done();
                        } else if (msgs.length < 2) { //haven't gotten all msgs yet
                            return;
                        } else { //should never get here
                            done('Something went terribly wrong here...');
                        }
                    });
                    input.send({
                        location : {
                            lat : 38.8786589,
                            lon : -76.9816788,
                            radius : 500
                        }
                    });
                });
            });

            it("should attach additional details", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesNearby"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/nearbysearch/json?location=38.88128%2C-76.980562&radius=500&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "results" : [{
                                "geometry" : {
                                    "location" : {
                                        "lat" : 38.88128,
                                        "lng" : -76.98056200000001
                                    }
                                },
                                "icon" : "http://example.com/icon2.png",
                                "id" : "id1",
                                "name" : "Congressional Cemetery",
                                "opening_hours" : {
                                    "open_now" : true,
                                    "weekday_text" : []
                                },
                                "place_id" : "pid1",
                                "rating" : 4.2,
                                "reference" : "ref1",
                                "scope" : "GOOGLE",
                                "types" : ["cemetery", "establishment"],
                                "vicinity" : "1801 E Street Southeast, Washington"
                            }
                        ],
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('title', 'Congressional Cemetery');
                        msg.should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                        msg.should.have.property('placeid', 'pid1');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.88128);
                        msg.location.should.have.property('lon', -76.98056200000001);
                        msg.location.should.have.property('description', 'Congressional Cemetery, 1801 E Street Southeast, Washington');
                        msg.location.should.have.property('vicinity', '1801 E Street Southeast, Washington');
                        msg.should.have.property('payload');
                        msg.payload.should.not.be.an.Array;
                        msg.payload.should.have.properties(['placeid', 'name', 'vicinity', 'types', 'rating', 'opennow'])
                        done();
                    });
                    input.send({
                        location : {
                            lat : 38.88128,
                            lon : -76.980562,
                            radius : 500
                        }
                    });
                });
            });

            it("warns about invalid API key", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : 'placesNearby'
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
                    .get('/maps/api/place/nearbysearch/json?location=0%2C0&radius=500&key=INVALID-KEY')
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
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    var sinon = require("sinon");
                    var stub = sinon.stub(places, 'error', function (err) {
                            stub.restore();
                            stub = null;
                            err.message.should.containEql("API key is invalid");
                            done();
                        });
                    input.send({
                        location : {
                            lat : 0,
                            lon : 0,
                            radius : 500
                        }
                    });
                });
            });

        }); //end places nearby

        describe("places details request", function () {

            it('can be loaded without credentials', function (done) {
                helper.load(placesNode,
                    [{
                            id : "places",
                            type : "google places"
                        }
                    ], function () {
                    var n = helper.getNode("places");
                    n.should.have.property('id', 'places');
                    done();
                });
            });

            if (!nock)
                return;
            it("should return business details", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : "placesDetails"
                        }, {
                            id : "output",
                            type : "helper"
                        }
                    ], {
                    "google-api" : {
                        key : "KEY"
                    }
                }, function () {
                    nock('https://maps.googleapis.com:443')
                    .get('/maps/api/place/details/json?placeid=ChIJoZNwK0u4t4kRP-WslpNv7vo&key=KEY')
                    .reply(200, {
                        "html_attributions" : [],
                        "next_page_token" : "NPT",
                        "result" : {
                            "address_components" : [{
                                    "long_name" : "1432",
                                    "short_name" : "1432",
                                    "types" : ["street_number"]
                                }, {
                                    "long_name" : "Pennsylvania Avenue Southeast",
                                    "short_name" : "Pennsylvania Avenue Southeast",
                                    "types" : ["route"]
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
                            "adr_address" : "\u003cspan class=\"street-address\"\u003e1432 Pennsylvania Avenue Southeast\u003c/span\u003e, \u003cspan class=\"locality\"\u003eWashington\u003c/span\u003e, \u003cspan class=\"region\"\u003eDC\u003c/span\u003e \u003cspan class=\"postal-code\"\u003e20003\u003c/span\u003e, \u003cspan class=\"country-name\"\u003eUnited States\u003c/span\u003e",
                            "formatted_address" : "1432 Pennsylvania Avenue Southeast, Washington, DC 20003, United States",
                            "formatted_phone_number" : "(202) 543-2323",
                            "geometry" : {
                                "location" : {
                                    "lat" : 38.880106,
                                    "lng" : -76.984193
                                }
                            },
                            "icon" : "http://maps.gstatic.com/mapfiles/place_api/icons/bar-71.png",
                            "id" : "id1",
                            "international_phone_number" : "+1 202-543-2323",
                            "name" : "Wisdom",
                            "opening_hours" : {
                                "open_now" : true,
                                "periods" : [{
                                        "close" : {
                                            "day" : 1,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 0,
                                            "time" : "1730"
                                        }
                                    }, {
                                        "close" : {
                                            "day" : 3,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 2,
                                            "time" : "1730"
                                        }
                                    }, {
                                        "close" : {
                                            "day" : 4,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 3,
                                            "time" : "1730"
                                        }
                                    }, {
                                        "close" : {
                                            "day" : 5,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 4,
                                            "time" : "1730"
                                        }
                                    }, {
                                        "close" : {
                                            "day" : 6,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 5,
                                            "time" : "1730"
                                        }
                                    }, {
                                        "close" : {
                                            "day" : 0,
                                            "time" : "0000"
                                        },
                                        "open" : {
                                            "day" : 6,
                                            "time" : "1730"
                                        }
                                    }
                                ],
                                "weekday_text" : [
                                    "Monday: Closed",
                                    "Tuesday: 5:30 pm – 12:00 am",
                                    "Wednesday: 5:30 pm – 12:00 am",
                                    "Thursday: 5:30 pm – 12:00 am",
                                    "Friday: 5:30 pm – 12:00 am",
                                    "Saturday: 5:30 pm – 12:00 am",
                                    "Sunday: 5:30 pm – 12:00 am"
                                ]
                            },
                            "place_id" : "ChIJoZNwK0u4t4kRP-WslpNv7vo",
                            "price_level" : 3,
                            "rating" : 4.4,
                            "reference" : "ref1",
                            "reviews" : [{
                                    "aspects" : [{
                                            "rating" : 3,
                                            "type" : "overall"
                                        }
                                    ],
                                    "author_name" : "Reviewer A",
                                    "author_url" : "https://plus.google.com/reviewer1",
                                    "language" : "en",
                                    "rating" : 5,
                                    "text" : "Review Text!",
                                    "time" : 1000000000
                                }
                            ],
                            "scope" : "GOOGLE",
                            "types" : ["night_club", "bar", "establishment"],
                            "url" : "https://plus.google.com/112120847116880347097/about?hl=en-US",
                            "user_ratings_total" : 11,
                            "utc_offset" : -300,
                            "vicinity" : "1432 Pennsylvania Avenue Southeast, Washington",
                            "website" : "http://dcwisdom.com/"
                        },
                        "status" : "OK"
                    }, {
                        'content-type' : 'application/json; charset=UTF-8',
                        'transfer-encoding' : 'chunked'
                    });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('title', 'Wisdom');
                        msg.should.have.property('description', 'Wisdom, 1432 Pennsylvania Avenue Southeast, Washington, DC 20003, United States');
                        msg.should.have.property('placeid', 'ChIJoZNwK0u4t4kRP-WslpNv7vo');
                        msg.should.have.property('location');
                        msg.location.should.have.property('lat', 38.880106);
                        msg.location.should.have.property('lon', -76.984193);
                        msg.location.should.have.property('description', 'Wisdom, 1432 Pennsylvania Avenue Southeast, Washington, DC 20003, United States');
                        msg.location.should.have.property('address', '1432 Pennsylvania Avenue Southeast, Washington, DC 20003, United States');
                        msg.should.have.property('payload');
                        msg.payload.should.have.property('name', 'Wisdom');
                        msg.payload.should.have.property('address', '1432 Pennsylvania Avenue Southeast, Washington, DC 20003, United States');
                        msg.payload.should.have.property('phone', '(202) 543-2323');
                        msg.payload.should.have.property('website', 'http://dcwisdom.com/');
                        msg.payload.should.have.property('rating', 4.4);
                        msg.payload.should.have.property('pricelevel', 3);
                        msg.payload.should.have.property('opennow', true);
                        done();
                    });
                    input.send({
                        placeid : 'ChIJoZNwK0u4t4kRP-WslpNv7vo'
                    });
                });
            });

            it("warns about invalid API key", function (done) {
                helper.load([googleNode, placesNode], [{
                            id : "google-api",
                            type : "google-api-config"
                        }, {
                            id : "input",
                            type : "helper",
                            wires : [["places"]]
                        }, {
                            id : "places",
                            type : "google places",
                            wires : [["output"]],
                            googleAPI : "google-api",
                            reqType : 'placesDetails'
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
                    .get('/maps/api/place/details/json?placeid=ChIJoZNwK0u4t4kRP-WslpNv7vo&key=INVALID-KEY')
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
                    var places = helper.getNode("places");
                    places.should.have.property('id', 'places');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    var sinon = require("sinon");
                    var stub = sinon.stub(places, 'error', function (err) {
                            stub.restore();
                            stub = null;
                            err.message.should.containEql("API key is invalid");
                            done();
                        });
                    input.send({
                        placeid : 'ChIJoZNwK0u4t4kRP-WslpNv7vo'
                    });
                });
            });

        }); //end places details
    });
});
