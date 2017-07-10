node-red-node-darksky
=====================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that gets the
weather forecast from the Dark Sky weather API.

Pre-requisites
--------------

You will need an API key from  <a href="https://darksky.net/dev/" target="_blank">Dark Sky developer portal</a>.

This allows 1000 requests per day. The polling node makes a request every 5 minutes = 288 requests.

Install
-------

Run the following command in the root directory of your Node-RED install.
This is usually `~/.node-red`

        npm install node-red-node-darksky

Usage
-----

Two nodes that get the weather forecast from the Dark Sky weather API.

One node polls the Dark Sky api every 15 minutes, the other is triggered
to request weather forecast data when an input is received.

The user has the option of providing a date to the node instead of returning data for the next day.
The node will always prioritise the node settings if they are present.

The node is configured using a latitude and longitude set of coordinates, an
optional date/time combination, and a set of units with which to format the response.

These can be passed in as settings on the node, or as:

 - **msg.location.lat**, **msg.location.lon** and **msg.time** or **msg.payload**.

If using *msg.time* it should be a javascript Date object. If using *msg.payload*
it must be a string or number of milliseconds since 1970 (epoch time in mS.)

The node sets the following properties of **msg.payload**:

### Results

Both will return

  - **weather** - a single word representation of the current weather forecast.
  - **detail** - a more detailed explanation of what the weather is forecast to be.
  - **humidity** - a current humidity forecast in decimal (0-1).
  - **maxtemp** - the current forecast max temperature for the location in Fahrenheit.
  - **mintemp** - the current forecast minimum temperature for the location in Fahrenheit.
  - **windspeed** - the current forecast windspeed at the location in metres per second
  - **winddirection** - the current forecast wind direction for the location in degrees.
  - **lon** - the longitude of the location from which the forecast was sourced.
  - **lat** - the latitude of the location from which the forecast was sourced.
  - **clouds** - the current forecast cloud coverage of the location in percent.
  - **precipitation** - the current forecast precipitation chance
  - **sunrise** - the time at which the is forecast to rise in Unix UTC format.
  - **sunset** - the time at which the sun is forecast to set in Unix UTC format.
  - **units** - the units of the returned data, as requested.

The node also sets the following properties of **msg.location**.

  - **lat** - the latitude of the location from which the data was sourced.
  - **lon** - the longitude of the location from which the data was sourced.
  - **city** - the city from which the data was sourced.
  - **country** - the country from which the data was sourced.

Finally, the node sets:

  - **msg.time** - the time at which the weather data was received by Dark Sky.
  - **msg.data** - the full JSON returned by the API. This is VERY rich...

Weather data Powered by <a href="https://darksky.net/poweredby/" target="_blank">Dark Sky</a>
