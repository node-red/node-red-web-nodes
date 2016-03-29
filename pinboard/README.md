node-red-node-pinboard
======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save bookmarks to Pinboard.

Install
-------

Run the following command in your Node-RED user directory - typically `~/.node-red`

        npm i node-red-node-pinboard

Usage
-----

Saves bookmarks to <a href="http://pinboard.in" target="_new">Pinboard.in</a>.

The incoming message can provide the following properties:

  - `msg.payload` - the url to save (required)
  - `msg.title` - the title for the bookmark (required)
  - `msg.description` - the description for the bookmark (optional)
