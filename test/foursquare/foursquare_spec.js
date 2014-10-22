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

var foursquareNode = require("../../foursquare/foursquare.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('foursquare nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
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
                                        if (err) return done(err);
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                                if (err) return done(err);
                              var state = res.text.split("state=n4%253A");
                              helper.request()
                                  .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                                        if (err) return done(err);
                                        var state = res.text.split("state=n4%253A");
                                        helper.request()
                                            .get('/foursquare-credentials/auth/callback?code=123456&state=n4:'+state[1])
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
                                    if (err) return done(err);
                                    helper.request()
                                        .get('/foursquare-credentials/auth/callback?code=123456&state=n4:13579')
                                        .expect(401)
                                        .end(function(err, res) {
                                            if (err) return done(err);
                                            res.text.should.containEql('CSRF token mismatch, possible cross-site request forgery attempt');
                                            done();
                                        });
                                });
                });
            });            
            
        }
       
    });
    
});
