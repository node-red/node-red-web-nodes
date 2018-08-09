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

 'use strict';

const fs = require('fs');
const path = require('path');

module.exports = RED => {

    function BoxOutNode(n) {
        RED.nodes.createNode(this, n);
        this.filename = n.filename || "";
        this.localFilename = n.localFilename || "";
        this.box = RED.nodes.getNode(n.box);
        var node = this;
        if (!this.box || !this.box.hasCredentials) {
            this.warn(RED._("box.warn.missing-credentials"));
            return;
        }

        node.on("input", function(msg) {
            var filename = node.filename || msg.filename;
            if (filename === "") {
                node.error(RED._("box.error.no-filename-specified"));
                return;
            }
            node.status({
                fill: "blue",
                shape: "dot",
                text: "box.status.resolving-path"
            });
            const localFilename = node.localFilename || msg.localFilename;
            if (!localFilename && typeof msg.payload === "undefined") {
                return;
            }
            return this.box.upload(filename, localFilename, msg.payload)
                .catch(err => {
                    node.status({
                        fill: "red",
                        shape: "ring",
                        text: "box.status.failed"
                    });
                    node.error(err, msg);
                })
                .then(res => {
                    node.status({});
                    node.send(Object.assign(msg, {payload: res}))
                });
        });
    }
    RED.nodes.registerType("box out", BoxOutNode);
};
