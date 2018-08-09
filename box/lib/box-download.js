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

module.exports = RED => {

    const DOWNLOAD_AS_RAW = 'RAW';

    class BoxDownloadNode {
        constructor(n) {
            RED.nodes.createNode(this, n);

            this.filename = n.filename;
            this.downloadAs = n.downloadAs || DOWNLOAD_AS_RAW;
            this.fileId = n.fileId;

            /**
             * @type {BoxAPINode}
             */
            this.box = RED.nodes.getNode(n.box);

            if (!this.box || !this.box.hasCredentials) {
                this.warn(RED._("box.warn.missing-credentials"));
                return;
            }

            this.on("input", msg => {
                const filename = this.filename || msg.filename;
                const downloadAs = this.downloadAs || msg.downloadAs;
                const fileId = this.fileId || msg.fileId;

                if (!filename && !fileId) {
                    this.error(RED._("box.error.no-filename-specified"));
                    return;
                }
                msg.filename = filename;
                msg.downloadAs = downloadAs;
                msg.fileId = fileId;

                return Promise.resolve()
                    .then(() => {
                        if (!fileId) {
                            this.status({
                                fill: "blue",
                                shape: "dot",
                                text: "box.status.resolving-path"
                            });
                            return this.box.resolveFile(filename)
                                .catch(err => Promise.reject(RED._('box.error.path-resolve-failed', {
                                    err: err.toString()
                                })));
                        }
                        return fileId;
                    })
                    .then(fileId => {
                        this.status({
                            fill: "blue",
                            shape: "dot",
                            text: "box.status.downloading"
                        });
                        return this.box.download(fileId, downloadAs)
                            .catch(err => Promise.reject(RED._('box.error.download-failed', {
                                err: err.toString()
                            })));
                    })
                    .then(content => {
                        msg.payload = content;
                        delete msg.error;
                        this.status({});
                        this.send(msg);
                    })
                    .catch(err => {
                        this.error(err, msg);
                        this.status({
                            fill: "red",
                            shape: "ring",
                            text: "box.status.failed"
                        });
                    });
            });
        }
    }
    RED.nodes.registerType("box", BoxDownloadNode);
}
