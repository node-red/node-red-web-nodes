node-red-node-strava
====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to get your latest
data from Strava.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-strava

Usage
-----

Get your most recent activity from Strava.

This node returns the most recent activity in the authenticated user's account
whenever it receives a message.

Should an activity be available, the following is set on the message:

  - `msg.payload` is set to the JavaScript Activity object as served by Strava.
  - `msg.location.lat` and `msg.location.lon` is set to the activity's start location if such location is available
  - `msg.time` is a JavaScript date object representing the start of the activity, if such data is available. The date is set in UTC (zulu) time.

If there are no available activities, or if an error occurs, the node simply forwards the incoming message.

Data provided by <a href ="http://www.strava.com">Strava</a>.
