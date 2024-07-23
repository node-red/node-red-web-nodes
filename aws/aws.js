
module.exports = function(RED) {
    "use strict";
    const fs = require('fs');
    const { minimatch } = require('minimatch');

    function AWSNode(n) {
        RED.nodes.createNode(this,n);
        this.endpoint = n.endpoint;
        this.forcepathstyle = n.forcepathstyle;
        this.skiptlsverify = n.skiptlsverify;
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
        var options = {region: node.region};
        if (this.awsConfig.endpoint) {
            var endpoint = new AWS.Endpoint(this.awsConfig.endpoint);
            options.endpoint = endpoint;
            options.region = '';
            if (this.awsConfig.forcepathstyle) {
                options.s3ForcePathStyle = true;
            }
            if (this.awsConfig.skiptlsverify && options.endpoint.protocol === 'https:') {
                var http = require('https');
                options.httpOptions = {
                    agent: new http.Agent({ rejectUnauthorized: false })
                };
            }
        }
        var s3 = new AWS.S3(options);
        node.status({fill:"blue",shape:"dot",text:"aws.status.initializing"});
        var contents = [];
        node.listAllObjects(s3, { Bucket: node.bucket },contents, function(err, data) {
            if (err) {
                node.error(RED._("aws.error.failed-to-fetch", {err:err}));
                node.status({fill:"red",shape:"ring",text:"aws.status.error"});
                return;
            }
            var contents = node.filterContents(data);
            node.state = contents.map(function (e) { return e.Key; });
            node.status({});
            node.on("input", function(msg) {
                node.status({fill:"blue",shape:"dot",text:"aws.status.checking-for-changes"});
                var contents = [];
                node.listAllObjects(s3, { Bucket: node.bucket }, contents, function(err, data) {
                    if (err) {
                        node.error(RED._("aws.error.failed-to-fetch", {err:err}),msg);
                        node.status({});
                        return;
                    }
                    node.status({});
                    var newContents = node.filterContents(data);
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
                            var newMessage = RED.util.cloneMessage(msg);
                            newMessage.payload = file;
                            newMessage.file = file.substring(file.lastIndexOf('/')+1);
                            newMessage.event = 'add';
                            newMessage.data = newContents[i];
                            node.send(newMessage);
                        }
                    }
                    for (var f in seen) {
                        if (seen.hasOwnProperty(f)) {
                            var newMessage = RED.util.cloneMessage(msg);
                            newMessage.payload = f;
                            newMessage.file = f.substring(f.lastIndexOf('/')+1);
                            newMessage.event = 'delete';
                            // newMessage.data intentionally null
                            node.send(newMessage);
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

    AmazonS3InNode.prototype.listAllObjects = function(s3, params, contents, cb) {
        var node = this;
        s3.listObjects(params, function(err, data) {
            if (err) {
                cb(err, contents);
            } else {
                contents = contents.concat(data.Contents);
                if (data.IsTruncated) {
                    // Set Marker to last returned key
                    params.Marker = contents[contents.length-1].Key;
                    node.listAllObjects(s3, params, contents, cb);
                } else {
                    cb(err, contents);
                }
            }
        });
    };

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
        var options = {region: node.region};
        if (this.awsConfig.endpoint) {
            var endpoint = new AWS.Endpoint(this.awsConfig.endpoint);
            options.endpoint = endpoint;
            options.region = '';
            if (this.awsConfig.forcepathstyle) {
                options.s3ForcePathStyle = true;
            }
            if (this.awsConfig.skiptlsverify && options.endpoint.protocol === 'https:') {
                var http = require('https');
                options.httpOptions = {
                    agent: new http.Agent({ rejectUnauthorized: false })
                };
            }
        }
        var s3 = new AWS.S3(options);
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
        var options = {region: node.region};
        if (this.awsConfig.endpoint) {
            var endpoint = new AWS.Endpoint(this.awsConfig.endpoint);
            options.endpoint = endpoint;
            options.region = '';
            if (this.awsConfig.forcepathstyle) {
                options.s3ForcePathStyle = true;
            }
            if (this.awsConfig.skiptlsverify && options.endpoint.protocol === 'https:') {
                var http = require('https');
                options.httpOptions = {
                    agent: new http.Agent({ rejectUnauthorized: false })
                };
            }
        }
        var s3 = new AWS.S3(options);
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
    RED.nodes.registerType("amazon s3 out",AmazonS3OutNode);
};
