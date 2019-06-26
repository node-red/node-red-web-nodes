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
var pinboardNode = require("../../pinboard/pinboard.js");
var helper = require("node-red-node-test-helper");
var nock = require("nock");

describe('pinboard nodes', function() {

    beforeEach(function (done) { helper.startServer(done); });

    afterEach(function(done) {
        if (nock) { nock.cleanAll(); }
        helper.unload();
        helper.stopServer(done);
    });

    describe('out node', function() {
        it(' logs a warning if msg.payload is not set', function(done) {
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        password:"abcd1234"
                    },
                  },
                  function() {
                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.error.restore();
                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          var expected = 'pinboard.error.no-url';
                          should.deepEqual(msg, expected);
                          stub.restore();
                          done();
                      });

                      inject.send({title:"test",description:"testdesc"});
                  });
        });

        it(' logs a warning if msg.title is not set', function(done) {
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        password:"abcd1234"
                    },
                  },
                  function() {
                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.error.restore();
                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          var expected = 'pinboard.error.no-title';
                          should.deepEqual(msg, expected);
                          stub.restore();
                          done();
                      });

                      inject.send({payload:"foobar",description:"testdesc"});
                  });
        });

        it(' logs a warning if server status is not ok', function(done) {
            if (!nock) { return; }
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        token:"bob:abcd1234"
                    },
                  },
                  function() {

                      var scope = nock('https://api.pinboard.in:443')
                          .get('/v1/posts/add?url=http%3A%2F%2Fexample.com%2F&description=test%20link&auth_token=bob:abcd1234&format=json&shared=no&toread=no&tags=testtag')
                          .reply(401)

                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.error.restore();
                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          var expected = 'Server Error, Status 401';
                          should.deepEqual(msg, expected);
                          stub.restore();
                          done();
                      });

                      inject.send({payload:"http://example.com/",title:"test link"});

                  });
        });

        it(' logs a warning if server returns broken JSON', function(done) {
            if (!nock) { return; }
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        token:"bob:abcd1234"
                    },
                  },
                  function() {

                      var scope = nock('https://api.pinboard.in:443')
                          .get('/v1/posts/add?url=http%3A%2F%2Fexample.com%2F&description=test%20link&auth_token=bob:abcd1234&format=json&shared=no&toread=no&tags=testtag')
                          .reply(200, "}This is not Json{")

                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.error.restore();
                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          msg.should.containEql('Unexpected token }');
                          stub.restore();
                          done();
                      });

                      inject.send({payload:"http://example.com/",title:"test link"});

                  });
        });

        it(' logs a warning if server returns an error code', function(done) {
            if (!nock) { return; }
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        token:"bob:abcd1234"
                    },
                  },
                  function() {

                      var scope = nock('https://api.pinboard.in:443')
                          .get('/v1/posts/add?url=http%3A%2F%2Fexample.com%2F&description=test%20link&auth_token=bob:abcd1234&format=json&shared=no&toread=no&tags=testtag')
                          .reply(200, {result_code: 'internal error (testing)'})

                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.error.restore();
                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          var expected = 'internal error (testing)';
                          should.deepEqual(msg, expected);
                          stub.restore();
                          done();
                      });

                      inject.send({payload:"http://example.com/",title:"test link"});

                  });
        });

        it(' changes the status on successful request', function(done) {
            if (!nock) { return; }
            helper.load(pinboardNode,
                [ {id:"inject", type:"helper", wires:[["pinboard"]]},
                  {id:"del-user", type:"pinboard-user", username:"Bob Jones"},
                  {id:"pinboard", type:"pinboard out", user:"del-user", private:true, tags:"testtag"}],
                  {
                    "del-user": {
                        token:"bob:abcd1234"
                    },
                  },
                  function() {

                      var scope = nock('https://api.pinboard.in:443')
                          .get('/v1/posts/add?url=http%3A%2F%2Fexample.com%2F&description=test%20link&auth_token=bob:abcd1234&format=json&shared=no&toread=no&tags=testtag')
                          .reply(200, {result_code: 'done'})

                      var inject = helper.getNode("inject");
                      var pinboard = helper.getNode("pinboard");
                      pinboard.should.have.property('id','pinboard');
                      pinboard.status.restore();
                      var stub = sinon.stub(pinboard, 'status').callsFake(function(status){
                          switch (stub.callCount) {
                              case 1:
                                  should.deepEqual(status, {fill:"blue",shape:"dot",text:"pinboard.status.saving"});
                                  break;
                              case 2:
                                  should.deepEqual(status, {});
                                  stub.restore();
                                  done();
                          }
                      });

                      inject.send({payload:"http://example.com/",title:"test link"});

                  });
        });

    });
});
