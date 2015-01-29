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
var forecastNode = require("../../forecast/forecastio.js");
var helper = require('../helper.js');

describe('forecastio nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
        helper.unload();
    });

    describe('in node', function() {
        it('can be loaded', function(done) {
            helper.load(forecastNode,
                        [{id:"forecast", type:"forecastio in"}], function() {
                var forecast = helper.getNode("forecast");
                forecast.should.have.property('id', 'forecast');
                done();
            });
        });
    });
    describe('query node', function() {
        it('can be loaded', function(done) {
            helper.load(forecastNode,
                        [{id:"forecast", type:"forecastio"}], function() {
                var forecast = helper.getNode("forecast");
                forecast.should.have.property('id', 'forecast');
                done();
            });
        });
    });
});
