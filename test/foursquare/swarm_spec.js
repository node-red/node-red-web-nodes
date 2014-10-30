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
var swarmNode = require("../../foursquare/swarm.js");
var foursquareNode = require("../../foursquare/foursquare.js");
var helper = require('../helper.js');
var sinon = require('sinon');
var nock = helper.nock;

describe('swarm nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    describe('query node', function() {
        
        if (nock) {
            
            it(' can fetch check-in information', function(done) {
                    helper.load([foursquareNode, swarmNode], 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"swarm", foursquare: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                clientsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://api.foursquare.com:443')
                                  .filteringPath(/afterTimestamp=[^&]*/g, 'afterTimestamp=foo')
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&sort=newestfirst&m=swarm&v=20141016')
                                  .reply(200, {"meta":{"code":200},"response":{"checkins":{"count":1, "items":[{"id":"b695edf5ewc2","createdAt":1412861751,"type":"checkin","timeZoneOffset":60,"venue":{"id":"49a8b774","name":"Bobs House"}}]}}});
                              
                            var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"foo"});
                              n3.on('input', function(msg){
                                  var venue = msg.payload.venue;
                                  venue.should.have.property('name', "Bobs House");
                                  done();
                              });
                          });
            });
            
            it(' fails if error fetching check-in information', function(done) {
                helper.load([foursquareNode, swarmNode], 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"swarm", foursquare: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                clientsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://api.foursquare.com:443')
                                  .filteringPath(/afterTimestamp=[^&]*/g, 'afterTimestamp=foo')
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&sort=newestfirst&m=swarm&v=20141016')
                                  .reply(200, {"meta":{"code":400, "errorDetail":'test forced failure'}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              
                              sinon.stub(n2, 'status', function(status){
                                  var expected = {fill:"red",shape:"ring",text:"failed"};
                                  should.deepEqual(status, expected);
                                  done();
                              });

                              n1.send({payload:"foo"});
                          });
                });
            
        }}
    );

    
    describe('in node', function() {
        
        if (nock) {

            it(' can fetch check-in information', function(done) {
                helper.load([foursquareNode, swarmNode], 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"swarm in", foursquare: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                clientsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://api.foursquare.com:443')
                                  .filteringPath(/afterTimestamp=[^&]*/g, 'afterTimestamp=foo')
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&sort=newestfirst&m=swarm&v=20141016&afterTimestamp=foo')
                                  .reply(200, {"meta":{"code":200},"response":{"checkins":{"count":1, "items":[{"id":"b695edf5ewc2","createdAt":1412861751,"type":"checkin","timeZoneOffset":60,"venue":{"id":"49a8b774","name":"Bobs House"}}]}}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n2.emit("input", {});
                              n3.on('input', function(msg){
                                  var venue = msg.payload.venue;
                                  venue.should.have.property('name', "Bobs House");
                                  done();
                              });
                          });
                });
            
        }
       
    });
    
});
