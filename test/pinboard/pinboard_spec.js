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
var pinboardNode = require("../../pinboard/pinboard.js");
var helper = require('../helper.js');

describe('pinboard nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
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
                      inject.send({title:"test",description:"testdesc"});
                      setTimeout(function() {
                          try {
                              helper.log().called.should.be.true;
                              var logEvents = helper.log().args.filter(function(evt) {
                                      return evt[0].type == "pinboard out";
                              });
                              logEvents.should.have.length(1);
                              logEvents[0][0].should.have.a.property("id",pinboard.id);
                              logEvents[0][0].should.have.a.property("type",pinboard.type);
                              logEvents[0][0].should.have.a.property("msg","url must be provided in msg.payload");
                              done();
                          } catch(err) {
                              done(err);
                          }
                      },200);
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
                      inject.send({payload:"foobar",description:"testdesc"});
                      setTimeout(function() {
                          try {
                              helper.log().called.should.be.true;
                              var logEvents = helper.log().args.filter(function(evt) {
                                      return evt[0].type == "pinboard out";
                              });
                              logEvents.should.have.length(1);
                              logEvents[0][0].should.have.a.property("id",pinboard.id);
                              logEvents[0][0].should.have.a.property("type",pinboard.type);
                              logEvents[0][0].should.have.a.property("msg","msg.title must be provided");
                              done();
                          } catch(err) {
                              done(err);
                          }
                      },200);
                  });
        });
    });
});
