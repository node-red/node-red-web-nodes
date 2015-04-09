node-red-node-box
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to watch, send
and receive files from <a href="http://www.box.com" target="_new">Box.com</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-box

Usage
-----

###Box watch node

Watches for file events on Box. By default all
file events are reported, but the filename pattern can be supplied
to limit the events to files which have full filenames that match
the glob pattern. The event messages consist of the full filename
in `msg.payload` property, the filename in `msg.file`,
the event type in `msg.event` and the full event entry as
returned by the <a href="https://developers.box.com/docs/#events">event
API</a> in `msg.data`.

###Box input node

Downloads content from Box. The filename on Box is taken from
the node `filename` property or the `msg.filename` property.
The content is sent as `msg.payload` property.

###Box output node

Uploads content to Box. The filename on Box is taken from the node
`filename` property or the `msg.filename` property. The content is taken from
either the node `localFilename` property, the `msg.localFilename` property or
the `msg.payload` property.
