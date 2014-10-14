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
var swarmNode = require("../../swarm/swarm.js");
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

            it('can do oauth dance', function(done) {
                    helper.load(swarmNode, 
                            [ {id:"n1", type:"helper", wires:[["n2"]]},
                              {id:"n4", type:"swarm-credentials"},
                              {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
                              {id:"n3", type:"helper"}], 
                              function() {
                    
                                var scope = nock('https://foursquare.com:443')   
                                    .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                                    .post('/oauth2/access_token', "redirect_uri=XXX&" +
                                        "grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                                    .reply(200, {"access_token":"2468abc"});
                    
                                var apiscope = nock('https://api.foursquare.com:443')
                                    .get('/v2/users/self?oauth_token=2468abc&v=20141016')
                                    .reply(200, {"meta":{"code":200},"response":{"user":{"id":"987654321","firstName":"John","lastName":"Smith"}}});

                                helper.request()
                                    .get('/swarm-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/swarm-credentials')
                                    .expect(302)
                                    .end(function(err, res) {
                                        if (err) return done(err);
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/swarm-credentials/auth/callback?code=123456&state=n4:'+state[1])
                                            .expect(200)
                                            .end(function(err, res) {
                                                if (err) return done(err);
                                                helper.credentials.get("n4")
                                                    .should.have.property('displayname',
                                                                          'John Smith');
                                                done();
                                            });
                                    });
                                });
            });

            it(' fails oauth dance if request is missing required parameter', function(done) {
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          function() {
                    helper.request()
                        .get('/swarm-credentials/auth?id=n4&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/swarm-credentials')
                        .expect(400, 'ERROR: request does not contain the required parameters')
                        .end(function(err, res) {
                            done();
                        });
               });
           });
            
            
            it('fails oauth dance if client id is invalid', function(done) {
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          function() {
                   var scope = nock('https://foursquare.com:443')
                      .post('/oauth/access_token')
                        .reply(401, '{"errors":[{"errorType":"oauth","fieldName":"oauth_consumer_key","message":"Cause of error: Value abcdefg is invalid for consumer key"}],"success":false}');
                    helper.request()
                        .get('/swarm-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/swarm-credentials')
                        .expect(302)
                        .end(function(err, res) {
                            if (err) return done(err);
                          var state = res.text.split("state=n4%253A");
                          helper.request()
                              .get('/swarm-credentials/auth/callback?code=123456&state=n4:'+state[1])
                              .expect(200)
                              .end(function(err, res) {
                                  if (err) return done(err);
                                  res.text.should.containEql('Oh no');
                                  done();
                              });
                        });
               });
           });

            it(' fails if profile can\'t be retrieved', function(done) {
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          function() {
                
                            var scope = nock('https://foursquare.com:443')   
                                .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                                .post('/oauth2/access_token', "redirect_uri=XXX&" +
                                    "grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                                .reply(200, {"access_token":"2468abc"});
                
                            var apiscope = nock('https://api.foursquare.com:443')
                                .get('/v2/users/self?oauth_token=2468abc&v=20141016')
                                .reply(401, '{"meta":[{"code":"401"}]}');

                            helper.request()
                                .get('/swarm-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/swarm-credentials')
                                .expect(302)
                                .end(function(err, res) {
                                    if (err) return done(err);
                                    var state = res.text.split("state=n4%253A");
                                    helper.request()
                                        .get('/swarm-credentials/auth/callback?code=123456&state=n4:'+state[1])
                                        .expect(200)
                                        .end(function(err, res) {
                                            if (err) return done(err);
                                            res.text.should.containEql('Http return code');
                                            done();
                                        });
                                });
                            });
            });
            
            it(' fails if CSRF token mismatch', function(done) {
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
                          {id:"n3", type:"helper"}], 
                          function() {
                
                            var scope = nock('https://foursquare.com:443')   
                                .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                                .post('/oauth2/access_token', "redirect_uri=XXX&" +
                                    "grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                                .reply(200, {"access_token":"2468abc"});
                
                            helper.request()
                                .get('/swarm-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/swarm-credentials')
                                .expect(302)
                                .end(function(err, res) {
                                    if (err) return done(err);
                                    helper.request()
                                        .get('/swarm-credentials/auth/callback?code=123456&state=n4:13579')
                                        .expect(401)
                                        .end(function(err, res) {
                                            if (err) return done(err);
                                            res.text.should.containEql('CSRF token mismatch, possible cross-site request forgery attempt');
                                            done();
                                        });
                                });
                            });
            });            
            
            it(' can fetch check-in information', function(done) {
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
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
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&v=20141016&afterTimestamp=foo&sort=newestfirst')
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
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm", swarm: "n4", wires:[["n3"]]},
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
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&v=20141016&afterTimestamp=foo&sort=newestfirst')
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
                helper.load(swarmNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"swarm-credentials"},
                          {id:"n2", type:"swarm in", swarm: "n4", wires:[["n3"]]},
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
                                  .get('/v2/users/self/checkins?oauth_token=abcd1234&v=20141016&afterTimestamp=foo&sort=newestfirst')
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
