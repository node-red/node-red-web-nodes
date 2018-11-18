/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

'use strict';

module.exports = RED => {

    const DEFAULT_FOLDER_ID = 0;
    const DEFAULT_LIMIT = 25;
    const DEFAULT_OFFSET = 0;

    class BoxItemsNode {
        constructor(n) {
            RED.nodes.createNode(this, n);
            this.folderId = n.folderId || DEFAULT_FOLDER_ID;
            this.limit = n.limit || DEFAULT_LIMIT;
            this.offset = n.offset || DEFAULT_OFFSET;

            /**
             * @type {BoxAPINode}
             */
            this.box = RED.nodes.getNode(n.box);
            if (!this.box || !this.box.hasCredentials) {
                this.warn(RED._('box.warn.missing-credentials'));
                return;
            }

            this.on('input', msg => {
                const folderId = this.folderId || msg.folderId || DEFAULT_FOLDER_ID;
                const limit = this.limit || msg.limit || DEFAULT_LIMIT;
                const offset = this.offset || msg.offset || DEFAULT_OFFSET;

                msg.folderId = folderId;
                msg.limit = limit;
                msg.offset = offset;

                this.status({
                    fill: 'blue',
                    shape: 'dot',
                    text: 'box.status.listing'
                });

                this.box.client.folders.getItems(folderId, {
                        limit: parseInt(limit, 10),
                        offset: parseInt(offset, 10)
                    })
                    .then(result => {
                        msg.payload = result;
                        delete msg.error;
                        this.status({});
                        this.send(msg);
                    })
                    .catch(err => {
                        this.error(RED._('box.error.listing-failed', {
                            err: err.toString()
                        }), msg);
                        this.status({
                            fill: 'red',
                            shape: 'ring',
                            text: 'box.status.failed'
                        });
                    });
            });
        }
    }

    RED.nodes.registerType('box-items', BoxItemsNode);
}
