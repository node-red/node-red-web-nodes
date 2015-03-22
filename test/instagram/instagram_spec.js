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

var instagramNode = require("../../instagram/instagram.js");

var helper = require('../helper.js');
var nock = helper.nock;

var testInterval;

describe('instagram nodes', function() {
    beforeEach(function(done) {
        if (testInterval !== null) {
            clearInterval(testInterval);
        }
        helper.startServer(done);
    });

    afterEach(function(done) {
        if(nock) {
            nock.cleanAll();
        }
        if (testInterval !== null) {
            clearInterval(testInterval);
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
        
        it('redirects the user to Instagram for authorization', function(done) {
            var clientID = 123456789;
            var clientSecret = 987654321;
            var redirectURI = 'http://localhost:1880/instagram-credentials/auth/callback';
            
            var querystring = require("querystring");
            var redirectURIQueryString = querystring.escape(redirectURI);
            helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                        {id:"instagramNode1", type:"instagram", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                        {id:"helperNode1", type:"helper"}],
                                        {
                                            "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                username: "UserJohn",
                                                access_token: "AN_ACCESS_TOKEN",
                                                cliend_id: "A_CLIENT_ID",
                                                client_secret: "A_CLIENT_SECRET",
                                                redirect_uri: "AN_URI",
                                                code: "A_CODE"
                                            }
                                        }, function() {
                helper.request()
                .get('/instagram-credentials/auth?node_id=n2&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectURI)
                .expect(302) // expect redirect
                .expect(function(res) {
                    // expect redirect with the right query
                    try {
                        res.headers.location.indexOf("https://api.instagram.com/oauth/authorize/?client_id=" + clientID + "&redirect_uri=" + redirectURIQueryString + "&response_type=code&state=").should.equal(0);   
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
            helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                        {id:"instagramNode1", type:"instagram", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                        {id:"helperNode1", type:"helper"}],
                                        {
                                            "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                username: "UserJohn",
                                                access_token: "AN_ACCESS_TOKEN",
                                                cliend_id: "A_CLIENT_ID",
                                                client_secret: "A_CLIENT_SECRET",
                                                redirect_uri: "AN_URI",
                                                code: "A_CODE"
                                            }
                                        }, function() {
                helper.request()
                .get('/instagram-credentials/auth')
                .end(function(err, res) {
                    if (err) {
                    	return done(err);
                    }
                    res.text.should.equal("ERROR: Received query from UI without the needed credentials");
                    done();
                });
            });
        });
        
        if (nock) { // featues requiring HTTP communication/mocking // TODO check if all tests require nock here
        	/*jshint -W082 */
            function doOauthDance(done, matchCsrfToken, return200, serveUserName, serveAccessToken) {
                var csrfToken; // required to get and process/pass on the token, otherwise OAuth fails
                
                var clientID = 123456789;
                var clientSecret = 987654321;
                var redirectURI = 'http://localhost:1880/instagram-credentials/auth/callback';
                var accessToken = 'AN_ACCESS_TOKEN';
                var sessionCode = 'SOME_CODE_FROM_INSTAGRAM';
                
                var querystring = require("querystring");
                var redirectURIQueryString = querystring.escape(redirectURI);
                
                var scope = null;
                
                if(return200 === true && serveUserName === true && serveAccessToken === true) {
                    scope = nock('https://api.instagram.com')
                    .post('/oauth/access_token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&grant_type=authorization_code&redirect_uri=" + redirectURIQueryString + "&code=" + sessionCode)
                    .reply(200, {"access_token":accessToken,"user":{"username":"UserJoe","bio":"","website":"","profile_picture":"http://profile.picture","full_name":"UserJoe","id":"anUserID"}})
                    .get('/v1/users/self?access_token=' + accessToken)
                    .reply(200, {"meta":{"code":200},"data":{"username":"UserJoe"}});
                }else if(return200 === true && serveUserName === true && serveAccessToken === false) {
                    scope = nock('https://api.instagram.com')
                    .post('/oauth/access_token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&grant_type=authorization_code&redirect_uri=" + redirectURIQueryString + "&code=" + sessionCode)
                    .reply(200, {"user":{"username":"UserJoe","bio":"","website":"","profile_picture":"http://profile.picture","full_name":"UserJoe","id":"anUserID"}});
                }
                else if(return200 === true && serveUserName === false){
                    scope = nock('https://api.instagram.com')
                    .post('/oauth/access_token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&grant_type=authorization_code&redirect_uri=" + redirectURIQueryString + "&code=" + sessionCode)
                    .reply(200, {"access_token":accessToken,"user":{"bio":"","website":"","profile_picture":"http://profile.picture","full_name":"UserJoe","id":"anUserID"}})
                    .get('/v1/users/self?access_token=' + accessToken)
                    .reply(200, {"meta":{"code":200},"data":{"username":"UserJoe"}});
                } else {
                    scope = nock('https://api.instagram.com')
                    .post('/oauth/access_token', "client_id=" + clientID + "&client_secret=" + clientSecret + "&grant_type=authorization_code&redirect_uri=" + redirectURIQueryString + "&code=" + sessionCode)
                    .reply(404, "No tokens found, sorry!");
                }
                
                helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                            {id:"instagramNode1", type:"instagram", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                            {id:"helperNode1", type:"helper"}],
                                            {
                                                "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                    username: "UserJohn",
                                                    access_token: "AN_ACCESS_TOKEN",
                                                    cliend_id: "A_CLIENT_ID",
                                                    client_secret: "A_CLIENT_SECRET",
                                                    redirect_uri: "AN_URI",
                                                    code: "A_CODE"
                                                }
                                            }, function() {
                    helper.request()
                    .get('/instagram-credentials/auth?node_id=n2&client_id=' + clientID + '&client_secret=' + clientSecret + '&redirect_uri=' + redirectURI)
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
                        // now call the callback URI as if Instagram called it
                        if(matchCsrfToken === true) {
                            if(return200 === true && serveUserName === true && serveAccessToken === true) {
                                helper.request()
                                .get('/instagram-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .expect(function(res) {
                                    try {
                                        res.text.indexOf("Successfully authorized with Instagram").should.not.equal(-1); // should succeed
                                    } catch (err) {
                                        done(err);
                                    }
                                })
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    // now call the callback URI as if Instagram called it
                                    done();
                                });  
                            } else if (return200 === true && serveUserName === true && serveAccessToken === false) {
                                helper.request()
                                .get('/instagram-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Error! Instagram node has failed to fetch a valid access token.");
                                    done();
                                }); 
                            }
                            else if(return200 === true && serveUserName === false){
                                helper.request()
                                .get('/instagram-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Error! Instagram node has failed to fetch the username.");
                                    done();
                                }); 
                            } else {
                                helper.request()
                                .get('/instagram-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
                                .end(function(err, res) {
                                    if (err) {
                                    	return done(err);
                                    }
                                    res.text.should.equal("Instagram replied with the unexpected HTTP status code of 404\nDetails:\nNo tokens found, sorry!");
                                    done();
                                }); 
                            }
                        } else {
                            helper.request()
                            .get('/instagram-credentials/auth/callback?code=' + sessionCode + '&state=n2:' + csrfToken)
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
            
            it('reports failure if Instagram throws an error', function(done) {
                doOauthDance(done, true, false, true, true);
            });
            
            it('reports failure if Instagram doesn\'t serve a user name', function(done) {
                doOauthDance(done, true, true, false, true);
            });
            
            it('reports failure if Instagram doesn\'t serve an access token', function(done) {
                doOauthDance(done, true, true, true, false);
            });
            
            it('handles like with init and gets metadata', function(done) {
                
                var newPhotoURL = "http://new_liked_photo_standard.jpg";
                var oldID = "MY_OLD_MEDIA_ID";
                
                var injectedLat = "51.025115599";
                var injectedLon = "-1.396541077";
                var injectedTime = "1411724651";
                
                var timeAsJSDate = new Date(injectedTime * 1000);
                
                // need to fake the HTTP requests of the init sequence, then straight away the sequence of getting a second photo
                var scope = nock('https://api.instagram.com')
               .get('/v1/users/self/media/liked?count=1&access_token=AN_ACCESS_TOKEN')
               .reply(200,{"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":newPhotoURL}}, "created_time":injectedTime, "location":{"latitude": injectedLat, "name": "IBM Hursley", "longitude": injectedLon}}, {"attribution":null,"tags":[],"type":"image","id":oldID}]});

                helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                            {id:"instagramNode1", type:"instagram", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                            {id:"helperNode1", type:"helper"}],
                                            {
                                                "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                    username: "UserJohn",
                                                    access_token: "AN_ACCESS_TOKEN",
                                                    cliend_id: "A_CLIENT_ID",
                                                    client_secret: "A_CLIENT_SECRET",
                                                    redirect_uri: "AN_URI",
                                                    code: "A_CODE"
                                                }
                                            }, function() {

                    var instagramNode1 = helper.getNode("instagramNode1");
                    var helperNode1 = helper.getNode("helperNode1");
                    
                    helperNode1.on("input", function(msg) {
                        try {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            msg.location.lat.should.equal(injectedLat);
                            msg.location.lon.should.equal(injectedLon);
                            msg.time.toString().should.equal(timeAsJSDate.toString());
                            msg.payload.should.equal(newPhotoURL);
                            done();
                        } catch(err) {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            done(err);
                        }
                    });
                    
                    testInterval = setInterval(function() { // self trigger
                        if(instagramNode1._events.input) {
                            instagramNode1.receive({payload:""});
                        }
                    }, 100);
                });
            });
            
            it('manages to buffer an image and handles metadata', function(done) {
                var photo = '/photo.jpg';
                var apiURI = 'https://api.instagram.com';
                var photoURI = apiURI + photo;
                
                var replyText = "Hello World";
                
                var injectedLat = "51.025115599";
                var injectedLon = "-1.396541077";
                var injectedTime = "1411724651";
                
                var timeAsJSDate = new Date(injectedTime * 1000);
                
                var scope = nock('https://api.instagram.com')
               .get('/v1/users/self/media/recent?count=1&access_token=AN_ACCESS_TOKEN') // request to get the initial photos uploaded by the user
               .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":photoURI,"width":640,"height":640}},"id":"A_NEW_PHOTO_ID", "created_time":injectedTime, "location":{"latitude": injectedLat, "name": "IBM Hursley", "longitude": injectedLon}}]})
               .get(photo)
               .reply(200, replyText);
                
                helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                            {id:"instagramNode1", type:"instagram", instagram: "instagramCredentials1","inputType":"photo","outputType":"buffer", wires:[["helperNode1"]]},
                                            {id:"helperNode1", type:"helper"}],
                                            {
                                                "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                    username: "UserJohn",
                                                    access_token: "AN_ACCESS_TOKEN",
                                                    cliend_id: "A_CLIENT_ID",
                                                    client_secret: "A_CLIENT_SECRET",
                                                    redirect_uri: "AN_URI",
                                                    code: "A_CODE"
                                                }
                                            }, function() {

                    var instagramNode1 = helper.getNode("instagramNode1");
                    var helperNode1 = helper.getNode("helperNode1");
                    
                    helperNode1.on("input", function(msg) {
                        try {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            
                            msg.location.lat.should.equal(injectedLat);
                            msg.location.lon.should.equal(injectedLon);
                            msg.time.toString().should.equal(timeAsJSDate.toString());
                            
                            msg.payload.toString().should.equal(replyText);
                            done();
                        } catch(err) {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            done(err);
                        }
                    });
                    
                    testInterval = setInterval(function() { // self trigger
                        if(instagramNode1._events.input) {
                            instagramNode1.receive({payload:""});
                        }
                    }, 100);
                });
            });
        }
    });
    
    describe('input node', function() {
        if(nock) {
            it('handles its own input event registration/deregistration', function(done) {
                var scope = nock('https://api.instagram.com')
               .get('/v1/users/self/media/liked?count=1&access_token=AN_ACCESS_TOKEN')
               .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","user_has_liked":true,"id":"irrelevant"}]})
               .get('/v1/users/self/media/liked?access_token=AN_ACCESS_TOKEN')
               .reply(200,{"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":"irrelevant"}}}, {"attribution":null,"tags":[],"type":"image","id":"irrelevant"}]});
                helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                            {id:"instagramNode1", type:"instagram in", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                            {id:"helperNode1", type:"helper"}],
                                            {
                                                "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                    username: "UserJohn",
                                                    access_token: "AN_ACCESS_TOKEN",
                                                    cliend_id: "A_CLIENT_ID",
                                                    client_secret: "A_CLIENT_SECRET",
                                                    redirect_uri: "AN_URI",
                                                    code: "A_CODE"
                                                }
                                            }, function() {

                    var instagramNode1 = helper.getNode("instagramNode1");
                    var helperNode1 = helper.getNode("helperNode1");
                    
                    helperNode1.on("input", function(msg) {

                    });
                    
                    testInterval = setInterval(function() {
                        if(instagramNode1._events.input) {
                            instagramNode1.interval._repeat.should.be.true; // ensure that the query interval is indeed set
                            helper.unload();
                            helper.stopServer();
                            clearInterval(testInterval);
                            testInterval = setInterval(function() {
                                if(instagramNode1.interval._repeat === false) {
                                    done(); // success, the automatic interval has been cleared
                                }
                            }, 100);
                        }
                    }, 100);
                });
                
            });
            /*jshint -W082 */
            function fetchUploadedPhotos(done, workingFirstRequest, workingSubsequentRequest) {
            // need to fake the HTTP requests of the init sequence, then straight away the sequence of getting a second photo 
            var photoURI = 'http://mytesturl.com/aPhotoStandard.jpg';
            
            var scope;
            
            if(workingFirstRequest === true && workingSubsequentRequest === true) {
                scope = nock('https://api.instagram.com')
                .get('/v1/users/self/media/recent?count=1&access_token=AN_ACCESS_TOKEN') // request to get the initial photos uploaded by the user
                .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","id":"MY_OLD_MEDIA_ID"}]})
                .get('/v1/users/self/media/recent?min_id=MY_OLD_MEDIA_ID&access_token=AN_ACCESS_TOKEN')
                .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":photoURI,"width":640,"height":640}},"id":"A_NEW_PHOTO_ID"}]});
                
            } else if(workingFirstRequest === true && workingSubsequentRequest === false) {
                scope = nock('https://api.instagram.com')
                .get('/v1/users/self/media/recent?count=1&access_token=AN_ACCESS_TOKEN') // request to get the initial photos uploaded by the user
                .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","id":"MY_OLD_MEDIA_ID"}]})
                .get('/v1/users/self/media/recent?min_id=MY_OLD_MEDIA_ID&access_token=AN_ACCESS_TOKEN')
                .reply(500, "The second call to the API doesn't work today, sorry!");
            } else if(workingFirstRequest === false && workingSubsequentRequest === true) {
                scope = nock('https://api.instagram.com')
                .get('/v1/users/self/media/recent?count=1&access_token=AN_ACCESS_TOKEN') // request to get the initial photos uploaded by the user
                .reply(500, "Sorry, we're terribly broken!");
            } else {
                // won't actually occur with current tests as the first failure breaks everything
            }
                 helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                        {id:"instagramNode1", type:"instagram in", instagram: "instagramCredentials1","inputType":"photo","outputType":"link", wires:[["helperNode1"]]},
                                        {id:"helperNode1", type:"helper"}],
                                        {
                                            "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                username: "UserJohn",
                                                access_token: "AN_ACCESS_TOKEN",
                                                cliend_id: "A_CLIENT_ID",
                                                client_secret: "A_CLIENT_SECRET",
                                                redirect_uri: "AN_URI",
                                                code: "A_CODE"
                                            }
                                        }, function() {
                var instagramNode1 = helper.getNode("instagramNode1");
                var helperNode1 = helper.getNode("helperNode1");
                
                if(workingSubsequentRequest === false) {
                    var sinon = require("sinon");
                    var stub = sinon.stub(instagramNode1, 'warn', function() {
                        stub.restore();
                        stub = null;
                        done();
                    });
                }
                 
                if(workingFirstRequest === true) {
                    helperNode1.on("input", function(msg) {
                        try {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            msg.payload.should.equal(photoURI);
                            done();
                        } catch(err) {
                            if (testInterval !== null) {
                                clearInterval(testInterval);
                            }
                            done(err);
                        }
                    });
                    
                    var testInterval = setInterval(function() { // self trigger
                        if(instagramNode1._events.input) {
                            instagramNode1.receive({payload:""});
                        }
                    }, 100);
                }
            });
        }
          
        it('handles a photo upload and init', function(done) {
            fetchUploadedPhotos(done, true, true);
        });
          
        // TODO => Find out how to stub the first request, the problem is that it happens straight during init!
  //      it('reports a failure when it fails to get initial user photos', function(done) {
  //          fetchUploadedPhotos(done, false, true);
  //      });
          
        // TODO, stubbing the likes test doesn't make sense right now as the above TODO is to be solved
        // furthermore the stubbing scoping is also to be solved
          
        it('reports a failure when it fails to get subsequent user photos', function(done) {
            fetchUploadedPhotos(done, true, false);
        });
          
        it('handles like with init and gets metadata', function(done) {
            
            var newPhotoURL = "http://new_liked_photo_standard.jpg";
            var oldID = "MY_OLD_MEDIA_ID";
            
            var injectedLat = "51.025115599";
            var injectedLon = "-1.396541077";
            var injectedTime = "1411724651";
            
            var timeAsJSDate = new Date(injectedTime * 1000);
            
            // need to fake the HTTP requests of the init sequence, then straight away the sequence of getting a second photo
            var scope = nock('https://api.instagram.com')
           .get('/v1/users/self/media/liked?count=1&access_token=AN_ACCESS_TOKEN')
           .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","user_has_liked":true,"id":oldID}]})
           .get('/v1/users/self/media/liked?access_token=AN_ACCESS_TOKEN')
           .reply(200,{"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":newPhotoURL}}, "created_time":injectedTime, "location":{"latitude": injectedLat, "name": "IBM Hursley", "longitude": injectedLon}}, {"attribution":null,"tags":[],"type":"image","id":oldID}]});

            helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                        {id:"instagramNode1", type:"instagram in", instagram: "instagramCredentials1","inputType":"like","outputType":"link", wires:[["helperNode1"]]},
                                        {id:"helperNode1", type:"helper"}],
                                        {
                                            "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                username: "UserJohn",
                                                access_token: "AN_ACCESS_TOKEN",
                                                cliend_id: "A_CLIENT_ID",
                                                client_secret: "A_CLIENT_SECRET",
                                                redirect_uri: "AN_URI",
                                                code: "A_CODE"
                                            }
                                        }, function() {
    
                var instagramNode1 = helper.getNode("instagramNode1");
                var helperNode1 = helper.getNode("helperNode1");
                
                helperNode1.on("input", function(msg) {
                    try {
                        if (testInterval !== null) {
                            clearInterval(testInterval);
                        }
                        msg.location.lat.should.equal(injectedLat);
                        msg.location.lon.should.equal(injectedLon);
                        msg.time.toString().should.equal(timeAsJSDate.toString());
                        msg.payload.should.equal(newPhotoURL);
                        done();
                    } catch(err) {
                        if (testInterval !== null) {
                            clearInterval(testInterval);
                        }
                        done(err);
                    }
                });
                
                testInterval = setInterval(function() { // self trigger
                    if(instagramNode1._events.input) {
                        instagramNode1.receive({payload:""});
                    }
                }, 100);
            });
        });
          
        it('manages to buffer an image and handles metadata', function(done) {
            var photo = '/photo.jpg';
            var apiURI = 'https://api.instagram.com';
            var photoURI = apiURI + photo;
            
            var replyText = "Hello World";
            
            var injectedLat = "51.025115599";
            var injectedLon = "-1.396541077";
            var injectedTime = "1411724651";
            
            var timeAsJSDate = new Date(injectedTime * 1000);
            
            var scope = nock('https://api.instagram.com')
           .get('/v1/users/self/media/recent?count=1&access_token=AN_ACCESS_TOKEN') // request to get the initial photos uploaded by the user
           .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","id":"MY_OLD_MEDIA_ID"}]})
           .get('/v1/users/self/media/recent?min_id=MY_OLD_MEDIA_ID&access_token=AN_ACCESS_TOKEN')
           .reply(200, {"pagination":{},"meta":{"code":200},"data":[{"attribution":null,"tags":[],"type":"image","images":{"standard_resolution":{"url":photoURI,"width":640,"height":640}},"id":"A_NEW_PHOTO_ID", "created_time":injectedTime, "location":{"latitude": injectedLat, "name": "IBM Hursley", "longitude": injectedLon}}]})
           .get(photo)
           .reply(200, replyText);
            
            helper.load(instagramNode, [{id:"instagramCredentials1", type:"instagram-credentials"},
                                        {id:"instagramNode1", type:"instagram in", instagram: "instagramCredentials1","inputType":"photo","outputType":"buffer", wires:[["helperNode1"]]},
                                        {id:"helperNode1", type:"helper"}],
                                        {
                                            "instagramCredentials1" : { // pre-loaded credentials, no need to call OAuth
                                                username: "UserJohn",
                                                access_token: "AN_ACCESS_TOKEN",
                                                cliend_id: "A_CLIENT_ID",
                                                client_secret: "A_CLIENT_SECRET",
                                                redirect_uri: "AN_URI",
                                                code: "A_CODE"
                                            }
                                        }, function() {
    
                var instagramNode1 = helper.getNode("instagramNode1");
                var helperNode1 = helper.getNode("helperNode1");
                
                helperNode1.on("input", function(msg) {
                    try {
                        if (testInterval !== null) {
                            clearInterval(testInterval);
                        }
                        
                        msg.location.lat.should.equal(injectedLat);
                        msg.location.lon.should.equal(injectedLon);
                        msg.time.toString().should.equal(timeAsJSDate.toString());
                        
                        msg.payload.toString().should.equal(replyText);
                        done();
                    } catch(err) {
                        if (testInterval !== null) {
                            clearInterval(testInterval);
                        }
                        done(err);
                    }
                });
                
                testInterval = setInterval(function() { // self trigger
                    if(instagramNode1._events.input) {
                        instagramNode1.receive({payload:""});
                    }
                }, 100);
            });
        });
      }
    });
});
