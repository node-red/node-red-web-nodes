node-red-node-fitbit
====================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes that gets information from a Fitbit record

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-fitbit

Usage
-----

Two nodes that get reports from <a href="http://www.fitbit.com" target="_new">Fitbit</a>.

### Input Node

Polls <a href="http://www.fitbit.com">Fitbit</a> for new data.

The generated messages are determined by the node **type** property
as follows:

  - **goals** - Messages are only sent when a daily goal is reached. The `msg.payload` contains an achievement message and the `msg.data` property contains the current <a href="https://wiki.fitbit.com/display/API/API-Get-Activities">activities</a> data.
  - **sleep** - Messages are only sent when a new daily sleep record becomes available. The `msg.payload` contains <a href="https://wiki.fitbit.com/display/API/API-Get-Sleep">sleep log</a> data.
  - **badges** - Messages are only sent when a new badge is earned. The `msg.payload` contains the badge message and the `msg.data` property contains a single badge entry from the list returned by the <a href="https://wiki.fitbit.com/display/API/API-Get-Badges">badges API call</a>.

### Query node

Retrieves user data from <a href="http://www.fitbit.com">Fitbit</a>.

The `msg.payload` is determined by the node **type** property as
follows:

  - **activities** - the `msg.payload` contains <a href="https://wiki.fitbit.com/display/API/API-Get-Activities">daily activities</a> data.
  - **sleep** - the `msg.payload` contains <a href="https://wiki.fitbit.com/display/API/API-Get-Sleep">sleep log</a> data for the main sleep and the `msg.data` property contains the complete sleep data result.
  - **badges** - the `msg.payload` contains data about <a href="https://wiki.fitbit.com/display/API/API-Get-Badges">badges</a> awarded.

The `msg.date` property may be set to an ISO 8601 format
date (e.g. 2014-09-25) to retrieve historical data for
activities and sleep log. If no date is supplied, then data for
today will be retrieved. In the case of sleep, this is the data
for the preceding sleep.
