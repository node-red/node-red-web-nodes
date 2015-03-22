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
var weatherNode = require("../../openweathermap/weather.js");
var helper = require("../helper.js");
var nock = helper.nock;
var sinon = require("sinon");

describe('weather nodes', function() {

    var weatherDataTest = function(weatherdata, locationdata, timedata){
        timedata.toUTCString().should.be.exactly("Wed, 08 Oct 2014 14:00:48 GMT");
        weatherdata.should.have.property("detail", "scattered clouds");
        weatherdata.should.have.property("tempk", 290.12);
        weatherdata.should.have.property("humidity", 63);
        weatherdata.should.have.property("maxtemp", 291.15);
        weatherdata.should.have.property("mintemp", 289.15);
        weatherdata.should.have.property("windspeed", 8.7);
        weatherdata.should.have.property("winddirection", 220);
        weatherdata.should.have.property("location", "London");
        weatherdata.should.have.property("sunrise", 1412748812);
        weatherdata.should.have.property("sunset", 1412788938);
        weatherdata.should.have.property("clouds", 40);
        locationdata.should.have.property("lon", -0.13);
        locationdata.should.have.property("lat", 51.51);
        locationdata.should.have.property("city", "London");
        locationdata.should.have.property("country", "GB");
    };

    beforeEach(function(done) {
        if(nock){
            var scope = nock('http://api.openweathermap.org:80')
            //used to return normal data on a city/country call
            .get('/data/2.5/weather?q=london,england')
            .reply(200, {"coord":{"lon":-0.13,"lat":51.51},"sys":{"type":1,"id":5091,"message":0.0434,"country":"GB","sunrise":1412748812,"sunset":1412788938},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03d"}],"base":"cmc stations","main":{"temp":290.12,"pressure":994,"humidity":63,"temp_min":289.15,"temp_max":291.15},"wind":{"speed":8.7,"deg":220,"var_beg":190,"var_end":250},"clouds":{"all":40},"dt":1412776848,"id":2643743,"name":"London","cod":200})

            //used to return a fail error
            .get('/data/2.5/weather?q=fail,fail')
            .reply(200,{message:"Error: Not found city"})

            //used to return normal data on a lat/lon call
            .get('/data/2.5/weather?lat=51.51&lon=-0.13')
            .reply(200, {"coord":{"lon":-0.13,"lat":51.51},"sys":{"type":1,"id":5091,"message":0.0434,"country":"GB","sunrise":1412748812,"sunset":1412788938},"weather":[{"id":802,"main":"Clouds","description":"scattered clouds","icon":"03d"}],"base":"cmc stations","main":{"temp":290.12,"pressure":994,"humidity":63,"temp_min":289.15,"temp_max":291.15},"wind":{"speed":8.7,"deg":220,"var_beg":190,"var_end":250},"clouds":{"all":40},"dt":1412776848,"id":2643743,"name":"London","cod":200})

            //used to return a slightly different data set to normality. Used solely in the inject node test.
            .get('/data/2.5/weather?q=test,test')
            .reply(200, {"coord":{"lon":-0.13,"lat":51.51},"sys":{"type":1,"id":5091,"message":0.0434,"country":"GB","sunrise":1412748812,"sunset":1412788938},"weather":[{"id":802,"main":"Different","description":"scattered clouds","icon":"03d"}],"base":"cmc stations","main":{"temp":290.12,"pressure":994,"humidity":63,"temp_min":289.15,"temp_max":291.15},"wind":{"speed":8.7,"deg":220,"var_beg":190,"var_end":250},"clouds":{"all":40},"dt":1412776848,"id":2643743,"name":"London","cod":200});
        }
        helper.startServer(done);
    });

    afterEach(function(done) {
        if(nock) {
            nock.cleanAll();
        }
        try {
            // TODO @Raminios => Ensure that each test is completely standalone and doesn't rely on execution order so that nock reset could be enabled
            helper.unload();
            helper.stopServer(done);
        } catch (e) {
             var errorMessage = "" + e;
             errorMessage.should.be.exactly("Error: Not running");
             done();
        }
    });

    describe('input node', function() {
        if(nock){
            var scope;
            // TO BE FIXED
            // it('should output the new data when a change is detected in its received data', function(done) {
            //     helper.load(weatherNode,
            //                 [{id:"weatherNode1", type:"openweathermap in", wires:[["n3"]]},
            //                 {id:"n1", type:"helper", wires:[["weatherNode1"]]},
            //                 {id:"n3", type:"helper"}],
            //                 function() {
            //         //the easiest way to trigger the input node was to use a second helper node
            //         //with an input into it. This allows new data to be triggered without having to
            //         //wait for the ping timer.
            //         var n1 = helper.getNode("n1");
            //         var weatherNode1 = helper.getNode("weatherNode1");
            //         var n3 = helper.getNode("n3");
            //         var changeTime = false;
            //         weatherNode1.should.have.property('id', 'weatherNode1');
            //         //This code forces the node to receive different weather info. In reality this will only happen when a different weather is returned from the same URL in the API.
            //         n3.on('input', function(msg) {
            //             var weatherdata = msg.payload;
            //             var locationdata = msg.location;
            //             var timedata = msg.time;
            //             //Ensuring that two different outputs are received in N3 before finishing.
            //             if (changeTime === false){
            //                 weatherdata.should.have.property("weather", "Clouds");
            //                 changeTime = true;
            //             } else if (changeTime === true){
            //                 weatherdata.should.have.property("weather", "Different");
            //                 done();
            //             }
            //             weatherDataTest(weatherdata, locationdata, timedata);
            //         });
            //         n1.send({location:{city:"london", country:"england"}});
            //         n1.send({location:{city:"test", country:"test"}});
            //     });
            // });

            // it('should refuse to output data when no change is detected', function(done) {
            //     helper.load(weatherNode,
            //                 [{id:"weatherNode1", type:"openweathermap in", city:"london", country:"england", wires:[["n3"]]},
            //                 {id:"n1", type:"helper", wires:[["weatherNode1"]]},
            //                 {id:"n3", type:"helper"}],
            //                 function() {
            //         var n1 = helper.getNode("n1");
            //         var weatherNode1 = helper.getNode("weatherNode1");
            //         var n3 = helper.getNode("n3");
            //         var calledAlready = false;
            //         weatherNode1.should.have.property('id', 'weatherNode1');
            //         n3.on('input', function(msg) {
            //             //this input function will only be run once. If it is run more than once it means the node has output when it shouldn't and will error.
            //             try {
            //                 calledAlready.should.be.false;
            //             } catch (err) {
            //                 done(new Error("The weather input node is outputting unchanged weather data."));
            //             }
            //             //this ensures that the input function is only called once
            //             calledAlready = true;
            //             var weatherdata = msg.payload;
            //             var locationdata = msg.location;
            //             var timedata = msg.time;
            //             weatherDataTest(weatherdata, locationdata, timedata);
            //             done();
            //         });
            //         //the node autotriggers for the first send, these triggers should all be ignored.
            //         n1.send({});
            //         n1.send({});
            //         n1.send({});
            //         n1.send({});
            //         n1.send({});
            //     });
            // });
        }
    });

    describe('query node and polling function', function() {
        var scope;
        //all local fails, no nock required.
        it('should refuse and node.error when the input payload has an invalid lat value', function(done) {
            helper.load(weatherNode,
                    [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                     {id:"weatherNode1", type:"openweathermap", wires:[["n3"]]},
                     {id:"n3", type:"helper"}],
                     function() {
                var n1 = helper.getNode("n1");
                var weatherNode1 = helper.getNode("weatherNode1");
                var n3 = helper.getNode("n3");
                var stub = sinon.stub(weatherNode1, 'error', function(msg) {
                    msg.should.equal("Invalid lat provided");
                    stub.restore();
                    done();
                });
                weatherNode1.should.have.property('id', 'weatherNode1');
                n1.send({location:{lat: "fail", lon: "55"}});
            });
        });

        it('should refuse and node.error when the input payload has an invalid lon value', function(done) {
            helper.load(weatherNode,
                    [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                     {id:"weatherNode1", type:"openweathermap", wires:[["n3"]]},
                     {id:"n3", type:"helper"}],
                     function() {
                var n1 = helper.getNode("n1");
                var weatherNode1 = helper.getNode("weatherNode1");
                var n3 = helper.getNode("n3");
                var stub = sinon.stub(weatherNode1, 'error', function(msg) {
                    msg.should.equal("Invalid lon provided");
                    stub.restore();
                    done();
                });
                weatherNode1.should.have.property('id', 'weatherNode1');
                n1.send({location:{lat: "55", lon: "fail"}});
            });
        });

        if(nock){

            it('should fetch city/country data based on node properties', function(done) {
                helper.load(weatherNode,
                            [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                             {id:"weatherNode1", type:"openweathermap", city: "london", country: "england", wires:[["n3"]]},
                             {id:"n3", type:"helper"}],
                             function() {

                                var n1 = helper.getNode("n1");
                                var weatherNode1 = helper.getNode("weatherNode1");
                                var n3 = helper.getNode("n3");
                                weatherNode1.should.have.property('id', 'weatherNode1');
                                n3.on('input', function(msg) {
                                    var weatherdata = msg.payload;
                                    var locationdata = msg.location;
                                    var timedata = msg.time;
                                    weatherDataTest(weatherdata, locationdata, timedata);
                                    done();
                                });

                                n1.send({});
                            });

            });

            it('should fetch coordinate data based on node properties', function(done) {
                helper.load(weatherNode,
                            [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                             {id:"weatherNode1", type:"openweathermap", lon:"-0.13", lat:"51.51", city:"", country:"", wires:[["n3"]]},
                             {id:"n3", type:"helper"}],
                             function() {

                                var n1 = helper.getNode("n1");
                                var weatherNode1 = helper.getNode("weatherNode1");
                                var n3 = helper.getNode("n3");
                                weatherNode1.should.have.property('id', 'weatherNode1');
                                n3.on('input', function(msg) {
                                    var weatherdata = msg.payload;
                                    var locationdata = msg.location;
                                    var timedata = msg.time;
                                    weatherDataTest(weatherdata, locationdata, timedata);
                                    done();
                                });

                                n1.send({});
                            });
            });

            it('should fetch coordinate data based on payload lat/lon', function(done) {
                helper.load(weatherNode,
                            [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                             {id:"weatherNode1", type:"openweathermap", wires:[["n3"]]},
                             {id:"n3", type:"helper"}],
                             function() {

                                var n1 = helper.getNode("n1");
                                var weatherNode1 = helper.getNode("weatherNode1");
                                var n3 = helper.getNode("n3");
                                weatherNode1.should.have.property('id', 'weatherNode1');
                                n3.on('input', function(msg) {
                                    var weatherdata = msg.payload;
                                    var locationdata = msg.location;
                                    var timedata = msg.time;
                                    weatherDataTest(weatherdata, locationdata, timedata);
                                    done();
                                });

                                n1.send({location:{lon:"-0.13", lat:"51.51"}});
                            });
            });

            it('should fetch coordinate data based on payload city/country', function(done) {
                helper.load(weatherNode,
                            [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                             {id:"weatherNode1", type:"openweathermap", wires:[["n3"]]},
                             {id:"n3", type:"helper"}],
                             function() {

                                var n1 = helper.getNode("n1");
                                var weatherNode1 = helper.getNode("weatherNode1");
                                var n3 = helper.getNode("n3");
                                weatherNode1.should.have.property('id', 'weatherNode1');
                                n3.on('input', function(msg) {
                                    var weatherdata = msg.payload;
                                    var locationdata = msg.location;
                                    var timedata = msg.time;
                                    weatherDataTest(weatherdata, locationdata, timedata);
                                    done();
                                });

                                n1.send({location:{city:"london", country:"england"}});
                            });
            });

            it('should prioritise node city/country when input msg.location data is present', function(done) {
                helper.load(weatherNode,
                        [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                         {id:"weatherNode1", type:"openweathermap", city:"london", country:"england", wires:[["n3"]]},
                         {id:"n3", type:"helper"}],
                         function() {
                    var n1 = helper.getNode("n1");
                    var weatherNode1 = helper.getNode("weatherNode1");
                    var n3 = helper.getNode("n3");

                    weatherNode1.should.have.property('id', 'weatherNode1');
                    n3.on('input', function(msg) {
                        var weatherdata = msg.payload;
                        var locationdata = msg.location;
                        var timedata = msg.time;
                        weatherDataTest(weatherdata, locationdata, timedata);
                        done();
                    });

                    n1.send({location:{lat: "fail", lon: "fail"}});
                });
            });

            it('should error when payload city/country is incorrect', function(done) {
                helper.load(weatherNode,
                        [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                         {id:"weatherNode1", type:"openweathermap", wires:[["n3"]]},
                         {id:"n3", type:"helper"}],
                         function() {
                    var n1 = helper.getNode("n1");
                    var weatherNode1 = helper.getNode("weatherNode1");
                    var n3 = helper.getNode("n3");
                    var stub = sinon.stub(weatherNode1, 'error', function(msg) {
                            msg.should.equal("Invalid city/country");
                            stub.restore();
                            done();
                    });
                    weatherNode1.should.have.property('id', 'weatherNode1');

                    n1.send({location:{city:"fail", country:"fail"}});
                });
            });

            it('should error when node city/country is incorrect', function(done) {
                helper.load(weatherNode,
                        [{id:"n1", type:"helper", wires:[["weatherNode1"]]},
                         {id:"weatherNode1", type:"openweathermap", city:"fail", country:"fail", wires:[["n3"]]},
                         {id:"n3", type:"helper"}],
                         function() {
                    var n1 = helper.getNode("n1");
                    var weatherNode1 = helper.getNode("weatherNode1");
                    var n3 = helper.getNode("n3");
                    var stub = sinon.stub(weatherNode1, 'error', function(msg) {
                            msg.should.equal("Invalid city/country");
                            stub.restore();
                            done();
                    });
                    weatherNode1.should.have.property('id', 'weatherNode1');

                    n1.send({});
                });
            });
        }
    });
});
