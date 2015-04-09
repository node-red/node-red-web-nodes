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
var awsNode = require("../../aws/aws.js");
var helper = require('../helper.js');
var sinon = require('sinon');
var nock = helper.nock;

describe('aws nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });


    it('can be loaded without credentials', function(done) {
        helper.load(awsNode,
                    [{id:"n1", type:"aws-config"}], function() {
                        var n1 = helper.getNode("n1");
                        n1.should.have.property('id', 'n1');
                        (typeof n1.AWS).should.be.equal("undefined");
                        done();
                    });
    });

    it('can be loaded with credentials', function(done) {
        helper.load(awsNode,
                    [{id:"n1", type:"aws-config"}],
                    {
                        "n1": {
                            "accesskeyid": "key",
                            "secretaccesskey" : "secret"
                        }
                    }, function() {
                        var n1 = helper.getNode("n1");
                        n1.should.have.property('id', 'n1');
                        (typeof n1.AWS).should.not.be.equal("undefined");
                        done();
                    });
    });


    describe("watch node", function() {
        if (!nock) return;
        it('should report file add event', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF', 'x-amz-request-id': 'GHIJKL',
                    date: 'Tue, 28 Oct 2014 13:28:07 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' })
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>baz.txt</Key><LastModified>2014-10-28T13:28:24.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>testing123</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3 in", aws: "aws",
                          bucket: "foobar", wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                msg.should.have.property('payload', "baz.txt");
                                msg.should.have.property('file', "baz.txt");
                                msg.should.have.property('bucket', 'foobar');
                                msg.should.have.property('event', 'add');
                                done();
                            });

                            // wait for s3.on("input", ...) to be called
                            var onFunction = s3.on;
                            var onStub = sinon.stub(s3, 'on', function(event, cb) {
                                var res = onFunction.apply(s3, arguments);
                                onStub.restore();
                                s3.emit('input', {}); // trigger poll
                                return res;
                            });
                        });
        });

        it('should report file delete event', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>baz.txt</Key><LastModified>2014-10-28T13:28:24.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>testing123</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' })
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF', 'x-amz-request-id': 'GHIJKL',
                    date: 'Tue, 28 Oct 2014 13:28:07 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3 in", aws: "aws",
                          bucket: "foobar", wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                msg.should.have.property('payload', "baz.txt");
                                msg.should.have.property('file', "baz.txt");
                                msg.should.have.property('bucket', 'foobar');
                                msg.should.have.property('event', 'delete');
                                done();
                            });

                            // wait for s3.on("input", ...) to be called
                            var onFunction = s3.on;
                            var onStub = sinon.stub(s3, 'on', function(event, cb) {
                                var res = onFunction.apply(s3, arguments);
                                onStub.restore();
                                s3.emit('input', {}); // trigger poll
                                return res;
                            });
                        });
        });

        it('should report no event when there is no change', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>baz.txt</Key><LastModified>2014-10-28T13:28:24.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>testing123</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' })
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>baz.txt</Key><LastModified>2014-10-28T13:28:24.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>testing123</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3 in", aws: "aws",
                          bucket: "foobar", wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                should.fail(null,null,
                                            "unexpected message: "+JSON.stringify(msg));
                            });

                            // wait for s3.on("input", ...) to be called
                            var onFunction = s3.on;
                            var onStub = sinon.stub(s3, 'on', function(event, cb) {
                                var res = onFunction.apply(s3, arguments);
                                onStub.restore();
                                s3.emit('input', {}); // trigger poll

                                // wait to ensure no messages are generated
                                setTimeout(function () {
                                    done();
                                }, 1000);
                                return res;
                            });
                        });
        });

        it('should report event when filepattern matches', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>hindessm-nr</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>test/</Key><LastModified>2014-10-28T13:49:23.000Z</LastModified><ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag><Size>0</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' })
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>hindessm-nr</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>test/</Key><LastModified>2014-10-28T13:49:23.000Z</LastModified><ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag><Size>0</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents><Contents><Key>test/baz.txt</Key><LastModified>2014-10-28T13:49:54.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
         'x-amz-id-2': 'ABCDEF', 'x-amz-request-id': 'GHIJKL',
                    date: 'Tue, 28 Oct 2014 13:28:07 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3 in", aws: "aws",
                          bucket: "foobar", filepattern: '**/*.txt',
                          wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                msg.should.have.property('payload', "test/baz.txt");
                                msg.should.have.property('file', "baz.txt");
                                msg.should.have.property('bucket', 'foobar');
                                msg.should.have.property('event', 'add');
                                done();
                            });

                            // wait for s3.on("input", ...) to be called
                            var onFunction = s3.on;
                            var onStub = sinon.stub(s3, 'on', function(event, cb) {
                                var res = onFunction.apply(s3, arguments);
                                onStub.restore();
                                s3.emit('input', {}); // trigger poll
                                return res;
                            });
                        });
        });

        it('should report no event when filepattern does not match', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>hindessm-nr</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>test/</Key><LastModified>2014-10-28T13:49:23.000Z</LastModified><ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag><Size>0</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' })
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>hindessm-nr</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated><Contents><Key>test/</Key><LastModified>2014-10-28T13:49:23.000Z</LastModified><ETag>&quot;d41d8cd98f00b204e9800998ecf8427e&quot;</ETag><Size>0</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents><Contents><Key>test/baz.bak</Key><LastModified>2014-10-28T13:49:54.000Z</LastModified><ETag>&quot;6f5902ac237024bdd0c176cb93063dc4&quot;</ETag><Size>12</Size><Owner><ID>F00B00</ID><DisplayName>amazon12623</DisplayName></Owner><StorageClass>STANDARD</StorageClass></Contents></ListBucketResult>", {
                    'x-amz-id-2': 'ABCDEF2', 'x-amz-request-id': 'GHIJKL2',
                    date: 'Tue, 28 Oct 2014 13:28:38 GMT',
                    'content-type': 'application/xml',
                    'transfer-encoding': 'chunked',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3 in", aws: "aws",
                          bucket: "foobar", filepattern: '**/*.txt',
                          wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                should.fail(null,null,
                                            "unexpected message: "+JSON.stringify(msg));
                            });

                            // wait for s3.on("input", ...) to be called
                            var onFunction = s3.on;
                            var onStub = sinon.stub(s3, 'on', function(event, cb) {
                                var res = onFunction.apply(s3, arguments);
                                onStub.restore();
                                s3.emit('input', {}); // trigger poll

                                // wait to ensure no messages are generated
                                setTimeout(function () {
                                    done();
                                }, 1000);
                                return res;
                            });
                        });
        });
    });

    describe("query node", function() {
        if (!nock) return;
        it('should fetch file', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/foobar.txt')
                .reply(200, "hello\n", {
                    'x-amz-id-2': 'ABCDE',
                    'x-amz-request-id': 'FGHIJ',
                    date: 'Tue, 28 Oct 2014 10:36:36 GMT',
                    'last-modified': 'Tue, 28 Oct 2014 10:36:23 GMT',
                    etag: '"b1946ac92492d2347c6235b4d2611184"',
                    'accept-ranges': 'bytes',
                    'content-type': 'application/octet-stream',
                    'content-length': '6',
                    server: 'AmazonS3' });
            helper.load([awsNode],
                        [{id:"inject", type: "helper", wires: [["s3"]]},
                         {id:"aws", type: "aws-config"},
                         {id:"s3", type:"amazon s3", aws: "aws",
                          bucket: "foobar", wires: [["output"]] },
                         {id:"output", type: "helper" },
                        ], {
                            "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                        }, function() {
                            var s3 = helper.getNode("s3");
                            s3.should.have.property('id', 's3');
                            var inject = helper.getNode("inject");
                            inject.should.have.property('id', 'inject');
                            var output = helper.getNode("output");
                            output.should.have.property('id', 'output');
                            output.on("input", function(msg) {
                                msg.should.have.property('payload', new Buffer("hello\n"));
                                msg.should.have.property('bucket', 'foobar');
                                msg.should.have.property('filename', 'foobar.txt');
                                done();
                            });
                            inject.send({
                                filename: "foobar.txt",
                                bucket: "foobar",
                            });
                        });
        });
    });

    describe("output node", function() {
        if (!nock) return;
        it('should upload msg.payload', function(done) {
            nock('https://foobar.s3.amazonaws.com:443')
                .get('/')
                .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<ListBucketResult xmlns=\"http://s3.amazonaws.com/doc/2006-03-01/\"><Name>foobar</Name><Prefix></Prefix><Marker></Marker><MaxKeys>1000</MaxKeys><IsTruncated>false</IsTruncated></ListBucketResult>",
                       { 'x-amz-id-2': 'ABCD1', 'x-amz-request-id': 'EFGH1',
                         date: 'Fri, 24 Oct 2014 20:08:47 GMT',
                         'content-type': 'application/xml',
                         'transfer-encoding': 'chunked',
                         server: 'AmazonS3' })
                .put('/test.txt', "foobar")
                .reply(200, "",
                       { 'x-amz-id-2': 'ABCD2', 'x-amz-request-id': 'EFGH2',
                         date: 'Fri, 24 Oct 2014 20:08:55 GMT',
                         etag: '"3858f62230ac3c915f300c664312c63f"',
                         'content-length': '0',
                         server: 'AmazonS3' });
            helper.load([awsNode],
                [{id:"inject", type: "helper", wires: [["s3"]]},
                 {id:"aws", type: "aws-config"},
                 {id:"s3", type:"amazon s3 out", aws: "aws", bucket: "foobar" }
                ], {
                     "aws": { "accesskeyid":"feed","secretaccesskey":"f00d"},
                 }, function() {
                     var s3 = helper.getNode("s3");
                     s3.should.have.property('id', 's3');
                     var inject = helper.getNode("inject");
                     inject.should.have.property('id', 'inject');

                     // wait for s3.on("input", ...) to be called
                     var onFunction = s3.on;
                     var onStub = sinon.stub(s3, 'on', function(event, cb) {
                         var res = onFunction.apply(s3, arguments);
                         onStub.restore();
                         // stub status call to wait for successful upload
                         var stub = sinon.stub(s3, 'status', function(status) {
                             if (Object.getOwnPropertyNames(status).length === 0) {
                                 stub.restore();
                                 done();
                             }
                             return;
                         });
                         inject.send({
                             filename: "test.txt",
                             payload: "foobar",
                         });
                         return res;
                     });
                 });
        });
    });
});
