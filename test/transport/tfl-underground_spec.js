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
var tubeNode = require("../../transport/tfl-underground.js");
var helper = require('../helper.js');
var sinon = require('sinon');
var path = require("path");
var fs = require('fs-extra');
var nock = helper.nock;

describe('tfl-underground nodes', function() {

    var file = path.join(__dirname, "tfl-underground-response.xml");
    
    before(function(done) {
        helper.startServer(done);
    });

    beforeEach(function() {
        fs.existsSync(file).should.be.true;
    });
    
    afterEach(function() {
        helper.unload();
    });

    describe('query node', function() {

        if (nock) {
            
            it(' can fetch Good Service information', function(done) {
                fs.readFile(file, 'utf8', function(err, data) {
                    helper.load(tubeNode, 
                            [ {id:"n1", type:"helper", wires:[["n2"]]},
                              {id:"n2", type:"tfl underground", wires:[["n3"]], line:"Bakerloo", acceptedtcs:true},
                              {id:"n3", type:"helper"}], 
                              function() {
                                  var scope = nock('http://cloud.tfl.gov.uk').get('/TrackerNet/LineStatus').reply(200, data);
                                  
                                  var n1 = helper.getNode("n1");
                                  var n2 = helper.getNode("n2");
                                  var n3 = helper.getNode("n3");
                                  n2.should.have.property('id','n2');
                                  n1.send({payload:"foo"});
                                  n3.on('input', function(msg){
                                      msg.payload.should.have.property('status', "GoodService");
                                      msg.payload.should.have.property('description', "Good Service");
                                      msg.payload.should.have.property('details', "");
                                      msg.payload.should.have.property('goodservice', true);
                                      msg.payload.should.have.property('branchdisruptions');
                                      msg.payload.branchdisruptions.should.be.an.instanceOf(Array);
                                      msg.payload.branchdisruptions.length.should.equal(0);
                                      done();
                                  });
                              }
                    );
                });
            });

                it(' can fetch Minor Delays information', function(done) {
                    fs.readFile(file, 'utf8', function(err, data) {
                        helper.load(tubeNode, 
                                [ {id:"n1", type:"helper", wires:[["n2"]]},
                                  {id:"n2", type:"tfl underground", wires:[["n3"]], line:"District",acceptedtcs:true},
                                  {id:"n3", type:"helper"}], 
                                  function() {
                                      var scope = nock('http://cloud.tfl.gov.uk').get('/TrackerNet/LineStatus').reply(200, data);
                                      
                                      var n1 = helper.getNode("n1");
                                      var n2 = helper.getNode("n2");
                                      var n3 = helper.getNode("n3");
                                      n2.should.have.property('id','n2');
                                      n1.send({payload:"foo"});
                                      n3.on('input', function(msg){
                                          msg.payload.should.have.property('status', "GoodService");
                                          msg.payload.should.have.property('description', "Minor Delays");
                                          msg.payload.should.have.property('details');
                                          msg.payload.details.should.equal("Minor delays between Barking and Upminster while we respond to a fire alert at Barking. GOOD SERVICE on the rest of the line.");
                                          msg.payload.should.have.property('goodservice', true);
                                          done();
                                      });
                                  }
                        );
                    });
                });
 
                    it(' can fetch Severe Delays information', function(done) {
                        fs.readFile(file, 'utf8', function(err, data) {
                            helper.load(tubeNode, 
                                    [ {id:"n1", type:"helper", wires:[["n2"]]},
                                      {id:"n2", type:"tfl underground", wires:[["n3"]], line:"Jubilee",acceptedtcs:true},
                                      {id:"n3", type:"helper"}], 
                                      function() {
                                          var scope = nock('http://cloud.tfl.gov.uk').get('/TrackerNet/LineStatus').reply(200, data);
                                          
                                          var n1 = helper.getNode("n1");
                                          var n2 = helper.getNode("n2");
                                          var n3 = helper.getNode("n3");
                                          n2.should.have.property('id','n2');
                                          n1.send({payload:"foo"});
                                          n3.on('input', function(msg){
                                              msg.payload.should.have.property('status', "DisruptedService");
                                              msg.payload.should.have.property('description', "Severe Delays");
                                              msg.payload.should.have.property('details');
                                              msg.payload.details.should.equal("Due to an obstruction on the track in the Westminster area. Valid tickets will be accepted on London Busses via any reasonable route. Customers should avoid the line where possible.");
                                              msg.payload.should.have.property('goodservice', false);
                                              done();
                                          });
                                      }
                            );
                        });
                    });
                    
                    
                    it(' can fetch branch disruption information', function(done) {
                        fs.readFile(file, 'utf8', function(err, data) {
                            helper.load(tubeNode, 
                                    [ {id:"n1", type:"helper", wires:[["n2"]]},
                                      {id:"n2", type:"tfl underground", wires:[["n3"]], line:"Piccadilly",acceptedtcs:true},
                                      {id:"n3", type:"helper"}], 
                                      function() {
                                          var scope = nock('http://cloud.tfl.gov.uk').get('/TrackerNet/LineStatus').reply(200, data);
                                          
                                          var n1 = helper.getNode("n1");
                                          var n2 = helper.getNode("n2");
                                          var n3 = helper.getNode("n3");
                                          n2.should.have.property('id','n2');
                                          n1.send({payload:"foo"});
                                          n3.on('input', function(msg){
                                              msg.payload.should.have.property('status', "DisruptedService");
                                              msg.payload.should.have.property('description', "Part Suspended");
                                              msg.payload.should.have.property('details');
                                              msg.payload.details.should.equal("No service Acton Town to Uxbridge. SEVERE DELAYS on the rest of the line while we fix a signal failure in the Acton Town area. Tickets will be accepted on London Buses and Great Northern via any reasonable route.");
                                              msg.payload.should.have.property('goodservice', false);
                                              msg.payload.should.have.property('branchdisruptions');
                                              msg.payload.branchdisruptions.should.be.an.instanceOf(Array);
                                              msg.payload.branchdisruptions.length.should.equal(1);
                                              var disruption = msg.payload.branchdisruptions[0];
                                              disruption.StationFrom[0].$.Name.should.equal("Acton Town");
                                              disruption.StationTo[0].$.Name.should.equal("Uxbridge");
                                              disruption.Status[0].$.Description.should.equal("Part Suspended");                                              
                                              done();
                                          });
                                      }
                            );
                        });
                    });
                    
            
        }}
    );
    
});
