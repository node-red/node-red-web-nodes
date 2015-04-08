/**
 * Copyright 2015 IBM Corp.
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
var sinon = require("sinon");
var url = require('url');
var googleNode = require("../../google/google.js");
var plusNode = require("../../google/plus.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('google plus', function () {

    before(function (done) {
        helper.startServer(done);
    });

    afterEach(function () {
        helper.unload();
    });

    it('can be loaded without credentials', function (done) {
        helper.load(plusNode, [{
                id: "plus",
                type: "google plus"
    }
   ], function () {
            var n = helper.getNode("plus");
            n.should.have.property('id', 'plus');
            done();
        });
    });

    if (!nock)
        return;

    describe('people', function () {

        describe('get', function () {

            it("should return people id search", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "people",
                        action: "get",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/people/1')
                        .reply(200, {
                            "kind": "plus#person",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/9Gj5LYGPevqG-vqLMe9CO57SDFA\"",
                            "gender": "male",
                            "emails": [
                                {
                                    "value": "tom@example.com",
                                    "type": "account"
  }
 ],
                            "objectType": "person",
                            "id": "1",
                            "displayName": "Tom Example",
                            "name": {
                                "familyName": "Example",
                                "givenName": "Tom"
                            },
                            "url": "https://plus.google.com/1",
                            "image": {
                                "url": "https://example.com/user.png",
                                "isDefault": false
                            },
                            "isPlusUser": true,
                            "language": "en",
                            "ageRange": {
                                "min": 21
                            },
                            "circledByCount": 0,
                            "verified": false
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('payload');
                        msg.payload.should.have.property('emails');
                        msg.payload.emails.length.should.equal(1);
                        msg.payload.should.have.property('displayName', 'Tom Example');
                        msg.payload.should.have.property('url', 'https://plus.google.com/1');
                        msg.payload.should.have.property('isPlusUser', true);
                        done();
                    });
                    input.send({
                        userId: 1
                    });
                });
            });

            it("should default person id to 'me'", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "people",
                        action: "get",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/people/me')
                        .reply(200, {
                            "kind": "plus#person",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/9Gj5LYGPevqG-vqLMe9CO57SDFA\"",
                            "gender": "male",
                            "emails": [
                                {
                                    "value": "tom@example.com",
                                    "type": "account"
  }
 ],
                            "objectType": "person",
                            "id": "1",
                            "displayName": "Tom Example",
                            "name": {
                                "familyName": "Example",
                                "givenName": "Tom"
                            },
                            "url": "https://plus.google.com/1",
                            "image": {
                                "url": "https://example.com/user.png",
                                "isDefault": false
                            },
                            "isPlusUser": true,
                            "language": "en",
                            "ageRange": {
                                "min": 21
                            },
                            "circledByCount": 0,
                            "verified": false
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.should.have.property('payload');
                        msg.payload.should.have.property('emails');
                        msg.payload.emails.length.should.equal(1);
                        msg.payload.should.have.property('displayName', 'Tom Example');
                        msg.payload.should.have.property('url', 'https://plus.google.com/1');
                        msg.payload.should.have.property('isPlusUser', true);
                        done();
                    });
                    input.send({});
                });
            });
        });

        describe('search', function () {

            it("should return people search request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "people",
                        action: "search",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/people?query=Tom%20Example')
                        .reply(200, {
                            "kind": "plus#peopleFeed",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/jaTbssUzfMZIdCAqGZMxwQqkAag\"",
                            "selfLink": "https://content.googleapis.com/plus/v1/people?query=Tom+Example",
                            "title": "Google+ People Search Results",
                            "nextPageToken": "npt",
                            "items": [
                                {
                                    "kind": "plus#person",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/NbfGnvGwput12PW85grAB-psmrY\"",
                                    "objectType": "person",
                                    "id": "1",
                                    "displayName": "Tom Example",
                                    "url": "https://plus.google.com/1",
                                    "image": {
                                        "url": "image_url1"
                                    }
  },
                                {
                                    "kind": "plus#person",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/qJHrefvAGFVQ6WwBlZqpUUCQIC8\"",
                                    "objectType": "person",
                                    "id": "2",
                                    "displayName": "Tom Sample",
                                    "url": "https://plus.google.com/2",
                                    "image": {
                                        "url": "image_url2"
                                    }
  }]
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('results');
                        msg.payload.results.length.should.be.above(1);
                        msg.payload.results[0].should.have.properties({
                            displayName: 'Tom Example',
                            id: '1',
                            image: 'image_url1',
                            url: 'https://plus.google.com/1'
                        });
                        msg.payload.results[1].should.have.properties({
                            displayName: 'Tom Sample',
                            id: '2',
                            image: 'image_url2',
                            url: 'https://plus.google.com/2'
                        });
                        done();
                    });
                    input.send({
                        query: "Tom Example"
                    });
                });
            });

        });

        describe('list', function () {

            it("should return people list request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "people",
                        action: "list",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/people/me/people/visible')
                        .reply(200, {
                            "kind": "plus#peopleFeed",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/h9MEBi1fZBgoX2kOusJvueW55BE\"",
                            "title": "Google+ List of Visible People",
                            "totalItems": 2,
                            "items": [
                                {
                                    "kind": "plus#person",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/zTXEpvIpWo2aAFasV290NOgPMTs\"",
                                    "objectType": "person",
                                    "id": "1",
                                    "displayName": "Tom Sample",
                                    "url": "https://plus.google.com/1",
                                    "image": {
                                        "url": "image_url1"
                                    }
  },
                                {
                                    "kind": "plus#person",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/ZbOtf2R5l1uoBOf8epEEqCOq2tk\"",
                                    "objectType": "person",
                                    "id": "2",
                                    "displayName": "Tom Example",
                                    "url": "https://plus.google.com/2",
                                    "image": {
                                        "url": "image_url2"
                                    }
  }
 ]
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('results');
                        msg.payload.results.length.should.be.above(1);
                        msg.payload.results[0].should.have.properties({
                            displayName: 'Tom Sample',
                            id: '1',
                            image: 'image_url1',
                            url: 'https://plus.google.com/1'
                        });
                        msg.payload.results[1].should.have.properties({
                            displayName: 'Tom Example',
                            id: '2',
                            image: 'image_url2',
                            url: 'https://plus.google.com/2'
                        });
                        done();
                    });
                    input.send({
                        userId: "me",
                        collection: "visible"
                    });
                });
            });
        });

    });

    describe('activities', function () {

        describe('get', function () {

            it("should return activities get request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "activities",
                        action: "get",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/activities/z13')
                        .reply(200, {
                            "kind": "plus#activity",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/4bzU4LC6Wod5uwxN2Je3f6R6wfs\"",
                            "title": "My trip to France",
                            "published": "2015-03-25T22:27:21.802Z",
                            "updated": "2015-03-25T22:27:21.802Z",
                            "id": "z13",
                            "url": "https://plus.google.com/1/posts/z13",
                            "actor": {
                                "id": "1",
                                "displayName": "Tom Sample",
                                "url": "https://plus.google.com/1",
                                "image": {
                                    "url": "image_url1"
                                }
                            },
                            "verb": "post",
                            "object": {
                                "objectType": "note",
                                "content": "CONTENT",
                                "replies": {
                                    "totalItems": 0,
                                    "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/comments"
                                },
                                "plusoners": {
                                    "totalItems": 2,
                                    "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/plusoners"
                                },
                                "resharers": {
                                    "totalItems": 0,
                                    "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/resharers"
                                },
                                "attachments": [
                                    {
                                        "objectType": "photo",
                                        "id": "1001",
                                        "content": "image.jpg",
                                        "url": "https://plus.google.com/photos/1/albums/613/613",
                                        "image": {
                                            "url": "image_urlA",
                                            "type": "image/jpeg"
                                        },
                                        "fullImage": {
                                            "url": "image_urlA",
                                            "type": "image/jpeg",
                                            "height": 400,
                                            "width": 888
                                        }
   }
  ]
                            },
                            "provider": {
                                "title": "Google+"
                            },
                            "access": {
                                "kind": "plus#acl",
                                "description": "Public",
                                "items": [
                                    {
                                        "type": "public"
   }
  ]
                            }
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('id', 'z13');
                        msg.payload.should.have.property('actor', {
                            displayName: 'Tom Sample',
                            id: '1'
                        });
                        msg.payload.should.have.property('object');
                        msg.payload.object.should.have.property('content', 'CONTENT');
                        msg.payload.should.have.property('published');
                        msg.payload.should.have.property('updated');
                        msg.payload.should.have.property('url', 'https://plus.google.com/1/posts/z13');
                        msg.payload.should.have.property('verb', 'post');
                        done();
                    });
                    input.send({
                        activityId: 'z13'
                    });
                });
            });
        });

        describe('search', function () {

            it("should return activities search request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "activities",
                        action: "search",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/activities?query=trip')
                        .reply(200, {
                            "kind": "plus#activityFeed",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/gE_VFHSZeIhWKIYFeWs9tTpfHI8\"",
                            "nextPageToken": "npt",
                            "selfLink": "https://content.googleapis.com/plus/v1/activities?query=trip",
                            "title": "Google+ Activities Search Results",
                            "items": [
                                {
                                    "kind": "plus#activity",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/4bzU4LC6Wod5uwxN2Je3f6R6wfs\"",
                                    "title": "My trip to France",
                                    "published": "2015-03-25T22:27:21.802Z",
                                    "updated": "2015-03-25T22:27:21.802Z",
                                    "id": "z13",
                                    "url": "https://plus.google.com/1/posts/z13",
                                    "actor": {
                                        "id": "1",
                                        "displayName": "Tom Sample",
                                        "url": "https://plus.google.com/1",
                                        "image": {
                                            "url": "image_url1"
                                        }
                                    },
                                    "verb": "post",
                                    "object": {
                                        "objectType": "note",
                                        "content": "CONTENT",
                                        "replies": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/comments"
                                        },
                                        "plusoners": {
                                            "totalItems": 2,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/plusoners"
                                        },
                                        "resharers": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/resharers"
                                        },
                                        "attachments": [
                                            {
                                                "objectType": "photo",
                                                "id": "1001",
                                                "content": "image.jpg",
                                                "url": "https://plus.google.com/photos/1/albums/613/613",
                                                "image": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg"
                                                },
                                                "fullImage": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg",
                                                    "height": 400,
                                                    "width": 888
                                                }
   }
  ]
                                    },
                                    "provider": {
                                        "title": "Google+"
                                    },
                                    "access": {
                                        "kind": "plus#acl",
                                        "description": "Public",
                                        "items": [
                                            {
                                                "type": "public"
   }
  ]
                                    }
                        },
                                {
                                    "kind": "plus#activity",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/4bzU4LC6Wod5uwxN2Je3f6R6wfs\"",
                                    "title": "My trip to Germany",
                                    "published": "2015-03-25T22:27:21.802Z",
                                    "updated": "2015-03-25T22:27:21.802Z",
                                    "id": "z17",
                                    "url": "https://plus.google.com/1/posts/z17",
                                    "actor": {
                                        "id": "1",
                                        "displayName": "Tom Sample",
                                        "url": "https://plus.google.com/1",
                                        "image": {
                                            "url": "image_url1"
                                        }
                                    },
                                    "verb": "post",
                                    "object": {
                                        "objectType": "note",
                                        "content": "CONTENT",
                                        "replies": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/comments"
                                        },
                                        "plusoners": {
                                            "totalItems": 2,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/people/plusoners"
                                        },
                                        "resharers": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/people/resharers"
                                        },
                                        "attachments": [
                                            {
                                                "objectType": "photo",
                                                "id": "1001",
                                                "content": "image.jpg",
                                                "url": "https://plus.google.com/photos/1/albums/613/613",
                                                "image": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg"
                                                },
                                                "fullImage": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg",
                                                    "height": 400,
                                                    "width": 888
                                                }
   }
  ]
                                    },
                                    "provider": {
                                        "title": "Google+"
                                    },
                                    "access": {
                                        "kind": "plus#acl",
                                        "description": "Public",
                                        "items": [
                                            {
                                                "type": "public"
   }
  ]
                                    }
                        }
   ]
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('nextPageToken')
                        msg.payload.should.have.property('results');
                        msg.payload.results.length.should.be.above(1);
                        msg.payload.results[0].should.have.property('id', 'z13');
                        msg.payload.results[0].should.have.property('actor', {
                            displayName: 'Tom Sample',
                            id: '1'
                        });
                        msg.payload.results[0].should.have.property('object');
                        msg.payload.results[0].object.should.have.property('content', 'CONTENT');
                        msg.payload.results[0].should.have.property('published');
                        msg.payload.results[0].should.have.property('updated');
                        msg.payload.results[0].should.have.property('url', 'https://plus.google.com/1/posts/z13');
                        msg.payload.results[0].should.have.property('verb', 'post');
                        msg.payload.results[1].should.have.property('id', 'z17');
                        msg.payload.results[1].should.have.property('actor', {
                            displayName: 'Tom Sample',
                            id: '1'
                        });
                        msg.payload.results[1].should.have.property('object');
                        msg.payload.results[1].object.should.have.property('content', 'CONTENT');
                        msg.payload.results[1].should.have.property('published');
                        msg.payload.results[1].should.have.property('updated');
                        msg.payload.results[1].should.have.property('url', 'https://plus.google.com/1/posts/z17');
                        msg.payload.results[1].should.have.property('verb', 'post');
                        done();
                    });
                    input.send({
                        query: 'trip'
                    });
                });
            });

        });

        describe('list', function () {

            it("should return activities list request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "activities",
                        action: "list",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/people/1/activities/public')
                        .reply(200, {
                            "kind": "plus#activityFeed",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/dDeP60t5qD1TFNZIY4snrWBgtr8\"",
                            "nextPageToken": "npt",
                            "title": "Google+ List of Activities for Collection PUBLIC",
                            "updated": "2015-03-25T21:58:38.758Z",
                            "items": [
                                {
                                    "kind": "plus#activity",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/4bzU4LC6Wod5uwxN2Je3f6R6wfs\"",
                                    "title": "My trip to France",
                                    "published": "2015-03-25T22:27:21.802Z",
                                    "updated": "2015-03-25T22:27:21.802Z",
                                    "id": "z13",
                                    "url": "https://plus.google.com/1/posts/z13",
                                    "actor": {
                                        "id": "1",
                                        "displayName": "Tom Sample",
                                        "url": "https://plus.google.com/1",
                                        "image": {
                                            "url": "image_url1"
                                        }
                                    },
                                    "verb": "post",
                                    "object": {
                                        "objectType": "note",
                                        "content": "CONTENT",
                                        "replies": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/comments"
                                        },
                                        "plusoners": {
                                            "totalItems": 2,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/plusoners"
                                        },
                                        "resharers": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z13/people/resharers"
                                        },
                                        "attachments": [
                                            {
                                                "objectType": "photo",
                                                "id": "1001",
                                                "content": "image.jpg",
                                                "url": "https://plus.google.com/photos/1/albums/613/613",
                                                "image": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg"
                                                },
                                                "fullImage": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg",
                                                    "height": 400,
                                                    "width": 888
                                                }
   }
  ]
                                    },
                                    "provider": {
                                        "title": "Google+"
                                    },
                                    "access": {
                                        "kind": "plus#acl",
                                        "description": "Public",
                                        "items": [
                                            {
                                                "type": "public"
   }
  ]
                                    }
                        },

                                {
                                    "kind": "plus#activity",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/4bzU4LC6Wod5uwxN2Je3f6R6wfs\"",
                                    "title": "My trip to Germany",
                                    "published": "2015-03-25T22:27:21.802Z",
                                    "updated": "2015-03-25T22:27:21.802Z",
                                    "id": "z17",
                                    "url": "https://plus.google.com/1/posts/z17",
                                    "actor": {
                                        "id": "1",
                                        "displayName": "Tom Sample",
                                        "url": "https://plus.google.com/1",
                                        "image": {
                                            "url": "image_url1"
                                        }
                                    },
                                    "verb": "post",
                                    "object": {
                                        "objectType": "note",
                                        "content": "CONTENT",
                                        "replies": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/comments"
                                        },
                                        "plusoners": {
                                            "totalItems": 2,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/people/plusoners"
                                        },
                                        "resharers": {
                                            "totalItems": 0,
                                            "selfLink": "https://content.googleapis.com/plus/v1/activities/z17/people/resharers"
                                        },
                                        "attachments": [
                                            {
                                                "objectType": "photo",
                                                "id": "1001",
                                                "content": "image.jpg",
                                                "url": "https://plus.google.com/photos/1/albums/613/613",
                                                "image": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg"
                                                },
                                                "fullImage": {
                                                    "url": "image_urlA",
                                                    "type": "image/jpeg",
                                                    "height": 400,
                                                    "width": 888
                                                }
   }
  ]
                                    },
                                    "provider": {
                                        "title": "Google+"
                                    },
                                    "access": {
                                        "kind": "plus#acl",
                                        "description": "Public",
                                        "items": [
                                            {
                                                "type": "public"
   }
  ]
                                    }
                        }
 ]
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('nextPageToken')
                        msg.payload.should.have.property('results');
                        msg.payload.results.length.should.be.above(1);
                        msg.payload.results[0].should.have.property('id', 'z13');
                        msg.payload.results[0].should.have.property('actor', {
                            displayName: 'Tom Sample',
                            id: '1'
                        });
                        msg.payload.results[0].should.have.property('object');
                        msg.payload.results[0].object.should.have.property('content', 'CONTENT');
                        msg.payload.results[0].should.have.property('published');
                        msg.payload.results[0].should.have.property('updated');
                        msg.payload.results[0].should.have.property('url', 'https://plus.google.com/1/posts/z13');
                        msg.payload.results[0].should.have.property('verb', 'post');
                        msg.payload.results[1].should.have.property('id', 'z17');
                        msg.payload.results[1].should.have.property('actor', {
                            displayName: 'Tom Sample',
                            id: '1'
                        });
                        msg.payload.results[1].should.have.property('object');
                        msg.payload.results[1].object.should.have.property('content', 'CONTENT');
                        msg.payload.results[1].should.have.property('published');
                        msg.payload.results[1].should.have.property('updated');
                        msg.payload.results[1].should.have.property('url', 'https://plus.google.com/1/posts/z17');
                        msg.payload.results[1].should.have.property('verb', 'post');
                        done();
                    });
                    input.send({
                        userId: 1,
                        collection: 'public'
                    });
                });
            });

        });

    });

    describe('comments', function () {

        describe('get', function () {

            it("should return comments get request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "comments",
                        action: "get",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/comments/z12.11')
                        .reply(200, {
                            "kind": "plus#comment",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/M2WYy9x7yNjyJOy0dveOhszDuoU\"",
                            "verb": "post",
                            "id": "z12.11",
                            "published": "2015-03-26T16:14:04.235Z",
                            "updated": "2015-03-26T16:14:04.235Z",
                            "actor": {
                                "id": "1",
                                "displayName": "Tom Sample",
                                "url": "https://plus.google.com/1",
                                "image": {
                                    "url": "image_url1"
                                }
                            },
                            "object": {
                                "objectType": "comment",
                                "content": "Nice pictures!"
                            },
                            "selfLink": "https://content.googleapis.com/plus/v1/comments/z12#11",
                            "inReplyTo": [
                                {
                                    "id": "z12",
                                    "url": "https://plus.google.com/1/posts/z12"
  }
 ],
                            "plusoners": {
                                "totalItems": 0
                            }
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('verb', 'post');
                        msg.payload.should.have.property('id', 'z12.11');
                        msg.payload.should.have.property('actor', {
                            id: '1',
                            displayName: 'Tom Sample'
                        });
                        msg.payload.should.have.property('object');
                        msg.payload.object.should.have.property('objectType', 'comment');
                        msg.payload.object.should.have.property('content', 'Nice pictures!');
                        msg.payload.should.have.property('inReplyTo');
                        done();
                    });
                    input.send({
                        commentId: 'z12.11'
                    });
                });
            });

        });

        describe('list', function () {

            it("should return comments list request", function (done) {
                helper.load([googleNode, plusNode], [
                    {
                        id: "google",
                        type: "google-credentials",
                        displayName: "Tom",
                    },
                    {
                        id: "input",
                        type: "helper",
                        wires: [["plus"]]
     },
                    {
                        id: "plus",
                        type: "google plus",
                        google: "google",
                        reqType: "comments",
                        action: "list",
                        wires: [["output"]],
     }, {
                        id: "output",
                        type: "helper"
     }
    ], {
                    "google": {
                        clientId: "id",
                        clientSecret: "secret",
                        accessToken: "access",
                        refreshToken: "refresh",
                        expireTime: 1000 + (new Date().getTime() / 1000),
                        displayName: "Bob"
                    },
                }, function () {
                    nock('https://www.googleapis.com:443')
                        .get('/plus/v1/activities/z12/comments')
                        .reply(200, {
                            "kind": "plus#commentFeed",
                            "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/HLBykF43Ca7-Qe_qGdkI925WygU\"",
                            "nextPageToken": "CBQQ49uNv8Up",
                            "title": "Google+ List of Comments for an Activity",
                            "items": [
                                {
                                    "kind": "plus#comment",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/M2WYy9x7yNjyJOy0dveOhszDuoU\"",
                                    "verb": "post",
                                    "id": "z12.11",
                                    "published": "2015-03-26T16:14:04.235Z",
                                    "updated": "2015-03-26T16:14:04.235Z",
                                    "actor": {
                                        "id": "1",
                                        "displayName": "Tom Sample",
                                        "url": "https://plus.google.com/1",
                                        "image": {
                                            "url": "image_url1"
                                        }
                                    },
                                    "object": {
                                        "objectType": "comment",
                                        "content": "Nice pictures!"
                                    },
                                    "selfLink": "https://content.googleapis.com/plus/v1/comments/z12#11",
                                    "inReplyTo": [
                                        {
                                            "id": "z12",
                                            "url": "https://plus.google.com/1/posts/z12"
  }
 ],
                                    "plusoners": {
                                        "totalItems": 0
                                    }
                                },
                                {
                                    "kind": "plus#comment",
                                    "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/M2WYy9x7yNjyJOy0dveOhszDuoU\"",
                                    "verb": "post",
                                    "id": "z12.12",
                                    "published": "2015-03-26T18:14:04.235Z",
                                    "updated": "2015-03-26T18:14:04.235Z",
                                    "actor": {
                                        "id": "2",
                                        "displayName": "Tom Example",
                                        "url": "https://plus.google.com/2",
                                        "image": {
                                            "url": "image_url2"
                                        }
                                    },
                                    "object": {
                                        "objectType": "comment",
                                        "content": "Awesome trip!"
                                    },
                                    "selfLink": "https://content.googleapis.com/plus/v1/comments/z12#12",
                                    "inReplyTo": [
                                        {
                                            "id": "z12",
                                            "url": "https://plus.google.com/1/posts/z12"
  }
 ],
                                    "plusoners": {
                                        "totalItems": 0
                                    }
                                }
                            ]
                        }, {
                            'content-type': 'application/json; charset=UTF-8',
                            'transfer-encoding': 'chunked'
                        });
                    var input = helper.getNode("input");
                    input.should.have.property('id', 'input');
                    var plus = helper.getNode("plus");
                    plus.should.have.property('id', 'plus');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function (msg) {
                        msg.payload.should.have.property('status', 'OK');
                        msg.payload.should.have.property('nextPageToken');
                        msg.payload.should.have.property('results');
                        msg.payload.results.length.should.be.above(1);
                        msg.payload.results[0].should.have.property('id', 'z12.11');
                        msg.payload.results[0].should.have.property('actor', {
                            id: '1',
                            displayName: 'Tom Sample'
                        });
                        msg.payload.results[0].should.have.property('object');
                        msg.payload.results[0].object.should.have.property('objectType', 'comment');
                        msg.payload.results[0].object.should.have.property('content', 'Nice pictures!');
                        msg.payload.results[0].should.have.property('inReplyTo');
                        msg.payload.results[1].should.have.property('id', 'z12.12');
                        msg.payload.results[1].should.have.property('actor', {
                            id: '2',
                            displayName: 'Tom Example'
                        });
                        msg.payload.results[1].should.have.property('object');
                        msg.payload.results[1].object.should.have.property('objectType', 'comment');
                        msg.payload.results[1].object.should.have.property('content', 'Awesome trip!');
                        msg.payload.results[1].should.have.property('inReplyTo');
                        done();
                    });
                    input.send({
                        activityId: 'z12'
                    });
                });
            });

        });

    });

    it("should fail with no id presented", function (done) {
        helper.load([googleNode, plusNode], [
                {
                    id: "input",
                    type: "helper",
                    wires: [["plus"]]
     },
                {
                    id: "plus",
                    type: "google plus",
                    reqType: "people",
                    action: "get",
                    wires: [["output"]],
     }, {
                    id: "output",
                    type: "helper"
     }
    ],
            function () {
                nock('https://www.googleapis.com:443')
                    .get('/plus/v1/people/1')
                    .reply(200, {
                        "kind": "plus#person",
                        "etag": "\"RqKWnRU4WW46-6W3rWhLR9iFZQM/9Gj5LYGPevqG-vqLMe9CO57SDFA\"",
                        "gender": "male",
                        "emails": [
                            {
                                "value": "tom@example.com",
                                "type": "account"
  }
 ],
                        "objectType": "person",
                        "id": "1",
                        "displayName": "Tom Example",
                        "name": {
                            "familyName": "Example",
                            "givenName": "Tom"
                        },
                        "url": "https://plus.google.com/1",
                        "image": {
                            "url": "https://example.com/user.png",
                            "isDefault": false
                        },
                        "isPlusUser": true,
                        "language": "en",
                        "ageRange": {
                            "min": 21
                        },
                        "circledByCount": 0,
                        "verified": false
                    }, {
                        'content-type': 'application/json; charset=UTF-8',
                        'transfer-encoding': 'chunked'
                    });
                var input = helper.getNode("input");
                input.should.have.property('id', 'input');
                var plus = helper.getNode("plus");
                plus.should.have.property('id', 'plus');
                var output = helper.getNode("output");
                output.should.have.property('id', 'output');
                var stub = sinon.stub(plus, 'error', function (error) {
                    stub.restore();
                    stub = null;
                    error.message.should.containEql("Please provide an accessToken");
                    done();
                });
                input.send({
                    userId: 1
                });
            });
    });

});