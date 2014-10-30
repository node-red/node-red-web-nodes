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

describe('aws nodes', function() {

    before(function(done) {
        helper.startServer(done);
    });

    afterEach(function() {
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
});
