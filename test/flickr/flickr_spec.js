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
var flickrNode = require("../../flickr/flickr.js");
var helper = require('../helper.js');

describe('flickr nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    describe('out node', function() {
        it('can be loaded', function(done) {
            helper.load(flickrNode,
                        [{id:"n1", type:"helper", wires:[["n2"]]},
                         {id:"n2", type:"flickr out"}], function() {
                var n2 = helper.getNode("n2");
                n2.should.have.property('id', 'n2');
                done();
            });
        });
    });
});
