node-red-node-tfl
=================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to interrogate Transport-for-London (TfL) transport APIs for bus and Underground information.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-tfl

Usage
-----

###Buses

Transport for London Buses and River Buses query node.
Get live bus departure/arrival info for your bus stop.

This node enables the user to get bus or river bus arrival information for
selected lines arriving at selected stops. The node returns the first vehicle/vessel
to arrive at a particular stop. The data is provided by
<a href="https://www.tfl.gov.uk/">Transport for London</a>.

If bus departures are scheduled from the specified stop then
the node sets `msg.payload` to provide information about this bus:

  - **StopPointName** : The name of the stop the bus is departing from.
  - **lineID** : The bus line's number.
  - **DestinationText** : The bus's destination text as displayed on the bus.
  - **RegistratoinNumber** : The vehicle's registration plate.
  - **EstimatedTime** : The Estimated Arrival Time of arrival at the specified stop as a JavaScript object.

In order to select your bus stop and line, you need to find bus stops first by searching
for them based on a given GPS coordinate and a search radius around specified coordinate.

Before using this node, please sign up to <a href=https://api-portal.tfl.gov.uk/login target="_blank" style="text-decoration:underline;\">Transport for London</a>
and accept the terms and conditions to gain access to the live feeds.

###Underground

Transport for London Underground query node.

This node enables the user to get the <a href="https://www.tfl.gov.uk/">Transport for London</a>
status information for the selected London underground line. The node then sets the following properties:

  - `msg.description` - text stating which line the status information is about
  - `msg.payload.status` - the TfL CssClass, for example "GoodService", "DisruptedService"
  - `msg.payload.goodservice` - a boolean, true if msg.payload.status is "GoodService", false otherwise
  - `msg.payload.description` - the description of the status, for example "Good Service", "Part Suspended"
  - `msg.payload.details` - the status details if they exist (they are only present when msg.payload.description is not "Good Service")
  - `msg.payload.branchdisruptions` - an array of information about the disruptions if any exist
  - `msg.data` - object containing the full information about the requested line

The line can be selected from a list on the node UI, or fed into the node as the `msg.payload.tubeline` of the message input when "Input Defined" is chosen in the UI.

Before using this node, please sign up to <a href=https://api-portal.tfl.gov.uk/login target="_blank" style="text-decoration:underline;\">Transport for London</a>
and accept the terms and conditions to gain access to the live feeds.

Powered by TfL Open Data.
