node-red-node-flickr
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to upload
pictures to Flickr.

Install
-------

Run the following command in the root directory of your Node-RED install

    npm install node-red-node-flickr

Usage
-----

Saves photos to <a href="http://www.flickr.com" target="_new">Flickr</a>.

The incoming message can provide the following properties:

  - **msg.payload** - a Buffer containing the image (required)
  - **msg.title** - the title for the photo (optional)
  - **msg.description** - the description for the photo (optional)
  - **msg.tags** - tags to be applied to the photo. Can be either a string containing space-separated tags, or an array of tags. (optional)
