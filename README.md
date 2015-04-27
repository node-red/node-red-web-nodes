node-red-web-nodes
==================

A collection of [node-red](http://nodered.org) nodes aimed at web services

### Installation

These nodes are now separated into individual npms and available to
install from [npm](https://www.npmjs.com/search?q=node-red-node-).

They can be installed by

        npm install node-red-node-{nodename}

in your node-red user directory - this is usually `~/.node-red`

### Nodes

The install name is node-red-node-*(the name in braces)*. For example

        cd ~/.node-red
        npm install node-red-node-weather-underground

 - Amazon S3 (aws)
 - Box (box)
 - Delicious (delicious)
 - Dropbox (dropbox)
 - FitBit (fitbit)
 - Flickr (flicker)
 - Forecast.io (forecastio)
 - FourSquare/Swarm (foursquare)
 - Google Calendar (google)
 - Google Directions (google)
 - Google Geocoding (google)
 - Google Places (google)
 - Google Plus (google)
 - Instagram (instagram)
 - Jawbone (jawboneup)
 - OpenWeatherMap (openweathermap)
 - Pinboard (pinboard)
 - Strava (strava)
 - Transport for London (tfl)
 - Weather Underground (weather-underground)

### Contributing / Fixes

Now that we support npm installaton of nodes we recommend people create and post their own
via [npm](https://www.npmjs.org/). Please read
the [packaging guide notes](http://nodered.org/docs/creating-nodes/packaging.html).

If you are an IBMer, please contact us directly as the contribution process
is slightly different.

For simple typos and single line fixes please just raise an issue pointing out
our mistakes. If you need to raise a pull request please read our
[contribution guidelines](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md)
before doing so.
