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

                      var stub = sinon.stub(pinboard, 'error').callsFake(function(msg){
                          var expected = 'pinboard.error.no-title';
                          should.deepEqual(msg, expected);
                          stub.restore();
                          done();
                      });

                      inject.send({payload:"foobar",description:"testdesc"});
                  });
        });

    });
});
