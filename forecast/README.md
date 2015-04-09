node-red-node-forecastio
========================

A <a href="http://nodered.org" target="_new">Node-RED</a> node that gets the
weather forecast from Forecast.io.

Pre-requisites
--------------

You will need an API key from  <a href="https://developer.forecast.io/" target="_blank">forecast.io</a>

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-forecastio


Usage
-----

Two nodes that get the weather forecast from Forecast.io.

The user has the option of making the node return data for the next day instead of providing a date.
The node will always prioritise the node settings if they are present.

### Input Node

Fetches the weather forecast at a location specified by name or
lat,lon every 5 minutes - and outputs a **msg** if something has changed.

### Query node

Accepts an input to trigger fetching the weather forecast either
from a specified location name or lat,lon or passed in on

        msg.location.city and msg.location.country
        or
        msg.location.lat and msg.location.lon

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

The node also sets the following properties of **msg.location**.

  - **lat** - the longitude of the location from which the data was sourced.
  - **lon** - the latitude of the location from which the data was sourced.
  - **city** - the city from which the data was sourced.
  - **country** - the country from which the data was sourced.

Finally, the node sets:

  - **msg.time** - the time at which the weather data was received by Forecast.io.
  - **msg.data** - the full JSON returned by the API. This is VERY rich...

Weather data provided by <a href="http://forecast.io" target="_blank">Forecast.io/</a>
