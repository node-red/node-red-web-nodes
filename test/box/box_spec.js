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
var sinon = require("sinon");
var url = require('url');
var boxNode = require("../../box/box.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('box nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe("box credentials", function() {
        if (!nock) {
        	return;
        }
        it("should complete oauth dance", function(done) {
            helper.load(boxNode, [
                {id:"input", type:"helper", wires:[["input"]]},
                {id:"box-config", type:"box-credentials"},
                {id:"box", type:"box out", box: "box-config",
                    wires:[["output"]]},
                {id:"output", type:"helper"}], function() {
                var scope = nock('https://app.box.com:443')
                    .post('/api/oauth2/token',
                        "grant_type=authorization_code&code=CODE&client_id=CLIENT&client_secret=SECRET&redirect_uri=http%3A%2F%2Flocalhost%3A1880%2Fbox-credentials%2Fauth%2Fcallback")
                    .reply(200, {
                        "access_token":"ACCESS",
                        "expires_in":3761,"restricted_to":[],
                        "refresh_token":"REFRESH",
                        "token_type":"bearer"
                    }, {
                        date: 'Thu, 30 Oct 2014 10:37:29 GMT',
                        'content-type': 'application/json',
                        'transfer-encoding': 'chunked'
                    });
                nock('https://api.box.com:443')
                    .get('/2.0/users/me')
                    .reply(200, {
                        "type":"user",
                        "id":"123456","name":"Foo Bar",
                        "login":"foobar@example.com",
                        "language":"en","timezone":"America/Los_Angeles",
                        "space_amount":1024,"space_used":512,
                        "max_upload_size":256,"status":"active"
                    }, {
                        date: 'Thu, 30 Oct 2014 10:37:30 GMT',
                        'content-type': 'application/json'
                    });
                helper.request()
                    .get('/box-credentials/auth?id=box-config&clientId=CLIENT&clientSecret=SECRET&callback=http://localhost:1880/box-credentials/auth/callback')
                    .expect(302)
                    .expect('Location', /https:\/\/app\.box\.com\/api\/oauth2\/authorize\?response_type=code&client_id=CLIENT&state=([^&]*)&redirect_uri=http%3A%2F%2Flocalhost%3A1880%2Fbox-credentials%2Fauth%2Fcallback/)
                    .end(function(err, res) {
                        if (err) {
                        	return done(err);
                        }
                        var location = url.parse(res.headers.location, true);
                        var state = location.query.state;
                        helper.request()
                            .get('/box-credentials/auth/callback?code=CODE&state='+state)
                            .expect(200)
                            .end(function(err, res) {
                                if (err) {
                                	return done(err);
                                }
                                helper.credentials.get("box-config")
                                    .should.have.property('displayName','Foo Bar');
                                done();
                            });
                    });
            });
        });
    });

    describe("watch node", function() {
        if (!nock) {
        	return;
        }
        it('should report file add event', function(done) {
            nock('https://api.box.com:443')
                .get('/2.0/events?stream_position=now&stream_type=changes')
                .reply(200, {
                    "chunk_size":0,"next_stream_position":1000,
                    "entries":[]
                }, { 'content-type': 'application/json' })
                .get('/2.0/events?stream_position=1000&stream_type=changes')
                .reply(200, {"entries":[{
                    "type":"event","event_id":"1234",
                    "event_type":"ITEM_UPLOAD",
                    "session_id":"1234567",
                    "source":{
                        "type":"file","id":"7","name":"foobar.txt",
                        "path_collection":{"total_count":2,"entries":[
                            {"type":"folder","id":"0","name":"All Files"},
                            {"type":"folder","id":"2","name":"node-red"}
                        ]},
                        "parent":{"type":"folder","id":"2","name":"node-red"},
                    }}],"chunk_size":1,"next_stream_position":2000}, {
                        'content-type': 'application/json',
                    });
            helper.load(boxNode,
                [{id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box in",
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    },
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            "node-red/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'add');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = box.on;
                    var onStub = sinon.stub(box, 'on', function(event, cb) {
                        var res = onFunction.apply(box, arguments);
                        onStub.restore();
                        box.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });

        it('should report file delete event', function(done) {
            nock('https://api.box.com:443')
                .get('/2.0/events?stream_position=now&stream_type=changes')
                .reply(200, {
                    "chunk_size":0,"next_stream_position":1000,
                    "entries":[]
                }, { 'content-type': 'application/json' })
                .get('/2.0/events?stream_position=1000&stream_type=changes')
                .reply(200, {"entries":[{
                    "type":"event","event_id":"1234",
                    "event_type":"ITEM_TRASH",
                    "session_id":"1234567",
                    "source":{
                        "type":"file","id":"7","name":"foobar.txt",
                        "path_collection":{"total_count":1,"entries":[
                            {"type":"folder","id":"1","name":"Trash"}
                        ]},
                        "parent":{"type":"folder","id":"2","name":"node-red"}
                    }}],"chunk_size":1,"next_stream_position":2000}, {
                        'content-type': 'application/json'
                    })
                .get('/2.0/folders/2')
                .reply(200, {
                    "type":"folder", "id":"2", "name":"node-red",
                    "path_collection":{"total_count":1,"entries":[
                        {"type":"folder","id":"0","name":"All Files"}
                    ]},
                    "item_collection":{
                        "total_count":1,"entries":[
                            {"type":"file", "id":"4", "name":"notbar.txt"},
                        ],"offset":0,"limit":100,"order":[
                            {"by":"type","direction":"ASC"},
                            {"by":"name","direction":"ASC"}
                        ]
                    }
                }, {
                    date: 'Thu, 30 Oct 2014 10:39:16 GMT',
                    'content-type': 'application/json',
                });
            helper.load(boxNode,
                [{id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box in",
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    },
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            "node-red/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'delete');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = box.on;
                    var onStub = sinon.stub(box, 'on', function(event, cb) {
                        var res = onFunction.apply(box, arguments);
                        onStub.restore();
                        box.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });
        
        // TODO: finish below tests

        it.skip('should report no event when filepattern does not match', function(done) {
            nock('https://api.box.com:443')
                .post('/1/delta')
                .reply(200, {
                    "has_more":false,
                    "cursor":"AAAA",
                    "entries":[],
                    "reset":true,
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:33:58 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                })
                .post('/1/delta', "cursor=AAAA")
                .reply(200, {
                    "has_more":false,
                    "cursor":"BBBB",
                    "entries":[["/foobar.bak",{"rev":"3c29981324","thumb_exists":false,"path":"/foobar.txt","is_dir":false,"client_mtime":"Wed Oct 29 05:34:20 GMT 2014","icon":"page_white_text","bytes":12,"modified":"Wed Oct 29 05:34:20 GMT 2014","size":"12 bytes","root":"app_folder","mime_type":"text/plain","revision":1}]],
                    "reset":false
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:34:28 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                });
            helper.load(boxNode,
                [{id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box in", filepattern: '**/*.txt',
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    },
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                                should.fail(null,null,
                                    "unexpected message: "+JSON.stringify(msg));
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = box.on;
                    var onStub = sinon.stub(box, 'on', function(event, cb) {
                        var res = onFunction.apply(box, arguments);
                        onStub.restore();
                        box.emit('input', {}); // trigger poll
                        // wait to ensure no messages are generated
                        setTimeout(function () {
                            done();
                        }, 500);
                        return res;
                    });
                });
        });

        it.skip('should report event when filepattern matches', function(done) {
            nock('https://api.box.com:443')
                .post('/1/delta')
                .reply(200, {
                    "has_more":false,
                    "cursor":"AAAA",
                    "entries":[],
                    "reset":true,
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:33:58 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                })
                .post('/1/delta', "cursor=AAAA")
                .reply(200, {
                    "has_more":false,
                    "cursor":"BBBB",
                    "entries":[["/foobar.txt",null]],
                    "reset":false
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:34:28 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                });
            helper.load(boxNode,
                [{id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box in", filepattern: '**/*.txt',
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    },
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload', "/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'delete');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = box.on;
                    var onStub = sinon.stub(box, 'on', function(event, cb) {
                        var res = onFunction.apply(box, arguments);
                        onStub.restore();
                        box.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });

        it.skip('should report file delete event', function(done) {
            nock('https://api.box.com:443')
                .post('/1/delta')
                .reply(200, {
                    "has_more":false,
                    "cursor":"AAAA",
                    "entries":[["/foobar.bak",null]],
                    "reset":true,
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:33:58 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                })
                .post('/1/delta', "cursor=AAAA")
                .reply(200, {
                    "has_more":false,
                    "cursor":"BBBB",
                    "entries":[],
                    "reset":false
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:34:28 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                });
            helper.load(boxNode,
                [{id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box in",
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    },
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                                should.fail(null,null,
                                    "unexpected message: "+JSON.stringify(msg));
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = box.on;
                    var onStub = sinon.stub(box, 'on', function(event, cb) {
                        var res = onFunction.apply(box, arguments);
                        onStub.restore();
                        box.emit('input', {}); // trigger poll
                        // wait to ensure no messages are generated
                        setTimeout(function () {
                            done();
                        }, 500);
                        return res;
                    });
                });
        });
    });

    describe("query node", function() {
        if (!nock) {
        	return;
        }
        it('should fetch file', function(done) {
            nock('https://api.box.com:443')
                .get('/2.0/folders/0')
                .reply(200, {
                    "type":"folder", "id":"0", "name":"All Files",
                    "path_collection":{"total_count":0,"entries":[]},
                    "item_collection":{
                        "total_count":2,"entries":[
                            {"type":"folder", "id":"1", "name":"not-red"},
                            {"type":"folder", "id":"2", "name":"node-red"},
                        ],"offset":0,"limit":100,"order":[
                            {"by":"type","direction":"ASC"},
                            {"by":"name","direction":"ASC"}
                        ]
                    }
                }, {
                    date: 'Thu, 30 Oct 2014 10:39:16 GMT',
                    'content-type': 'application/json',
                })
                .get('/2.0/folders/2')
                .reply(200, {
                    "type":"folder", "id":"0", "name":"node-red",
                    "path_collection":{"total_count":0,"entries":[]},
                    "item_collection":{
                        "total_count":2,"entries":[
                            {"type":"file", "id":"4", "name":"notbar.txt"},
                            {"type":"file", "id":"5", "name":"foobar.txt"},
                        ],"offset":0,"limit":100,"order":[
                            {"by":"type","direction":"ASC"},
                            {"by":"name","direction":"ASC"}
                        ]
                    }
                }, {
                    date: 'Thu, 30 Oct 2014 10:39:16 GMT',
                    'content-type': 'application/json',
                })
                .get('/2.0/files/5/content')
                .reply(302, "", {
                    date: 'Thu, 30 Oct 2014 10:42:29 GMT',
                    'content-length': '0',
                    location: 'https://dl.boxcloud.com/your-file-is-here/'
                  });
              nock('https://dl.boxcloud.com:443')
                .get('/your-file-is-here/')
                .reply(200, "hello world", {
                    date: 'Thu, 30 Oct 2014 10:42:29 GMT',
                    'content-type': 'text/plain; charset=UTF-8',
                    'content-length': '11',
                });
            helper.load(boxNode,
                [{id:"inject", type: "helper", wires: [["box"]]},
                 {id:"box-config", type: "box-credentials"},
                 {id:"box", type:"box",
                  box: "box-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "box-config": {
                        clientId: "ID",
                        clientSecret: "SECRET",
                        accessToken: "ACCESS",
                        refreshToken: "REFRESH",
                        expireTime: 1000+(new Date().getTime()/1000)
                    }
                }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var inject = helper.getNode("inject");
                    inject.should.have.property('id', 'inject');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload',
                            new Buffer("hello world"));
                        msg.should.have.property('filename',
                            'node-red/foobar.txt');
                        done();
                    });
                    inject.send({
                        filename: "node-red/foobar.txt"
                    });
                });
        });
    });

    describe('out node', function() {
        if (!nock) {
        	return;
        }
        it('should upload msg.payload', function(done) {
            nock('https://api.box.com:443')
                .post('/oauth2/token',
                    "grant_type=refresh_token&client_id=ID&client_secret=SECRET&refresh_token=REFRESH")
                .reply(200, {
                    "access_token":"ACCESS",
                    "expires_in":3761,"restricted_to":[],
                    "refresh_token":"REFRESH",
                    "token_type":"bearer"
                }, {
                    date: 'Thu, 30 Oct 2014 10:37:29 GMT',
                    'content-type': 'application/json',
                    'transfer-encoding': 'chunked'
                })
                .get('/2.0/folders/0')
                .reply(200, {
                    "type":"folder", "id":"0", "name":"All Files",
                    "path_collection":{"total_count":0,"entries":[]},
                    "item_collection":{
                        "total_count":2,"entries":[
                            {"type":"folder", "id":"1", "name":"not-red"},
                            {"type":"folder", "id":"2", "name":"node-red"},
                        ],"offset":0,"limit":100,"order":[
                            {"by":"type","direction":"ASC"},
                            {"by":"name","direction":"ASC"}
                        ]
                    }
                }, {
                    date: 'Thu, 30 Oct 2014 10:39:16 GMT',
                    'content-type': 'application/json',
                });
            nock('https://upload.box.com:443')
                .filteringRequestBody( // filter variable mime boundary strings
                    /----------------------------[a-z0-9]*/g,
                    '----------------------------blah')
                .post('/api/2.0/files/content',
                    "----------------------------blah\r\nContent-Disposition: form-data; name=\"filename\"; filename=\"foobar.txt\"\r\nContent-Type: text/plain\r\n\r\nhello world\r\n----------------------------blah\r\nContent-Disposition: form-data; name=\"parent_id\"\r\n\r\n2\r\n----------------------------blah--")
                .reply(201, {
                    "total_count":1,"entries":[{
                        "type":"file","id":"3","name":"foobar.txt",
                        "size":11,"path_collection":{
                            "total_count":2,
                            "entries":[
                                {"type":"folder","id":"0","name":"All Files"},
                                {"type":"folder","id":"2","name":"node-red"}
                            ]
                        }
                    }]}, {
                        date: 'Thu, 30 Oct 2014 10:41:10 GMT',
                        'content-type': 'application/json',
                    });
            helper.load(boxNode,
                [
                    {id:"inject", type:"helper", wires:[["box"]]},
                    {id:"box-config", type: "box-credentials"},
                    {id:"box", type:"box out", box: "box-config" },
                ],
                { "box-config": {
                    "clientId":"ID",
                    "clientSecret":"SECRET",
                    "accessToken":"ACCESS",
                    "refreshToken": "REFRESH"
                } }, function() {
                    var box = helper.getNode("box");
                    box.should.have.property('id', 'box');
                    var inject = helper.getNode("inject");
                    inject.should.have.property('id', 'inject');

                    // stub status call to wait for successful upload
                    var stub = sinon.stub(box, 'status', function(status) {
                        if (Object.getOwnPropertyNames(status).length === 0) {
                            stub.restore();
                            done();
                        }
                        return;
                    });
                    inject.send({
                        filename: 'node-red/foobar.txt',
                        payload:  "hello world"
                    });
                });
        });
    });
});
