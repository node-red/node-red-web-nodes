node-red-web-nodes
==================

A collection of [node-red](http://nodered.org) nodes aimed at web services

### Installation

This repository acts as an overall store for these nodes - and is not
intended as a way to install them - unless you really do want some development.

These nodes are separated into individual npms and available to
install from [npm](https://www.npmjs.com/search?q=node-red-node-).

To install - either use the manage palette option in the editor, or change to
your Node-RED user directory - this is usually `~/.node-red`

        cd ~/.node-red
        npm install node-red-node-{nodename}


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


### Running Tests
To run tests on all of the nodes you will need the node-red runtime:

     npm i node-red-web-nodes
     npm test


### Contributing / Fixes

Now that we support npm installaton of nodes we recommend people create and post their own
via [npm](https://www.npmjs.org/). Please read
the [packaging guide notes](http://nodered.org/docs/creating-nodes/packaging.html).

For simple typos and single line fixes please just raise an issue pointing out
our mistakes. If you need to raise a pull request please read our
[contribution guidelines](https://github.com/node-red/node-red/blob/master/CONTRIBUTING.md)
before doing so.

### Copyright and license

Copyright JS Foundation and other contributors, http://js.foundation under [the Apache 2.0 license](LICENSE).
