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
                      inject.send({title:"test",description:"testdesc"});
                      setTimeout(function() {
                          try {
                              helper.log().called.should.be.true;
                              var logEvents = helper.log().args.filter(function(evt) {
                                      return evt[0].type == "delicious out";
                              });
                              logEvents.should.have.length(1);
                              logEvents[0][0].should.have.a.property("id",delicious.id);
                              logEvents[0][0].should.have.a.property("type",delicious.type);
                              logEvents[0][0].should.have.a.property("msg","url must be provided in msg.payload");
                              done();
                          } catch(err) {
                              done(err);
                          }
                      },200);
                  });
        });
        
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
                      inject.send({payload:"foobar",description:"testdesc"});
                      setTimeout(function() {
                          try {
                              helper.log().called.should.be.true;
                              var logEvents = helper.log().args.filter(function(evt) {
                                      return evt[0].type == "delicious out";
                              });
                              logEvents.should.have.length(1);
                              logEvents[0][0].should.have.a.property("id",delicious.id);
                              logEvents[0][0].should.have.a.property("type",delicious.type);
                              logEvents[0][0].should.have.a.property("msg","msg.title must be provided");
                              done();
                          } catch(err) {
                              done(err);
                          }
                      },200);
                  });
        });
        
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
                                    .reply(200, "<?xml version=\"1.0\" encoding=\"UTF-8\"?><code=\"done\"/>");
                             
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
            });
            
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
                                    .reply(401, "<?xml version=\"1.0\" encoding=\"UTF-8\"?><code=\"access denied\"/>");
                             
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
            });
            
            
        }
    });
});
