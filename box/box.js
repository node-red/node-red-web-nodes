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

const initAPINode = require('./lib/box-api');
const initDownloadNode = require('./lib/box-download');
const initEventNode = require('./lib/box-event');
const initUploadNode = require('./lib/box-upload');
const initItemsNode = require('./lib/box-items');
const initFileInfoNode = require('./lib/box-set-file-info');

module.exports = RED => {
    initAPINode(RED);
    initDownloadNode(RED);
    initEventNode(RED);
    initUploadNode(RED);
    initItemsNode(RED);
    initFileInfoNode(RED);
};
