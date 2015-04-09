node-red-node-foursquare
====================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to get Foursquare
recommendations and check Swarm checkins

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-foursquare

Usage
-----

###Foursquare query node

Can be used to

  - explore recommended venues of a particular type near a given latitude and longitude

The type of venue to explore can be passed in as settings on the node or as the
`msg.payload.section` of the message input. Valid entries are:

  - food
  - drinks
  - coffee
  - shops
  - arts
  - outdoors
  - sights
  - all

The value set on the node will take precedence over the contents of `msg.payload.section`.

The number of results to return from the query and how to return them (either as a single message
or as multiple messages) are settings on the node.

The node sets the following properties

  - **payload** - the JSON of the recommended venue
  - **title** - the name of the recommended venue
  - **location.lat** - the latitude of the recommended venue
  - **location.lon** - the longitude of the recommended venue
  - **location.city** - the city where the recommended venue is
  - **location.country** - the country where the recommended venue is
  - **location.name** - the name of the recommended venue

The exact location of these properties depends on the number of results chosen to be returned along
with how to return them:

  - If the node output value is set to one then for both returning as a single message and as multiple
messages, the node returns a msg for the first in an ordered list of recommended venues near the provided
latitude and longitude. The returned msg has the payload, location and name properties.

  - If the node output value is set to more than one to be returned as a single message
the node sets `msg.payload`
to be an array of msgs, each one corresponding to a recommended venue and ordered according to the
<a href="https://foursquare.com/">Foursquare</a> venues explore API.  The first element in the array is
the most highly recommended venue and the length of the array is the output value set on the node or the
number of venues found, whichever is smaller. Each element in this array has the *payload,
title, location and name* properties.

  - If the node output value is set to more than one but to be returned as a multiple then the node sends
multiple msgs, each one representing a recommended venue.

For further information about the Foursquare API see
<a href="https://developer.foursquare.com/docs/venues/explore">Explore Recommended and Popular Venues</a>.


###Swarm input node

Polls every 15 minutes for the latest Swarm check-ins that have been registered by the authenticated
user since the node was registered. If a new check-in has been made within the polling interval
then `msg.payload` is set to be the JSON of the most recent new check-in.

The properties of the <a href="https://foursquare.com/">Swarm</a> check-in are documented at
<a href="https://developer.foursquare.com/docs/responses/checkin">Checkin Response</a>.

###Swarm query node

Can be used to search

  - all Swarm check-ins by the authenticated user.

The node sets <b>msg.payload</b> to be the JSON of the most recent check-in. If no check-ins
are found then the returned msg will have a null payload. The properties of the
<a href="https://swarm.com/">Swarm</a> check-in are documented at
<a href="https://developer.foursquare.com/docs/responses/checkin">Checkin Response</a>.

Data provided by <a href="https://foursquare.com/">Foursquare</a>.
