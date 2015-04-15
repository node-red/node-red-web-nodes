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
var jawboneupNode = require("../../jawboneup/jawboneup.js");
var helper = require('../helper.js');
var sinon = require('sinon');
var nock = helper.nock;

describe('jawboneup nodes', function() {

//    nock.recorder.rec({
//        enable_reqheaders_recording: true
//      });
    
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
                helper.load(jawboneupNode, 
                        [{id:"n4", type:"jawboneup-credentials"}], 
                              function() {
                    
                                var scope = nock('https://jawbone.com:443')   
                                    .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                                    .post('/auth/oauth2/token', "redirect_uri=XXX&grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                                    .reply(200, {"oauth_access_token":"2468abc"});
                                
                                var apiscope = nock('https://jawbone.com:443')
                                    .get('/nudge/api/v.1.1/users/@me')
                                    .reply(200, {"meta":{"code":200},"data":{"first":"John","last":"Smith"}});

                                helper.request()
                                    .get('/jawboneup-credentials/auth?id=n4&callback=http://localhost:1880:/jawboneup-credentials&clientid=abcdefg&appsecret=mnopqrs&response_type=code')
                                    .expect(302)
                                    .end(function(err, res) {
                                        if (err) {
                                        	return done(err);
                                        }
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/jawboneup-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                helper.load(jawboneupNode, 
                        [{id:"n4", type:"jawboneup-credentials"}], 
                              function() {
                        helper.request()
                            .get('/jawboneup-credentials/auth?id=n4&callback=http://localhost:1880:/jawboneup-credentials&clientid=abcdefg&response_type=code')
                            .expect(400, 'ERROR: request does not contain the required parameters')
                            .end(function(err, res) {
                                done();
                            });
                   });                    
           });
            
            
            it('fails oauth dance if client id is invalid', function(done) {
                helper.load(jawboneupNode, 
                        [{id:"n4", type:"jawboneup-credentials"}], 
                             function() {
                    var scope = nock('https://jawbone.com:443')   
                    .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                    .post('/auth/oauth2/token', "redirect_uri=XXX&grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                            .reply(401, '{"errors":[{"errorType":"oauth","fieldName":"oauth_consumer_key","message":"Cause of error: Value abcdefg is invalid for consumer key"}],"success":false}');

                    helper.request()
                            .get('/jawboneup-credentials/auth?id=n4&callback=http://localhost:1880:/jawboneup-credentials&clientid=abcdefg&appsecret=mnopqrs&response_type=code')
                            .expect(302)
                            .end(function(err, res) {
                                if (err) {
                                	return done(err);
                                }
                              var state = res.text.split("state=n4%253A");
                              helper.request()
                                  .get('/jawboneup-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                helper.load(jawboneupNode, 
                        [{id:"n4", type:"jawboneup-credentials"}], 
                              function() {
                    var scope = nock('https://jawbone.com:443')   
                    .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                    .post('/auth/oauth2/token', "redirect_uri=XXX&grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                    .reply(200, {"oauth_access_token":"2468abc"});
                
                var apiscope = nock('https://jawbone.com:443')
                    .get('/nudge/api/v.1.1/users/@me')
                                    .reply(401, '{"meta":[{"code":"401"}]}');
    
                                helper.request()
                                    .get('/jawboneup-credentials/auth?id=n4&callback=http://localhost:1880:/jawboneup-credentials&clientid=abcdefg&appsecret=mnopqrs&response_type=code')
                                    .expect(302)
                                    .end(function(err, res) {
                                        if (err) {
                                        	return done(err);
                                        }
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/jawboneup-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                helper.load(jawboneupNode, 
                        [{id:"n4", type:"jawboneup-credentials"}], 
                          function() {
                
                    var scope = nock('https://jawbone.com:443')   
                    .filteringRequestBody(/redirect_uri=[^&]*/g, 'redirect_uri=XXX')
                    .post('/auth/oauth2/token', "redirect_uri=XXX&grant_type=authorization_code&client_id=abcdefg&client_secret=mnopqrs&code=123456")
                    .reply(200, {"oauth_access_token":"2468abc"});
                
                
                            helper.request()
                                .get('/jawboneup-credentials/auth?id=n4&clientid=abcdefg&appsecret=mnopqrs&response_type=code&callback=http://localhost:1880:/jawboneup-credentials')
                                .expect(302)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    helper.request()
                                        .get('/jawboneup-credentials/auth/callback?code=123456&state=n4:13579')
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
        
        if (nock) {

            it('fails if error fetching recommended venue information', function(done) {
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], starttime:"1417694436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                              .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417694436')
                                  .reply(200, {"meta":{"code":400, "message":'test forced failure'}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              
                              sinon.stub(n2, 'status', function(status){
                                  var expected = {fill:"red",shape:"ring",text:"failed"};
                                  should.deepEqual(status, expected);
                                  done();
                              });
                              
                              n1.send({payload:"foo", foo:"bar"});
                          });
            });
           
            it('passes on null msg.payload if no results from query', function(done) {
                
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], outputnumber:"1", outputas:"single", starttime:"1417694436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                                  .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417694436')
                                  .reply(200, {"meta":{"code":200},"data":{"items":[]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"foo", foo:"bar"});
                              n3.on('input', function(msg){
                                  var bobs = msg;
                                  msg.should.have.property('payload', null);
                                  msg.should.have.property('foo', "bar");
                                  done();
                              });
                          
                          });
            });
            
            it('can fetch multiple workouts and return as a multiple msgs', function(done) {
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], outputnumber:"10",outputas:"multiple", starttime:"1417694436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                                  .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417694436')
                                  .reply(200, {"meta":{"code":200},"data":{"items":[
                                      {"reaction":null, "time_completed": 1417696236, "title": "Run", "time_created": 1417694436, "time_updated": 1417700879},
                                      {"reaction":null, "time_completed": 1417694236, "title": "Run", "time_created": 1417692436, "time_updated": 1417700779}
                                  ]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", foo:"bar"});
                              
                              var count = 0;
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.should.not.have.property('payload', "nothing");                                  
                                  count += 1;
                                  if (count === 2) {
                                      done();
                                  }
                              });
                          
                          });
            });
 
            it('can return multiple workouts as a single msg', function(done) {
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single", starttime:"1417694436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                              .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417694436')
                              .reply(200, {"meta":{"code":200},"data":{"items":[
                                  {"reaction":null, "time_completed": 1417696236, "title": "Run", "time_created": 1417694436, "time_updated": 1417700879},
                                  {"reaction":null, "time_completed": 1417694236, "title": "Walk", "time_created": 1417692436, "time_updated": 1417700779}
                              ]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", location:{lat:"51.03", lon:"-1.4"}, section:"all", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.payload.should.be.an.instanceOf(Array);
                                  var workout1 = msg.payload[0];
                                  workout1.should.have.property('title', "Run");
                                  
                                  var workout2 = msg.payload[1];
                                  workout2.should.have.property('title', "Walk");
                                  
                                  done();
                              });
                          
                          });
            });
            
            it('can return all information about a workout', function(done) {
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], outputnumber:"1",outputas:"single", starttime:"1417694436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                              .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417694436')
                              .reply(200, {"meta":{"code":200},"data":{"items":[
                                  {"xid": "XD_ew123","reaction":null, "time_completed": 1417696236, "title": "Run", "time_created": 1417694436, "time_updated": 1417700879,
                                      "place_lat": 37.451572, "place_lon": -122.184435,"details":{"time": 1800, "meters": 5000, "calories":50}}
                              ]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", foo:"bar"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.should.have.property('title', "Run");
                                  
                                  msg.should.have.property('location');
                                  msg.location.should.have.property('lat', 37.451572);
                                  msg.location.should.have.property('lon', -122.184435);
                                  
                                  msg.payload.should.have.property('starttime');
                                  msg.payload.starttime.getTime().should.equal(1417694436);
                                  msg.payload.should.have.property('duration',1800);
                                  msg.payload.should.have.property('distance',5000);
                                  msg.payload.should.have.property('calories',50);
                                  msg.payload.should.have.property('type', "Run");
                                  msg.payload.should.have.property('id', "XD_ew123");
                                  
                                  msg.payload.details.should.have.property('meters', 5000);
                                  msg.data.details.should.have.property('meters', 5000);
                                  
                                  done();
                              });
                          
                          });
            });
            
            it('starttime set in node overrides that in the incomming message', function(done) {
                helper.load(jawboneupNode, 
                        [ {id:"n1", type:"helper", wires:[["n2"]]},
                          {id:"n4", type:"jawboneup-credentials"},
                          {id:"n2", type:"jawboneup", jawboneup: "n4", wires:[["n3"]], outputnumber:"10",outputas:"single", starttime:"1417698436"},
                          {id:"n3", type:"helper"}], 
                          {
                            "n4": {
                                displayname : "John",
                                clientid: "987654321",
                                appsecret:"123456789",
                                accesstoken:"abcd1234",
                            },
                          },
                          function() {
                              var scope = nock('https://jawbone.com:443')
                              .get('/nudge/api/v.1.1/users/@me/workouts?start_time=1417698436')
                              .reply(200, {"meta":{"code":200},"data":{"items":[
                                  {"reaction":null, "time_completed": 14176998000, "title": "Run", "time_created": 1417698436, "time_updated": 1417700879,
                                      "place_lat": 37.451572, "place_lon": -122.184435,"details":{"time": 1800, "meters": 5000, "calories":50}}                               
                              ]}});
                              
                              var n1 = helper.getNode("n1");
                              var n2 = helper.getNode("n2");
                              var n3 = helper.getNode("n3");
                              n2.should.have.property('id','n2');
                              n1.send({payload:"nothing", foo:"bar", starttime:"1417694436"});
                              n3.on('input', function(msg){
                                  msg.should.have.property('foo', "bar");
                                  msg.payload.should.be.an.instanceOf(Array).and.have.lengthOf(1);
                                  msg.payload[0].should.have.property('title', "Run");
                                  done();
                              });
                          
                          });
            });
            
            
        }}
    );
});
