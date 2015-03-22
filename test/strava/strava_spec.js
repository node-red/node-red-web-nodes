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
var sinon = require('sinon');

var stravaNode = require("../../strava/strava.js");

var helper = require('../helper.js');
var nock = helper.nock;

describe('Strava node', function() {
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
    
    describe('query node', function() {
        
        it('redirects the user to Strava for authorization', function(done) {
            var clientID = 123456789;
            var clientSecret = 987654321;
            var redirectURI = 'http://localhost:1880/strava-credentials/auth/callback';
            
            var querystring = require("querystring");
            var redirectURIQueryString = querystring.escape(redirectURI);
            
            helper.load(stravaNode, [{id:"stravaCredentials1", type:"strava-credentials"},
                                     {id:"stravaNode1", type:"strava", strava: "stravaCredentials1",request:"get-most-recent-activity", wires:[["helperNode1"]]},
                                     {id:"helperNode1", type:"helper"}],
                                     {
                                         "stravaCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                             username: "UserJohn",
                                             access_token: "AN_ACCESS_TOKEN",
                                             cliendID: "A_CLIENT_ID",
                                             redirectURI: "AN_URI",
                                         }
                                     }, function() {
                helper.request()
                .get('/strava-credentials/auth?node_id=n2&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectURI)
                .expect(302) // expect redirect
                .expect(function(res) {
                    // expect redirect with the right query
                    try {
                        res.headers.location.indexOf("https://www.strava.com/oauth/authorize/?client_id=" + clientID + "&redirect_uri=" + redirectURIQueryString + "&response_type=code&state=").should.equal(0);   
                    } catch (err) {
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
        
        it('reports an error when the UI doesn\'t supply all credentials', function(done) {
            helper.load(stravaNode, [{id:"stravaCredentials1", type:"strava-credentials"},
                                     {id:"stravaNode1", type:"strava", strava: "stravaCredentials1",request:"get-most-recent-activity", wires:[["helperNode1"]]},
                                     {id:"helperNode1", type:"helper"}],
                                     {
                                         "stravaCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                             username: "UserJohn",
                                             access_token: "AN_ACCESS_TOKEN",
                                             cliendID: "A_CLIENT_ID",
                                             redirectURI: "AN_URI",
                                         }
                                     }, function() {
                helper.request()
                .get('/strava-credentials/auth')
                .end(function(err, res) {
                    if (err) {
                    	return done(err);
                    }
                    res.text.should.equal("ERROR: Received query from UI without the needed credentials");
                    done();
                });
            });
        });
        
        if (nock) { // featues requiring HTTP communication/mocking
        	/*jshint -W082 */
            function doOauthDance(done, matchCsrfToken, return200, serveUserName, serveAccessToken) {
                var csrfToken; // required to get and process/pass on the token, otherwise OAuth fails
                
                var clientID = 123456789;
                var clientSecret = 987654321;
                var redirectURI = 'http://localhost:1880/strava-credentials/auth/callback';
                var accessToken = 'AN_ACCESS_TOKEN';
                var sessionCode = 'SOME_CODE_FROM_STRAVA';
                
                var querystring = require("querystring");
                var redirectURIQueryString = querystring.escape(redirectURI);

                var scope = null;
                
                if(return200 === true && serveUserName === true && serveAccessToken === true) {
                    scope = nock('https://www.strava.com')
                    .post('/oauth/token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&code=" + sessionCode)
                    .reply(200, {"access_token":accessToken,"athlete":{"firstname":"John","lastname": "Smith"}});
                } else if(return200 === true && serveUserName === true && serveAccessToken === false) {
                    scope = nock('https://www.strava.com')
                    .post('/oauth/token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&code=" + sessionCode)
                    .reply(200, {"athlete":{"firstname":"John","lastname": "Smith"}});
                } else if(return200 === true && serveUserName === false){
                    scope = nock('https://www.strava.com')
                    .post('/oauth/token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&code=" + sessionCode)
                    .reply(200, {"access_token":accessToken});
                } else {
                    scope = nock('https://www.strava.com')
                    .post('/oauth/token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&code=" + sessionCode)
                    .reply(404, "No tokens found, sorry!");
                }
                
                helper.load(stravaNode, [{id:"stravaCredentials1", type:"strava-credentials"},
                                         {id:"stravaNode1", type:"strava", strava: "stravaCredentials1",request:"get-most-recent-activity", wires:[["helperNode1"]]},
                                         {id:"helperNode1", type:"helper"}],
                                         {
                                             "stravaCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                 username: "UserJohn",
                                                 access_token: "AN_ACCESS_TOKEN",
                                                 cliendID: "A_CLIENT_ID",
                                                 redirectURI: "AN_URI",
                                             }
                                         }, function() {
                    helper.request()
                    .get('/strava-credentials/auth?node_id=n2&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectURI)
                    .expect(function(res) {
                        try {
                            csrfToken = res.headers.location.split("&state=n2%3A")[1];
                            if(matchCsrfToken === false) {
                                csrfToken = "sorryMismatchingToken";
                            }
                        } catch (err) {
                            done(err);
                        }
                       
                    })
                    .end(function(err, res) {
                        if (err) {
                        	return done(err);
                        }
                        // now call the callback URI as if Strava called it
                        if(matchCsrfToken === true) {
                            if(return200 === true && serveUserName === true && serveAccessToken === true) {
                                helper.request()
                                .get('/strava-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .expect(function(res) {
                                    try {
                                        res.text.indexOf("Successfully authorized with Strava.").should.not.equal(-1); // should succeed
                                    } catch (err) {
                                        done(err);
                                    }
                                })
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    // now call the callback URI as if Strava called it
                                    done();
                                });  
                            } else if (return200 === true && serveUserName === true && serveAccessToken === false) {
                                helper.request()
                                .get('/strava-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Error! Strava node has failed to fetch a valid access token.");
                                    done();
                                }); 
                            }
                            else if(return200 === true && serveUserName === false){
                                helper.request()
                                .get('/strava-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Error! Strava node has failed to fetch the authenticated user\'s name.");
                                    done();
                                }); 
                            } else {
                                helper.request()
                                .get('/strava-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Strava replied with the unexpected HTTP status code of 404");
                                    done();
                                }); 
                            } 
                        } else {
                            helper.request()
                            .get('/strava-credentials/auth/callback?state=n2:' + csrfToken)
                            .end(function(err, res) {
                                if (err) {
                                	return done(err);
                                }
                                res.text.should.equal("CSRF token mismatch, possible cross-site request forgery attempt.");
                                done();
                            });   
                        }
                    });
                });
            }
            
            it('can do oauth dance', function(done) {
                doOauthDance(done, true, true, true, true);
            });
            
            it('reports csrftoken mismatch', function(done) {
                doOauthDance(done, false, true, true, true);
            });
            
            it('reports failure if Strava throws an error', function(done) {
                doOauthDance(done, true, false, true, true);
            });
            
            it('reports failure if Strava doesn\'t serve a user name', function(done) {
                doOauthDance(done, true, true, false, true);
            });
            
            it('reports failure if Strava doesn\'t serve an access token', function(done) {
                doOauthDance(done, true, true, true, false);
            });
            
            it('gets the most recent activity details', function(done) {
                var activityID = "TEST_ID";
                var type = "testType";
                var duration = "1000";
                var distance = "2000";
                var calories = "500";
                var startTime = "2014-12-05T13:00:00Z";
                var latitude = "51.03";
                var longitude = "-1.4";
                var title = "aTitle";
                var otherData = "otherStuff";
                
                var scope = nock('https://www.strava.com')
                .get('/api/v3/athlete/activities')
                .reply(200, [{"id":activityID}])
                .get('/api/v3/activities/' + activityID)
                .reply(200, {"id":activityID,"name":title,"distance":distance,"moving_time":duration,"elapsed_time":duration,"type":type,"start_date":startTime,"start_date_local":startTime,"start_latitude":latitude,"start_longitude":longitude,"calories":calories,"otherData":otherData});
                
                helper.load(stravaNode, [{id:"stravaCredentials1", type:"strava-credentials"},
                                         {id:"stravaNode1", type:"strava", strava: "stravaCredentials1",request:"get-most-recent-activity", wires:[["helperNode1"]]},
                                         {id:"helperNode1", type:"helper"}],
                                         {
                                             "stravaCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                 username: "UserJohn",
                                                 access_token: "AN_ACCESS_TOKEN",
                                                 cliendID: "A_CLIENT_ID",
                                                 redirectURI: "AN_URI",
                                             }
                                         }, function() {
                                                var stravaNode1 = helper.getNode("stravaNode1");
                                                var helperNode1 = helper.getNode("helperNode1");
                                                
                                                helperNode1.on("input", function(msg) {
                                                    
                                                    try {
                                                        msg.payload.id.should.equal(activityID);
                                                        msg.payload.title.should.equal(title);
                                                        msg.payload.type.should.equal(type);
                                                        msg.payload.duration.should.equal(duration);
                                                        msg.payload.distance.should.equal(distance);
                                                        msg.payload.calories.should.equal(calories);
                                                        msg.payload.starttime.valueOf().should.equal(new Date(Date.parse(startTime)).valueOf());
                                                        
                                                        if(msg.payload.otherData) {
                                                            should.fail("otherData should only be passed to msg.data!");
                                                        }
                                                        
                                                        msg.location.lat.should.equal(latitude);
                                                        msg.location.lon.should.equal(longitude);
                                                        
                                                        msg.data.id.should.equal(activityID);
                                                        msg.data.name.should.equal(title);
                                                        msg.data.type.should.equal(type);
                                                        msg.data.elapsed_time.should.equal(duration);
                                                        msg.data.distance.should.equal(distance);
                                                        msg.data.calories.should.equal(calories);
                                                        msg.data.start_date_local.should.equal(startTime);
                                                        msg.data.otherData.should.equal(otherData);
                                                        msg.data.start_latitude.should.equal(latitude);
                                                        msg.data.start_longitude.should.equal(longitude);
                                                        done();
                                                    } catch(err) {
                                                        done(err);
                                                    }
                                                });
                                                stravaNode1.receive({payload:""});
                                            });
            });
        }
    });
});
