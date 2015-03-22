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
var foursquareNode = require("../../foursquare/foursquare.js");
var helper = require('../helper.js');
var sinon = require('sinon');
var nock = helper.nock;

describe('foursquare nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe('oauth2 authentication', function() {
        
        if (nock) {

            it('can do oauth dance', function(done) {
                helper.load(foursquareNode, 
                        [{id:"n4", type:"foursquare-credentials"}], 
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
                                    .get('/foursquare-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/foursquare-credentials')
                                    .expect(302)
                                    .end(function(err, res) {
                                        if (err) {
                                        	return done(err);
                                        }
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
                                            .expect(200)
                                            .end(function(err, res) {
                                                if (err) {
                                                	return done(err);
                                                }
                                                helper.credentials.get("n4")
                                                    .should.have.property('displayname',
                                                                          'John Smith');
                                                done();
                                            });
                                    });
                                });
             });


            it(' fails oauth dance if request is missing required parameter', function(done) {
                helper.load(foursquareNode, 
                        [{id:"n4", type:"foursquare-credentials"}], 
                              function() {
                        helper.request()
                            .get('/foursquare-credentials/auth?id=n4&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/foursquare-credentials')
                            .expect(400, 'ERROR: request does not contain the required parameters')
                            .end(function(err, res) {
                                done();
                            });
                   });                    
           });
            
            
            it('fails oauth dance if client id is invalid', function(done) {
                helper.load(foursquareNode, 
                        [{id:"n4", type:"foursquare-credentials"}], 
                             function() {
                       var scope = nock('https://foursquare.com:443')
                          .post('/oauth/access_token')
                            .reply(401, '{"errors":[{"errorType":"oauth","fieldName":"oauth_consumer_key","message":"Cause of error: Value abcdefg is invalid for consumer key"}],"success":false}');
                        helper.request()
                            .get('/foursquare-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/foursquare-credentials')
                            .expect(302)
                            .end(function(err, res) {
                                if (err) {
                                	return done(err);
                                }
                              var state = res.text.split("state=n4%253A");
                              helper.request()
                                  .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
                                  .expect(200)
                                  .end(function(err, res) {
                                      if (err) {
                                    	  return done(err);
                                      }
                                      res.text.should.containEql('Oh no');
                                      done();
                                  });
                            });
                });
           });

            it(' fails if profile can\'t be retrieved', function(done) {
                helper.load(foursquareNode, 
                        [{id:"n4", type:"foursquare-credentials"}], 
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
                                    .get('/foursquare-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/foursquare-credentials')
                                    .expect(302)
                                    .end(function(err, res) {
                                        if (err) {
                                        	return done(err);
                                        }
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
                                            .expect(200)
                                            .end(function(err, res) {
                                                if (err) {
                                                	return done(err);
                                                }
                                                res.text.should.containEql('Http return code');
                                                done();
                                            });
                                    });
                                });
            });
            
            it(' fails if CSRF token mismatch', function(done) {
                helper.load(foursquareNode, 
                        [{id:"n4", type:"foursquare-credentials"}], 
                          function() {
                
                            var scope = nock('https://foursquare.com:443')   
                                .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                                .post('/oauth2/access_token', "redirect_uri=XXX&" +
                                    "grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                                .reply(200, {"access_token":"2468abc"});
                
                            helper.request()
                                .get('/foursquare-credentials/auth?id=n4&clientid=abcdefg&clientsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/foursquare-credentials')
                                .expect(302)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    helper.request()
                                        .get('/foursquare-credentials/auth/callback?code=123456&state=n4:13579')
                                        .expect(401)
                                        .end(function(err, res) {
                                            if (err) {
                                            	return done(err);
                                            }
                                            res.text.should.containEql('CSRF token mismatch, possible cross-site request forgery attempt');
                                            done();
                                        });
                                });
                });
            });            
            
        }
       
    });
    
    describe('query node', function() {
        
        it(' fails if latitude is not set', function(done) {
            helper.load(foursquareNode, 
                    [ {id:"n1", type:"helper", wires:[["n2"]]},
                      {id:"n4", type:"foursquare-credentials"},
                      {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]]},
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
                          var n1 = helper.getNode("n1");
                          var n2 = helper.getNode("n2");
                          var n3 = helper.getNode("n3");
                          n2.should.have.property('id','n2');
                          
                          sinon.stub(n2, 'status', function(status){
                              var expected = {fill:"red",shape:"ring",text:"failed"};
                              should.deepEqual(status, expected);
                              done();
                          });
                          
                          n1.send({payload:"foo", location:{lon:"123456"}});
                      });
        });

        it(' fails if longitude is not set', function(done) {
            helper.load(foursquareNode, 
                    [ {id:"n1", type:"helper", wires:[["n2"]]},
                      {id:"n4", type:"foursquare-credentials"},
                      {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]]},
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
                          var n1 = helper.getNode("n1");
                          var n2 = helper.getNode("n2");
                          var n3 = helper.getNode("n3");
                          n2.should.have.property('id','n2');
                          
                          sinon.stub(n2, 'status', function(status){
                              var expected = {fill:"red",shape:"ring",text:"failed"};
                              should.deepEqual(status, expected);
                              done();
                          });
                          
                          n1.send({payload:"foo", location:{lat:"123456"}});
                      });
        });

        it(' fails if msg.section is invalid', function(done) {
            helper.load(foursquareNode, 
                    [ {id:"n1", type:"helper", wires:[["n2"]]},
                      {id:"n4", type:"foursquare-credentials"},
                      {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]]},
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
                          var n1 = helper.getNode("n1");
                          var n2 = helper.getNode("n2");
                          var n3 = helper.getNode("n3");
                          n2.should.have.property('id','n2');
                          
                          sinon.stub(n2, 'status', function(status){
                              var expected = {fill:"red",shape:"ring",text:"failed"};
                              should.deepEqual(status, expected);
                              done();
                          });
                          
                          n1.send({payload:"foo", location:{lat:"123456", lon:"231123"}, section:"rubbish"});
                      });
        });
        
        if (nock) {

            it('fails if error fetching recommended venue information', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]]},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=food&ll=51.03,-1.4&v=20141016&m=foursquare')
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
                              
                              n1.send({payload:"foo", location:{lat:"51.03", lon:"-1.4"}, section:"food"});
                          });
            });
            
            it('can fetch the first recommended venue information', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"1", outputas:"single"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=food&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 5 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Bobs Restaurant", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Sues Restaurant", "location": { "lat": 51.03, "lng": -1.45}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"foo", location:{lat:"51.03", lon:"-1.4"}, section:"food"});
                              n3.on('input', function(msg){
                                  var bobs = msg;
                                  bobs.should.have.property('title', "Bobs Restaurant");
                                  bobs.should.have.property('location');                                  
                                  bobs.location.should.have.property('lat', 51.03);
                                  bobs.location.should.have.property('lon', -1.42);
                                  bobs.location.should.have.property('city', undefined);
                                  bobs.location.should.have.property('country', undefined);
                                  bobs.location.should.have.property('name', "Bobs Restaurant");
                                  bobs.payload.reasons.items[0].should.have.property('summary', "You've been here 5 times");
                                  done();
                              });
                          
                          });
            });
            
            it('can fetch the first recommended local sight', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"1",outputas:"single"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=sights&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42, "city":"Winchester", "country":"England", "name":"Zoo"}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 51.03, "lng": -1.45}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"foo", location:{lat:"51.03", lon:"-1.4"}, section:"sights"});
                              n3.on('input', function(msg){
                                  var zoo = msg;
                                  zoo.should.have.property('title', "Zoo");
                                  zoo.should.have.property('location'); 
                                  zoo.location.should.have.property('lat', 51.03);
                                  zoo.location.should.have.property('lon', -1.42);
                                  zoo.location.should.have.property('city', "Winchester");
                                  zoo.location.should.have.property('country', "England");
                                  zoo.location.should.have.property('name', "Zoo");
                                  zoo.payload.reasons.items[0].should.have.property('summary', "You've been here 3 times");
                                  done();
                              });
                          
                          });
            });
            
            it('can fetch multiple recommended sights and return as a single msg', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=sights&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 52.12, "lng": -1.62}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"sights", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  // returning multiple results as a single msg means msg.payload is an array
                                  msg.payload.should.be.an.instanceOf(Array);
                                  var zoo = msg.payload[0];
                                  zoo.should.have.property('title', "Zoo");
                                  zoo.should.have.property('location'); 
                                  zoo.location.should.have.property('lat', 51.03);
                                  zoo.location.should.have.property('lon', -1.42);
                                  zoo.payload.reasons.items[0].should.have.property('summary', "You've been here 3 times");
                                  
                                  var playground = msg.payload[1];
                                  playground.should.have.property('title', "Playground");
                                  playground.should.have.property('location'); 
                                  playground.location.should.have.property('lat', 52.12);
                                  playground.location.should.have.property('lon', -1.62);
                                  playground.payload.reasons.items[0].should.have.property('summary', "Very popular");
                                  
                                  done();
                              });
                          
                          });
            });
            
            it('passes on null msg.payload if no results from query', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"1", outputas:"single"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=food&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":[]}]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"foo", location:{lat:"51.03", lon:"-1.4"}, section:"food", foo:"bar"});
                              n3.on('input', function(msg){
                                  var bobs = msg;
                                  msg.should.have.property('payload', null);
                                  msg.should.have.property('foo', "bar");
                                  done();
                              });
                          
                          });
            });
            
            it('can fetch multiple recommended sights and return as a multiple msgs', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"10",outputas:"multiple"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=sights&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 52.12, "lng": -1.62}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"sights", foo:"bar"});
                              
                              var count = 0;
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.should.have.property('location');
                                  msg.should.have.property('title');
                                  msg.should.not.have.property('payload', "nothing");
                                  
                                  count += 1;
                                  if (count === 2) {
                                      done();
                                  }
                              });
                          
                          });
            });
 
            it('can explore all recommended venues', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 52.12, "lng": -1.62}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"all", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.payload.should.be.an.instanceOf(Array);
                                  var zoo = msg.payload[0];
                                  zoo.should.have.property('title', "Zoo");
                                  zoo.should.have.property('location'); 
                                  zoo.location.should.have.property('lat', 51.03);
                                  zoo.location.should.have.property('lon', -1.42);
                                  zoo.payload.reasons.items[0].should.have.property('summary', "You've been here 3 times");
                                  
                                  var playground = msg.payload[1];
                                  playground.should.have.property('title', "Playground");
                                  playground.should.have.property('location'); 
                                  playground.location.should.have.property('lat', 52.12);
                                  playground.location.should.have.property('lon', -1.62);
                                  playground.payload.reasons.items[0].should.have.property('summary', "Very popular");
                                  
                                  done();
                              });
                          
                          });
            });
            
            
            it('can fetch multiple recommended sights for any day', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single", openday:"any"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=sights&day=any&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 52.12, "lng": -1.62}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"sights", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.payload.should.be.an.instanceOf(Array);
                                  done();
                              });
                          
                          });
            });

            
            it('can fetch multiple recommended sights for any time', function(done) {
                helper.load(foursquareNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"foursquare-credentials"},
                          {id:"n2", type:"foursquare", foursquare: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single",opentime:"any"},
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
                                  .get('/v2/venues/explore?oauth_token=abcd1234&section=sights&time=any&ll=51.03,-1.4&v=20141016&m=foursquare')
                                  .reply(200, {"meta":{"code":200},"response":{"groups":
                                      [{"count":1, "items":
                                          [{"reasons": { "count": 1, "items": [ { "summary": "You've been here 3 times", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "4da429a8b", "name": "Zoo", "location": { "lat": 51.03, "lng": -1.42}}},
                                           {"reasons": { "count": 1, "items": [ { "summary": "Very popular", "type": "social", "reasonName": "friendAndSelfCheckinReason", "count": 0 } ] }, 
                                              "venue": { "id": "5is0fe9fd", "name": "Playground", "location": { "lat": 52.12, "lng": -1.62}}}]
                                      }]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"sights", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.payload.should.be.an.instanceOf(Array);
                                  done();
                              });
                          
                          });
            });

            
            
        }}
    );
});
