node-red-node-weather-underground
=================================

A Node-RED node that gets the
weather report and forecast from The Weather Underground

## Migration
In 1Q 2019, the [Weather Underground API was sunset](https://apicommunity.wunderground.com/weatherapi/topics/end-of-service-for-the-weather-underground-api). As a result, this Node-RED node no longer works. 

Replacement Node-RED nodes are now available that can retrieve Personal Weather Station data from the Weather Underground. PWS owners can register and receive a new API Key.  This new API key can be used with the [node-red-contrib-twc-weather](https://flows.nodered.org/node/node-red-contrib-twc-weather) nodes.   Please migrate to **node-red-contrib-twc-weather**

Pre-requisites
--------------

You will need an API key from the [The Weather Underground API](http://www.wunderground.com/weather/api/d/pricing.html) site.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-weather-underground


Usage
-----

Two nodes that get the weather report and forecast from The Weather Underground.


### Input Node

Fetches the current weather and forecast at a location specified by name or
lat,lon every 5 minutes - and outputs a **msg** if something has changed.

### Query node

Accepts an input to trigger fetching the current weather and forecast either
from a specified location name or lat,lon or passed in on

        msg.location.city and msg.location.country
        or
        msg.location.lat and msg.location.lon

### Results

Both nodes require a valid Weather Underground API in order to work.

Both will return

  - **description** - a brief verbal description of the current weather for human reading.
  - **weather** - a very short description of the current weather.
  - **tempc** - the current ground temperature at that location in Celsius.
  - **tempf** - the current ground temperature at that location in Fahrenheit.
  - **tempk** - the current ground temperature at that location in Kelvin.
  - **humidity** - the current relative humidity at the location in percent.
  - **windspeed** - the current wind speed at the location in Metres per second.
  - **winddirection** - the current wind direction at the location in meteorological degrees.
  - **location** - the name of the location from which the data was sourced.
  - **forecast** - the forecast for the next 12 hours.
  - **epoch** - the time of the observation in epoch format.

The node also sets the following properties of **msg.location**.

  - **lat** - the latitude of the location from which the data was sourced.
  - **lon** - the longitude of the location from which the data was sourced.
  - **city** - the city from which the data was sourced.
  - **country** - the country from which the data was sourced.

Finally, the node sets:

  - **msg.time** - the time at which the weather data was received by The Weather Underground.
  - **msg.data** - the full JSON returned by the API. This is VERY rich...

Weather data provided by <a href="http://www.wunderground.com/" target="_blank">The Weather Underground</a>
