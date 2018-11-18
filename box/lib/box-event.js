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

const minimatch = require('minimatch');

module.exports = RED => {

    const constructFullPath = entry => {
        if (entry.path_collection) {
            const parentPath = entry.path_collection.entries
                .filter(e => e.id !== "0")
                .map(e => e.name)
                .join('/');
            return (parentPath ? `${parentPath}/` : "") + entry.name;
        }
        return entry.name;
    }

    class BoxEventNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.filepattern = n.filepattern || "";
            this.interval = n.interval || "";
            /**
             * @type {BoxAPINode}
             **/
            this.box = RED.nodes.getNode(n.box);

            if (!this.box || !this.box.hasCredentials) {
                this.warn(RED._("box.warn.missing-credentials"));
                return;
            }

            this.status({
                fill: "blue",
                shape: "dot",
                text: "box.status.initializing"
            });

            this.box.subscribe(event => {
                    // if there's a "source" property, we can filter
                    if (event.source) {
                        event.fullPath = constructFullPath(event.source);
                        if (this.filepattern && !minimatch(event.fullPath, this.filepattern)) {
                            this.debug(RED._('box.debug.filtered'), {
                                fullPath: event.fullPath,
                                filepattern: this.filepattern
                            });
                            return;
                        }
                    }
                    this.send({
                        payload: event
                    });
                }, {
                    interval: this.interval
                })
                .then(unsubscribe => {
                    this.status({
                        fill: 'green',
                        shape: 'circle',
                        text: 'box.status.listening'
                    });
                    this.on('close', unsubscribe);
                })
                .catch(err => {
                    this.error(RED._('box.error.event-stream-initialize-failed', {
                        err: err.toString()
                    }));
                });
        }

        lookupOldPath(msg, entry, event) {
            return Promise.resolve()
                .then(() => {
                    const source = entry.source;
                    this.status({
                        fill: "blue",
                        shape: "dot",
                        text: "box.status.resolving-path"
                    });
                    return this.box.folderInfo(source.parent.id);
                })
                .then(folder => {
                    this.status({});
                    const parentPath = constructFullPath(folder);
                    this.sendEvent(msg, entry, event, (parentPath ? `${parentPath}/` : '') + source.name);
                })
                .catch(err => {
                    this.warn(RED._(
                        "box.warn.old-path-failed", {
                            err: err.toString()
                        }
                    ));
                    this.status({
                        fill: "red",
                        shape: "ring",
                        text: "box.status.failed"
                    });
                })
            // TODO: add folder path_collection to entry.parent?
        }
    }
    RED.nodes.registerType("box in", BoxEventNode);

};
