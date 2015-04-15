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

var busNode = require("../../tfl/tfl-bus.js");
var helper = require('../helper.js');

var should = require("should");

var nock = helper.nock;

describe('TfL Bus Node', function() {
    beforeEach(function(done) {
        helper.startServer(done);
    });

    afterEach(function(done) {
        if(nock) {
            nock.cleanAll();
        }
        try {
            helper.unload();
            helper.stopServer(done);
        } catch (e) {
            var errorMessage = "" + e;
            errorMessage.should.be.exactly("Error: Not running");
            done();
        }
    });

    if (nock) {
        it('finds bus stops for specified location', function(done) {
            var scope = nock('http://countdown.api.tfl.gov.uk:80')
                            .get('/interfaces/ura/instant_V1?Circle=51.507268,-0.16573,600&StopPointState=0&ReturnList=StopCode1,StopPointName,Bearing,StopPointIndicator,StopPointType,Latitude,Towards')
                            .reply(200, "[4,\"1.0\",VERSION ARRAY]\r\n[0,\"Hyde Park Street\",\"71355\",\"STBC\",\"Hyde Park Corner or Oxford Circus\",78,\"D\",51.512573]");

            var flow = [{id:"busNode1", type:"tfl bus", wires:[["helper2"]], lat:"51.507268",lon:"-0.16573",radius:"600",stopCode1:"71355",lineID:"390",stopName:"Hyde Park Street towards Hyde Park Corner or Oxford Circus",lineName:"390 to Archway",acceptedtcs:true}];
            helper.load(busNode, flow, function() {
                helper.request()
                .get('/tfl-bus/stopsquery?lat=51.507268&lon=-0.16573&radius=600')
                .expect(200)
                .expect(function(res) {
                    try {
                        res.text.should.equal('[\n  [\n    0,\n    "Hyde Park Street",\n    "71355",\n    "STBC",\n    "Hyde Park Corner or Oxford Circus",\n    78,\n    "D",\n    51.512573\n  ]\n]');
                    } catch(err) {
                        done(err);
                    }
                })
                .end(function(err, res) {
                    if (err) {
                    	return done(err);
                    }
                    done();
                });
            });
        });

        it('finds bus lines for specified bus stop', function(done) {
            var scope = nock('http://countdown.api.tfl.gov.uk:80')
                        .get('/interfaces/ura/instant_V1?StopCode1=71355&ReturnList=StopCode2,StopPointName,LineName,DestinationText,EstimatedTime,ExpireTime,RegistrationNumber,VehicleID')
                        .reply(200, '[4,\"1.0\",VERSION ARRAY]\r\n[1,\"Hyde Park Street\",\"490008446E\",\"94\",\"Piccadilly Cir\",15926,\"SN60BYT\",1417171059000,1417171059000]\r\n[1,\"Hyde Park Street\",\"490008446E\",\"390\",\"Archway\",19749,\"LTZ1040\",1417171088000,1417171088000]');

            var flow = [{id:"busNode1", type:"tfl bus", wires:[["helper2"]], lat:"51.507268",lon:"-0.16573",radius:"600",stopCode1:"71355",lineID:"390",stopName:"Hyde Park Street towards Hyde Park Corner or Oxford Circus",lineName:"390 to Archway",acceptedtcs:true}];
            helper.load(busNode, flow, function() {
                helper.request()
                .get('/tfl-bus/linesquery?stopCode1=71355')
                .expect(200)
                .expect(function(res) {
                    try {
                        res.text.should.equal('[\n  [\n    "390",\n    "Archway"\n  ],\n  [\n    "94",\n    "Piccadilly Cir"\n  ]\n]');
                    } catch(err) {
                        done(err);
                    }
                })
                .end(function(err, res) {
                    if (err) {
                    	return done(err);
                    }
                    done();
                });
            });
        });

        it('returns information on arriving service', function(done) {
            var scope = nock('http://countdown.api.tfl.gov.uk:80')
                        .get('/interfaces/ura/instant_V1?StopCode1=71355&LineID=390&ReturnList=StopPointName,LineName,DestinationText,EstimatedTime,RegistrationNumber')
                        .reply(200, '[4,\"1.0\",VERSION ARRAY]\r\n[1,\"Hyde Park Street\",\"390\",\"Archway\",\"LTZ1040\",1417171088000]');

            var flow = [{id:"busNode1", type:"tfl bus", wires:[["helper1"]], lat:"51.507268",lon:"-0.16573",radius:"600",stopCode1:"71355",lineID:"390",stopName:"Hyde Park Street towards Hyde Park Corner or Oxford Circus",lineName:"390 to Archway",acceptedtcs:true},
                        {id:"helper1", type:"helper"}];

            helper.load(busNode, flow, function() {
                var busNode1 = helper.getNode("busNode1");
                var helperNode1 = helper.getNode("helper1");

                helperNode1.on("input", function(msg) {
                    try {
                        // bus info
                        msg.payload.StopPointName.should.equal('Hyde Park Street');
                        msg.payload.LineID.should.equal('390');
                        msg.payload.DestinationText.should.equal('Archway');
                        msg.payload.RegistrationNumber.should.equal('LTZ1040');
                        msg.payload.EstimatedTime.toString().should.equal(new Date(1417171088000).toString());

                        // added location info
                        msg.location.lat.should.equal('51.507268');
                        msg.location.lon.should.equal('-0.16573');
                        msg.location.radius.should.equal('600');

                        done();
                    } catch(err) {
                        done(err);
                    }
                });

                busNode1.receive({payload:""});
            });
        });
    }
});
