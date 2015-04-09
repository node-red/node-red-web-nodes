node-red-node-pinboard
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save bookmarks to Pinboard.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-pinboard

Usage
-----

Saves bookmarks to <a href="http://http://pinboard.in">Pinboard.in</a>.

The incoming message can provide the following properties:

  - `msg.payload` - the url to save (required)
  - `msg.title` - the title for the bookmark (required)
  - `msg.description` - the description for the bookmark (optional)
