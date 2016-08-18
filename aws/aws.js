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
    var minimatch = require("minimatch");

    function AWSNode(n) {
        RED.nodes.createNode(this,n);
        if (this.credentials &&
            this.credentials.accesskeyid && this.credentials.secretaccesskey) {
            this.AWS = require("aws-sdk");
            this.AWS.config.update({
                accessKeyId: this.credentials.accesskeyid,
                secretAccessKey: this.credentials.secretaccesskey,
            });
        }
    }

    RED.nodes.registerType("aws-config",AWSNode,{
        credentials: {
            accesskeyid: { type:"text" },
            secretaccesskey: { type: "password" }
        }
    });

    function AmazonS3InNode(n) {
        RED.nodes.createNode(this,n);
        this.awsConfig = RED.nodes.getNode(n.aws);
        // eu-west-1||us-east-1||us-west-1||us-west-2||eu-central-1||ap-northeast-1||ap-northeast-2||ap-southeast-1||ap-southeast-2||sa-east-1
        this.region = n.region || "eu-west-1";
        this.bucket = n.bucket;
        this.filepattern = n.filepattern || "";
        var node = this;
        var AWS = this.awsConfig ? this.awsConfig.AWS : null;

        if (!AWS) {
            node.warn(RED._("aws.warn.missing-credentials"));
            return;
        }
        var s3 = new AWS.S3({"region": node.region});
        node.status({fill:"blue",shape:"dot",text:"aws.status.initializing"});
        s3.listObjects({ Bucket: node.bucket }, function(err, data) {
            if (err) {
                node.error(RED._("aws.error.failed-to-fetch", {err:err}));
                node.status({fill:"red",shape:"ring",text:"aws.status.error"});
                return;
            }
            var contents = node.filterContents(data.Contents);
            node.state = contents.map(function (e) { return e.Key; });
            node.status({});
            node.on("input", function(msg) {
                node.status({fill:"blue",shape:"dot",text:"aws.status.checking-for-changes"});
                s3.listObjects({ Bucket: node.bucket }, function(err, data) {
                    if (err) {
                        node.error(RED._("aws.error.failed-to-fetch", {err:err}),msg);
                        node.status({});
                        return;
                    }
                    node.status({});
                    var newContents = node.filterContents(data.Contents);
                    var seen = {};
                    var i;
                    msg.bucket = node.bucket;
                    for (i = 0; i < node.state.length; i++) {
                        seen[node.state[i]] = true;
                    }
                    for (i = 0; i < newContents.length; i++) {
                        var file = newContents[i].Key;
                        if (seen[file]) {
                            delete seen[file];
                        } else {
                            msg.payload = file;
                            msg.file = file.substring(file.lastIndexOf('/')+1);
                            msg.event = 'add';
                            msg.data = newContents[i];
                            node.send(msg);
                        }
                    }
                    for (var f in seen) {
                        if (seen.hasOwnProperty(f)) {
                            msg.payload = f;
                            msg.file = f.substring(f.lastIndexOf('/')+1);
                            msg.event = 'delete';
                            // msg.data intentionally null
                            node.send(msg);
                        }
                    }
                    node.state = newContents.map(function (e) {return e.Key;});
                });
            });
            var interval = setInterval(function() {
                node.emit("input", {});
            }, 900000); // 15 minutes
            node.on("close", function() {
                if (interval !== null) {
                    clearInterval(interval);
                }
            });
        });
    }
    RED.nodes.registerType("amazon s3 in", AmazonS3InNode);

    AmazonS3InNode.prototype.filterContents = function(contents) {
        var node = this;
        return node.filepattern ? contents.filter(function (e) {
            return minimatch(e.Key, node.filepattern);
        }) : contents;
    };

    function AmazonS3QueryNode(n) {
        RED.nodes.createNode(this,n);
        this.awsConfig = RED.nodes.getNode(n.aws);
        this.region = n.region || "eu-west-1";
        this.bucket = n.bucket;
        this.filename = n.filename || "";
        var node = this;
        var AWS = this.awsConfig ? this.awsConfig.AWS : null;

        if (!AWS) {
            node.warn(RED._("aws.warn.missing-credentials"));
            return;
        }
        var s3 = new AWS.S3({"region": node.region});
        node.on("input", function(msg) {
            var bucket = node.bucket || msg.bucket;
            if (bucket === "") {
                node.error(RED._("aws.error.no-bucket-specified"),msg);
                return;
            }
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.warn("No filename");
                node.error(RED._("aws.error.no-filename-specified"),msg);
                return;
            }
            msg.bucket = bucket;
            msg.filename = filename;
            node.status({fill:"blue",shape:"dot",text:"aws.status.downloading"});
            s3.getObject({
                Bucket: bucket,
                Key: filename,
            }, function(err, data) {
                if (err) {
                    node.warn(err);
                    node.error(RED._("aws.error.download-failed",{err:err.toString()}),msg);
                    return;
                } else {
                    msg.payload = data.Body;
                }
                node.status({});
                node.send(msg);
            });
        });
    }
    RED.nodes.registerType("amazon s3", AmazonS3QueryNode);

    function AmazonS3OutNode(n) {
        RED.nodes.createNode(this,n);
        this.awsConfig = RED.nodes.getNode(n.aws);
        this.region = n.region  || "eu-west-1";
        this.bucket = n.bucket;
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        var node = this;
        var AWS = this.awsConfig ? this.awsConfig.AWS : null;

        if (!AWS) {
            node.warn(RED._("aws.warn.missing-credentials"));
            return;
        }
        if (AWS) {
            var s3 = new AWS.S3({"region": node.region});
            node.status({fill:"blue",shape:"dot",text:"aws.status.checking-credentials"});
            s3.listObjects({ Bucket: node.bucket }, function(err) {
                if (err) {
                    node.warn(err);
                    node.error(RED._("aws.error.aws-s3-error",{err:err}));
                    node.status({fill:"red",shape:"ring",text:"aws.status.error"});
                    return;
                }
                node.status({});
                node.on("input", function(msg) {
                    var bucket = node.bucket || msg.bucket;
                    if (bucket === "") {
                        node.error(RED._("aws.error.no-bucket-specified"),msg);
                        return;
                    }
                    var filename = node.filename || msg.filename;
                    if (filename === "") {
                        node.error(RED._("aws.error.no-filename-specified"),msg);
                        return;
                    }
                    var localFilename = node.localFilename || msg.localFilename;
                    if (localFilename) {
                        // TODO: use chunked upload for large files
                        node.status({fill:"blue",shape:"dot",text:"aws.status.uploading"});
                        var stream = fs.createReadStream(localFilename);
                        s3.putObject({
                            Bucket: bucket,
                            Body: stream,
                            Key: filename,
                        }, function(err) {
                            if (err) {
                                node.error(err.toString(),msg);
                                node.status({fill:"red",shape:"ring",text:"aws.status.failed"});
                                return;
                            }
                            node.status({});
                        });
                    } else if (typeof msg.payload !== "undefined") {
                        node.status({fill:"blue",shape:"dot",text:"aws.status.uploading"});
                        s3.putObject({
                            Bucket: bucket,
                            Body: RED.util.ensureBuffer(msg.payload),
                            Key: filename,
                        }, function(err) {
                            if (err) {
                                node.error(err.toString(),msg);
                                node.status({fill:"red",shape:"ring",text:"aws.status.failed"});
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
