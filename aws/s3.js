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

module.exports = function(RED) {
    "use strict";
    var fs = require('fs');

    function AmazonS3OutNode(n) {
        RED.nodes.createNode(this,n);
        this.awsConfig = RED.nodes.getNode(n.aws);
        this.region = n.region;
        this.bucket = n.bucket;
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        var node = this;
        var AWS = this.awsConfig.AWS;
        if (AWS) {
            var s3 = new AWS.S3();
            node.status({fill:"blue",shape:"dot",text:"checking credentials"});
            s3.listObjects({ Bucket: this.bucket }, function(err) {
                if (err) {
                    node.error("AWS S3 error: " + err);
                    node.status({fill:"red",shape:"ring",text:"error"});
                    return;
                }
                node.status({});
                node.on("input", function(msg) {
                    var bucket = this.bucket || msg.bucket;
                    if (bucket === "") {
                        node.warn("No bucket specified");
                        return;
                    }
                    var filename = this.filename || msg.filename;
                    if (filename === "") {
                        node.warn("No filename specified");
                        return;
                    }
                    var localFilename = this.localFilename || msg.localFilename;
                    if (localFilename) {
                        // TODO: use chunked upload for large files
                        node.status({fill:"blue",shape:"dot",text:"uploading"});
                        var stream = fs.createReadStream(localFilename);
                        s3.putObject({
                            Bucket: bucket,
                            Body: stream,
                            Key: filename,
                        }, function(err) {
                            if (err) {
                                node.error(err.toString());
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }
                            node.status({});
                        });
                    } else if (typeof msg.payload !== "undefined") {
                        node.status({fill:"blue",shape:"dot",text:"uploading"});
                        s3.putObject({
                            Bucket: bucket,
                            Body: RED.util.ensureBuffer(msg.payload),
                            Key: filename,
                        }, function(err) {
                            if (err) {
                                node.error(err.toString());
                                node.status({fill:"red",shape:"ring",text:"failed"});
                                return;
                            }
                            node.status({});
                        });
                    }
                });
            });
        }
    }
    RED.nodes.registerType("amazon s3 out",AmazonS3OutNode);
};
