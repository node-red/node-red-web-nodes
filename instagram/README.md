node-red-node-instagram
=======================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes that get photos
from Instagram.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-instagram

Usage
-----

Two nodes that get photos from Instagram


### Input Node

Get photos from Instagram.

This node automatically checks for new content in a user's account every 15 minutes.

It can be configured to either retrieve new photos uploaded by the user, or
photos the user has liked. Each message sent by the node contains a single
photo in its payload, either as a Buffer containing the photo or its URL.

When the metadata is available within Instagram's service, the photo's capture time and location
are also forwarded in the form of **msg.time**, **msg.lat** and **msg.lon**.


### Query node

Get photos from Instagram.

This node checks for new content in a user's account whenever it receives a
message.

It can be configured to either retrieve new photos uploaded by the user, or
photos the user has liked. Each message sent by the node contains a single
photo in its payload, either as a Buffer containing the photo or its URL.

When the metadata is available within Instagram's service, the photo's capture time and location
are also forwarded in the form of **msg.time**, **msg.lat** and **msg.lon**.


### Note:

Videos are currently not supported and are ignored.
