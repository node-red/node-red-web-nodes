node-red-node-dropbox
=====================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to watch, save
and retrieve files from Dropbox.

Install
-------

Search for `node-red-node-dropbox` in the Palette Manager, or run the following
command in your Node-RED user directory, ``~/.node-red`:

    npm install node-red-node-dropbox

Usage
-----

### Watch node

Watches for file events on Dropbox.

By default all file events are reported, but the filename pattern can
be supplied to limit the events to files which have full filenames
that match the glob pattern.

The event messages consist of the full filename in `msg.payload` property, the
filename in `msg.file` and the event type in `msg.event`.

### Input node

Downloads content from Dropbox.

The filename on Dropbox is taken from the node **filename**
property or the `msg.filename` property.

The downloaded content is sent as `msg.payload` property. If the download
fails `msg.error` will contain an error object.

### Output node

Uploads content to Dropbox.

The filename on Dropbox is taken from the node **filename** property or the `msg.filename` property.

You can pass in content either as a filename by setting the **localFilename** field or
`msg.localFilename` property, or you can pass in content directly using `msg.payload`.

The file will be uploaded to a directory on Dropbox called `Apps/{appname}/{appfolder}`
where {appname} and {appfolder} are set when you set up the Dropbox application key and token.
