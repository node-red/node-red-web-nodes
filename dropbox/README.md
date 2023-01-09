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

## Dropbox security introduction

### Refresh tokens vs Access tokens
The Dropbox security model - to protect access to your files and folders - is improved continiously, which means new versions of this node will need to be implemented to support these changes:
+ Version ***1.x*** of this node used long-live access tokens to access the files and folders of your Dropbox account.  
  However Dropbox [announced](https://dropbox.tech/developers/migrating-app-permissions-and-access-tokens) to retire those long-live access tokens on September 30th, 2021.  From then on Dropbox requires you to request once a long-live refresh token, which can be used infinitely do request short-live access tokens (which will be valid for only 4 hours).
+ Version ***2.0.0*** of this node was developed to support refresh tokens.  
  This version only allowed refresh tokens to be requested from Dropbox, if your flow editor was opened via a https connection to your Node-RED system.  Moreover self signed certificates were not allowed by Dropbox.
+ Version ***2.1.0*** of this node further improved this mechanism, by allowing refresh tokens to be requested via both http and https connections to Node-RED.

To request once such a refresh token, create a Dropbox config node and follow the instructions on the config node screen step by step.  The diagram below summarizes all these steps that need to be executed:

![image](https://user-images.githubusercontent.com/14224149/211395697-c296134b-2f55-43dc-b5a6-73423656a39e.png)

### Permissions
The tokens only give you access to your Dropbox account, but you still need to apply permissions to these tokens.  Which means that you need to specify in your Dropbox account which actions are allowed when somebody logs in via that token.  For example:
+ `files.content.write`: Edit content of your Dropbox files and folders
+ `files.content.read`: View content of your Dropbox files and folders

## Troubleshooting
Some error messages explained:
+ `This app has reached its user limit`.  By default your Dropbox account is only accessible via one domain (e.g. http://my_node_red_domain:1880):

   ![image](https://user-images.githubusercontent.com/14224149/211398030-8742ce0c-39bb-4d49-a285-bf00d9cdb9a7.png)

   As a result, you will get this error when you try to access it via multiple domains.  In that case you can allow multiple clients via the above *"Enable additional users"* button.
