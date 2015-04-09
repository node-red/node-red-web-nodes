node-red-node-delicious
=======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to save bookmarks
to Delicious.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-delicious

Usage
-----

Saves bookmarks to <a target="_blank" href="http://delicious.com" target="_new">Delicious</a>.

The incoming message can provide the following properties:

  - **payload** - the url to save (required)
  - **title** - the title for the bookmark (required)
  - **description** - the description for the bookmark (optional)
