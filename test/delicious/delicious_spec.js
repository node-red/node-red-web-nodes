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
var deliciousNode = require("../../delicious/delicious.js");
var helper = require('../helper.js');
var nock = helper.nock;

describe('delicious nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        if(nock) {
            nock.cleanAll();
        }
        helper.unload();
    });

    describe('out node', function() {
        
        it(' logs a warning if msg.payload is not set', function(done) {
            helper.load(deliciousNode, 
                [ {id:"inject", type:"helper", wires:[["delicious"]]},
                  {id:"del-user", type:"delicious-user", username:"Bob Jones"},
                  {id:"delicious", type:"delicious out", user:"del-user", private:true, tags:"testtag"}], 
                  {
                    "del-user": {
                        password:"abcd1234"
                    },
                  },
                  function() {
                      var inject = helper.getNode("inject");
                      var delicious = helper.getNode("delicious");
                      delicious.should.have.property('id','delicious');
                      delicious.on('log',function(obj) {
                          should.deepEqual({level:"warn", id:delicious.id,
                                            type:delicious.type, msg:"url must be provided in msg.payload"}, obj);
                          done();
                      });
                      inject.send({title:"test",description:"testdesc"});
                  });
    })
        
        it(' logs a warning if msg.title is not set', function(done) {
            helper.load(deliciousNode, 
                [ {id:"inject", type:"helper", wires:[["delicious"]]},
                  {id:"del-user", type:"delicious-user", username:"Bob Jones"},
                  {id:"delicious", type:"delicious out", user:"del-user", private:true, tags:"testtag"}], 
                  {
                    "del-user": {
                        password:"abcd1234"
                    },
                  },
                  function() {
                      var inject = helper.getNode("inject");
                      var delicious = helper.getNode("delicious");
                      delicious.should.have.property('id','delicious');
                      delicious.on('log',function(obj) {
                          should.deepEqual({level:"warn", id:delicious.id,
                                            type:delicious.type, msg:"msg.title must be provided"}, obj);
                          done();
                      });
                      inject.send({payload:"foobar",description:"testdesc"});
                  });
    })
        
        if (nock) {
            
            it(' can save link', function(done) {
                    helper.load(deliciousNode, 
                        [ {id:"inject", type:"helper", wires:[["delicious"]]},
                          {id:"del-user", type:"delicious-user", username:"Bob Jones"},
                          {id:"delicious", type:"delicious out", user:"del-user", private:true, tags:"testtag"}], 
                          {
                            "del-user": {
                                password:"abcd1234"
                            },
                          },
                          function() {
                              var scope = nock('https://api.delicious.com:443')
                                  .get('/v1/posts/add?url=foobar&description=test&auth_token=undefined&shared=no&tags=testtag&extended=testdesc')
                                    .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\<code=\"done\"/>");
                             
                              var inject = helper.getNode("inject");
                              var delicious = helper.getNode("delicious");
                              delicious.should.have.property('id','delicious');
                              inject.send({payload:"foobar", title:"test",description:"testdesc"});
                              var stub = sinon.stub(delicious, 'status', function(status) {
                                  if (Object.getOwnPropertyNames(status).length === 0) {
                                      stub.restore();
                                      done();
                                  }
                                  return;
                              });
                          });
            })
            
            it(' fails if failure with save link', function(done) {
                    helper.load(deliciousNode, 
                        [ {id:"inject", type:"helper", wires:[["delicious"]]},
                          {id:"del-user", type:"delicious-user", username:"Bob Jones"},
                          {id:"delicious", type:"delicious out", user:"del-user", private:true, tags:"testtag"}], 
                          {
                            "del-user": {
                                password:"abcd1234"
                            },
                          },
                          function() {
                              var scope = nock('https://api.delicious.com:443')
                                  .get('/v1/posts/add?url=foobar&description=test&auth_token=undefined&shared=no&tags=testtag&extended=testdesc')
                                    .reply(401, "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\<code=\"access denied\"/>");
                             
                              var inject = helper.getNode("inject");
                              var delicious = helper.getNode("delicious");
                              delicious.should.have.property('id','delicious');
                              var stub = sinon.stub(delicious, 'status', function(status) {
                                  if (status.text === "failed") {
                                      var expected = {fill:"red",shape:"ring",text:"failed"};
                                      should.deepEqual(status, expected);
                                      stub.restore();
                                      done();                                    
                                 }
                                  return;
                              });
                              inject.send({payload:"foobar", title:"test",description:"testdesc"});
                          });
            })
            
            
        };
    });
});
