node-red-node-aws
=================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to watch, send
and receive files from an Amazon S3 bucket.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-aws

Usage
-----

### Amazon S3 watch node

Watches for file events on an Amazon S3 bucket. By default all
file events are reported, but the filename pattern can be supplied
to limit the events to files which have full filenames that match
the glob pattern. The event messages consist of the full filename
in `msg.payload` property, the filename in `msg.file`,
the event type in `msg.event`.

### Amazon S3 input node

Downloads content from an Amazon S3 bucket. The bucket name can be specified in
the node **bucket** property or in the `msg.bucket` property.
The name of the file to download is taken from the node <b>filename</b> property
or the `msg.filename` property. The downloaded content is sent as `msg.payload`
property. If the download fails `msg.error` will contain an error object.


### Amazon S3 out node.

Uploads content to an Amazon S3 bucket. The bucket name can be specified in the
node <b>bucket</b> property or in the `msg.bucket` property. The filename on
Amazon S3 is taken from the node <b>filename</b> property or the
`msg.filename` property. The content is taken from either the node
<b>localFilename</b> property, the `msg.localFilename` property or
the `msg.payload` property.
