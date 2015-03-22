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
var dropboxNode = require("../../dropbox/dropbox.js");
var helper = require('../helper.js');
var nock = helper.nock;

// Force dropbox api server name to be api.dropbox.com
var Dropbox = require('dropbox');
Dropbox.Client.prototype._defaultMaxApiServer = function() {
    return 0;
};

describe('dropbox nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe("watch node", function() {
        if (!nock) {
        	return;
        }
        it('should report file add event', function(done) {
            nock('https://api.dropbox.com:443')
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
                    "entries":[["/foobar.txt",{"rev":"3c29981324","thumb_exists":false,"path":"/foobar.txt","is_dir":false,"client_mtime":"Wed Oct 29 05:34:20 GMT 2014","icon":"page_white_text","bytes":12,"modified":"Wed Oct 29 05:34:20 GMT 2014","size":"12 bytes","root":"app_folder","mime_type":"text/plain","revision":1}]],
                    "reset":false
                }, {
                    server: 'nginx',
                    date: 'Wed Oct 29 05:34:28 GMT 2014',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                });
            helper.load(dropboxNode,
                [{id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox in",
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload', "/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'add');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = dropbox.on;
                    var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                        var res = onFunction.apply(dropbox, arguments);
                        onStub.restore();
                        dropbox.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });

        it('should report file delete event', function(done) {
            nock('https://api.dropbox.com:443')
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
            helper.load(dropboxNode,
                [{id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox in",
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload', "/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'delete');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = dropbox.on;
                    var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                        var res = onFunction.apply(dropbox, arguments);
                        onStub.restore();
                        dropbox.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });

        it('should report no event when filepattern does not match', function(done) {
            nock('https://api.dropbox.com:443')
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
            helper.load(dropboxNode,
                [{id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox in", filepattern: '**/*.txt',
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                                should.fail(null,null,
                                    "unexpected message: "+JSON.stringify(msg));
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = dropbox.on;
                    var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                        var res = onFunction.apply(dropbox, arguments);
                        onStub.restore();
                        dropbox.emit('input', {}); // trigger poll
                        // wait to ensure no messages are generated
                        setTimeout(function () {
                            done();
                        }, 500);
                        return res;
                    });
                });
        });

        it('should report event when filepattern matches', function(done) {
            nock('https://api.dropbox.com:443')
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
            helper.load(dropboxNode,
                [{id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox in", filepattern: '**/*.txt',
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload', "/foobar.txt");
                        msg.should.have.property('file', "foobar.txt");
                        msg.should.have.property('event', 'delete');
                        done();
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = dropbox.on;
                    var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                        var res = onFunction.apply(dropbox, arguments);
                        onStub.restore();
                        dropbox.emit('input', {}); // trigger poll
                        return res;
                    });
                });
        });

        it('should report file delete event', function(done) {
            nock('https://api.dropbox.com:443')
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
            helper.load(dropboxNode,
                [{id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox in",
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                                should.fail(null,null,
                                    "unexpected message: "+JSON.stringify(msg));
                    });

                    // wait for s3.on("input", ...) to be called
                    var onFunction = dropbox.on;
                    var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                        var res = onFunction.apply(dropbox, arguments);
                        onStub.restore();
                        dropbox.emit('input', {}); // trigger poll
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
            nock('https://api-content.dropbox.com:443')
                .get('/1/files/auto/foo.txt')
                .reply(200, "ABCD\n", {
                    date: 'Tue, 28 Oct 2014 22:29:04 GMT',
                    'content-type': 'text/plain; charset=utf-8',
                    'content-length': '5',
                    connection: 'keep-alive',
                });
            helper.load(dropboxNode,
                [{id:"inject", type: "helper", wires: [["dropbox"]]},
                 {id:"dropbox-config", type: "dropbox-config"},
                 {id:"dropbox", type:"dropbox",
                  dropbox: "dropbox-config", wires: [["output"]] },
                 {id:"output", type: "helper" },
                ], {
                    "dropbox-config": {
                        "appkey":"FADE",
                        "appsecret":"DEAD",
                        "accesstoken":"BEEF"
                    },
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var inject = helper.getNode("inject");
                    inject.should.have.property('id', 'inject');
                    var output = helper.getNode("output");
                    output.should.have.property('id', 'output');
                    output.on("input", function(msg) {
                        msg.should.have.property('payload', "ABCD\n");
                        msg.should.have.property('filename', 'foo.txt');
                        done();
                    });
                    inject.send({
                        filename: "foo.txt",
                    });
                });
        });
    });

    describe('out node', function() {
        if (!nock) {
        	return;
        }
        it('should upload msg.payload', function(done) {
            nock('https://api.dropbox.com:443')
                .get('/1/account/info')
                .reply(200, {"referral_link":"https://example.com/foo","display_name":"Fred Bar","uid":5,"email_verified":true,"team":null,"quota_info":{"datastores":0,"shared":0,"quota":1024,"normal":512},"country":"GB","email":"junk@example.com"}, {
                    date: 'Tue, 28 Oct 2014 21:53:52 GMT',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                  });
            nock('https://api-content.dropbox.com:443')
                .post('/1/files_put/auto/foo.txt', "ABCD\n")
                .reply(200, {"revision":1,"bytes":5,"thumb_exists":false,"rev":"4","modified":"Wed, 15 Oct 2014 13:14:10 +0000","mime_type":"text/plain","path":"/foo.txt","is_dir":false,"size":"5 bytes","root":"app_folder","client_mtime":"Wed, 15 Oct 2014 13:14:10 +0000","icon":"page_white_text"}, {
                    date: 'Tue, 28 Oct 2014 21:55:39 GMT',
                    'content-type': 'text/javascript',
                    'transfer-encoding': 'chunked',
                    connection: 'keep-alive',
                });
            helper.load(dropboxNode,
                [
                    {id:"inject", type:"helper", wires:[["dropbox"]]},
                    {id:"dropbox-config", type: "dropbox-config"},
                    {id:"dropbox", type:"dropbox out",
                     dropbox: "dropbox-config" },
                ],
                { "dropbox-config":
                    {"appkey":"FADE","appsecret":"DEAD","accesstoken":"BEEF"}
                }, function() {
                    var dropbox = helper.getNode("dropbox");
                    dropbox.should.have.property('id', 'dropbox');
                    var inject = helper.getNode("inject");
                    inject.should.have.property('id', 'inject');

                     // wait for dropbox.on("input", ...) to be called
                     var onFunction = dropbox.on;
                     var onStub = sinon.stub(dropbox, 'on', function(event, cb) {
                         var res = onFunction.apply(dropbox, arguments);
                         onStub.restore();
                         // stub status call to wait for successful upload
                         var stub = sinon.stub(dropbox, 'status', function(status) {
                             if (Object.getOwnPropertyNames(status).length === 0) {
                                 stub.restore();
                                 done();
                             }
                             return;
                         });
                         inject.send({
                             filename: 'foo.txt',
                             payload:  "ABCD\n",
                         });
                         return res;
                     });

            });
        });
    });
});
