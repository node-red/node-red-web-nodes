node-red-node-google
====================

<a href="http://nodered.org" target="_new">Node-RED</a> nodes to access various
Google services, including calendar, directions, geocoding, places and google plus.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-google

Pre-requisites
--------------

You must enable the Google APIs.

In the Google Developer Console under "Api & auth" select "APIs"

Search for "Directions API" click on it and then click "Enable API"

or see - https://code.google.com/apis/console

Usage
-----

### Calendar in

<p>Send a message every time an event occurs in a <a href="https://www.google.com/calendar">Google Calendar</a>.</p>
<p>The message sent from the node will have properties:
<ul>
  <li><b>title</b> - the summary string from the calendar entry</li>
  <li><b>description</b> - the description from the calendar entry</li>
  <li><b>location.description</b> - the location string from the calendar entry</li>
  <li><b>data</b> - the raw event from the google calendar query as described in the <a href="https://developers.google.com/google-apps/calendar/v3/reference/events/list">event list API documentation</a></li>
  <li><b>payload</b> - an object containing:
    <ul>
      <li><b>title</b> - the summary string from the calendar entry</li>
      <li><b>description</b> - the description from the calendar entry</li>
      <li><b>location.description</b> - the location string from the calendar entry</li>
      <li><b>start</b> - Javascript Date of start time - midnight for all day event</li>
      <li><b>end</b> - Javascript Date of end time - midnight for all day event</li>
      <li><b>allDayEvent</b> - true if event is an all day event</li>
      <li><b>creator</b> - object containing name and email properties</li>
      <li><b>attendees</b> - list of objects containing name and email properties</li>
    </ul>
  </li>
</ul>
</p>


### Calendar query

<p>Return the next event in a <a href="https://www.google.com/calendar">Google Calendar</a>.</p>
<p>The incoming message can provide the following properties:
<ul>
  <li><b>payload</b> - a text search string used to select relevant events</li>
  <li><b>calendar</b> - the calendar to retrieve the event from (optional, defaults to the node calendar property or the users primary calendar)</li>
</ul>
</p>
<p>The message sent from the node will have properties:
<ul>
  <li><b>title</b> - the summary string from the calendar entry</li>
  <li><b>description</b> - the description from the calendar entry</li>
  <li><b>location.description</b> - the location string from the calendar entry</li>
  <li><b>data</b> - the raw event from the google calendar query as described in the <a href="https://developers.google.com/google-apps/calendar/v3/reference/events/list">event list API documentation</a></li>
  <li><b>payload</b> - an object containing:
    <ul>
      <li><b>title</b> - the summary string from the calendar entry</li>
      <li><b>description</b> - the description from the calendar entry</li>
      <li><b>location.description</b> - the location string from the calendar entry</li>
      <li><b>start</b> - Javascript Date of start time - midnight for all day event</li>
      <li><b>end</b> - Javascript Date of end time - midnight for all day event</li>
      <li><b>allDayEvent</b> - true if event is an all day event</li>
      <li><b>creator</b> - object containing name and email properties</li>
      <li><b>attendees</b> - list of objects containing name and email properties</li>
    </ul>
  </li>
</ul>
</p>

### Calendar out

<p>Create an entry in a <a href="https://www.google.com/calendar">Google Calendar</a>.</p>
<p>The incoming message can provide the following properties:
<ul>
  <li><b>payload</b> - either a string to describe the event using <a href="https://support.google.com/calendar/answer/36604?hl=en">quick add format</a> or an object representing the request body for an <a href="https://developers.google.com/google-apps/calendar/v3/reference/events/insert">insert request</a></li>
  <li><b>calendar</b> - the calendar to add the event to (optional, defaults to the node calendar property or the users primary calendar)</li>
  <li><b>sendNotifications</b> - a boolean to determine if notifications should be sent to attendees (optional, defaults to false)</li>
</ul>
</p>


### Directions

<p>Utilizes the Google Direcions API to provide directions between the supplied origin and destination.</p>

#### Input Parameters:
<p><code>Name</code> - Name of the node</p>
<p>All of the following parameters can be supplied as part of the top level <code>msg</code> object.</p>
<p><code>msg.key</code> - Your application's API key. This key identifies your application for purposes of quota management.</p>
<p><code>msg.origin</code> - The address or textual <i>latitude,longitude</i> value from which you wish to calculate directions. If you pass an address as a string, the Directions service will geocode the string and convert it to a <i>latitude,longitude</i> coordinate to calculate directions. If you pass coordinates, ensure that no space exists between the latitude and longitude values.</p>
<p><code>msg.destination</code> - The address or textual <i>latitude,longitude</i> value from which you wish to calculate directions. If you pass an address as a string, the Directions service will geocode the string and convert it to a <i>latitude,longitude</i> coordinate to calculate directions. If you pass coordinates, ensure that no space exists between the latitude and longitude values.</p>
<p><code>msg.mode</code> - (Defaults to driving). Specifies the mode of transport to use when calculating directions. Valid values and other request details are specified in <a href="https://developers.google.com/maps/documentation/directions/?csw=1#TravelModes">Travel Modes</a>.</p>
<p><code>msg.waypoints</code> - Specifies an array of waypoints. Waypoints alter a route by routing it through the specified location(s). A waypoint is specified as either a <i>latitude,longitude</i> coordinate or as an address which will be geocoded. Waypoints are only supported for driving, walking and bicycling directions. (For more information on waypoints, see <a href="https://developers.google.com/maps/documentation/directions/?csw=1#Waypoints">Using Waypoints in Routes</a>.)</p>
<p><code>msg.alternatives</code> - If set to true, specifies that the Directions service may provide more than one route alternative in the response. Note that providing route alternatives may increase the response time from the server.</p>
<p><code>msg.avoid</code> -  Indicates that the calculated route(s) should avoid the indicated features. This parameter supports the following arguments:
    <ul>
        <li><i>tolls</i> indicates that the calculated route should avoid toll roads/bridges.</li>
        <li><i>highways</i> indicates that the calculated route should avoid highways.</li>
        <li><i>ferries</i> indicates that the calculated route should avoid ferries.</li>
    </ul>
</p>
<p><code>msg.language</code> - Specifies the language in which to return results. See the list of <a href="https://developers.google.com/maps/faq#languagesupport">supported domain languages</a>. </p>
<p><code>msg.units</code> - Specifies the unit system to use when displaying results. Valid values are specified in <a href="https://developers.google.com/maps/documentation/directions/?csw=1#UnitSystems">Unit Systems</a>.</p>
<p><code>msg.region</code> - Specifies the region code, specified as a ccTLD ("top-level domain") two-character value. (For more information see <a href="https://developers.google.com/maps/documentation/directions/?csw=1#RegionBiasing">Region Biasing</a>.)</p>
<p><code>msg.departure_time</code> - Specifies the desired time of departure. You can specify the time as an integer in seconds since midnight, January 1, 1970 UTC.</p>
<p><code>msg.arrival_time</code> - pecifies the desired time of arrival for transit directions, in seconds since midnight, January 1, 1970 UTC. You can specify either departure_time or arrival_time, but not both.</p>
<p><code>msg.transit_mode</code> - Specifies one or more preferred modes of transit. This parameter may only be specified for transit directions, and only if the request includes an API key or a Google Maps API for Work client ID. The parameter supports the following arguments:
    <ul>
        <li><i>bus</i> indicates that the calculated route should prefer travel by bus.</li>
        <li><i>subway</i> indicates that the calculated route should prefer travel by subway.</li>
        <li><i>train</i> indicates that the calculated route should prefer travel by train.</li>
        <li><i>tram</i> indicates that the calculated route should prefer travel by tram and light rail.</li>
        <li><i>rail</i> indicates that the calculated route should prefer travel by train, tram, light rail, and subway. This is equivalent to transit_mode=<i>train|tram|subway</i>.</li>
    </ul>
</p>
<p><code>msg.transit_routing_preferences</code> - </p>

#### Return values:
<p><code>msg.status</code> - Will either be 'OK' or provide an error state.</p>
<p><code>msg.distance</code> - The distance of the trip, provided in meters</p>
<p><code>msg.duration</code> - The duration of the trip, provided in seconds.</p>
<p><code>msg.location</code> - Will contain to address objects, start and end, which will each contain a lon, lat, and address.</p>
<p><code>msg.payload</code> - <br />
<code>
    {
        routes: [
            {
                copyrights,
                summary,
                bounds: {
                    northeast:{
                        lat,
                        lon
                    },
                    southwest: {
                        lat,
                        lon
                    }
                },
                warnings: [],
                waypoint_order: [],
                fare: {
                    currency,
                    value
                },
                legs: [
                    {
                        distance: {
                            value,
                            text
                        },
                        duration: {
                            value,
                            text
                        },
                        duration_in_traffic: {
                            value,
                            text
                        },
                        departure_time,
                        arrival_time,
                        start_location: {
                            address,
                            lat,
                            lon
                        },
                        end_location: {
                            address,
                            lat,
                            lon
                        },
                        steps: [
                            {
                                distance:{
                                    value,
                                    text
                                },
                                duration:{
                                    value,
                                    text
                                },
                                start_location:{
                                    lat,
                                    lon
                                },
                                end_location:{
                                    lat,
                                    lon
                                },
                                html_instructions,
                                maneuver,
                                travel_mode,
                                transit_details
                            }
                        ]
                    }]
            }
        ],
        status
    }
</code>
<br><br>
<p>For more information, please visit the <a href="https://developers.google.com/maps/documentation/directions/">Google Directions API Developer Docs</a>


### Geocoding

<p>Utilizes the Google Geocoding API to allow conversion of addresses to coordinate sets, and vice versa.</p>
<p>The node can be configured to send a geocode or reverse-geocode request by changing the <code>geocodeBy</code> parameter in the node.</p>

#### Input Parameters:

<p><code>Name</code> - Name of the node</p>
<p><code>Geocode by</code> - Toggle to switch between a geocode and reverse-geocode request. Switching between the two will toggle the address and <i>latitude,longitude</i> inputs.</p>
<p>All of the following parameters can be supplied as part of the top level <code>msg</code> object.</p>
<p><code>msg.location.address</code> - Address to be sent to Google in order to be converted to a set of coordinates. <i>(Required if using Geocode by Address)</i></p>
<p><code>msg.location.lat</code> - Latitude point to be sent to Google in order to be converted to a human-readable address. <i>(Required if using Geocode by Coordinates)</i></p>
<p><code>msg.location.lon</code> - Longitude point to be sent to Google in order to be converted to a human-readable address. <i>(Required if using Geocode by Coordinates)</i></p>
<p><code>msg.key</code> - Your application's API key. This key identifies your application for purposes of quota management.</p>
<p><code>msg.bounds</code> - The bounding box of the viewport within which to bias geocode results more prominently. This parameter will only influence, not fully restrict, results from the geocoder.</p>
<p><code>msg.language</code> - The language in which to return results.</p>
<p><code>msg.region</code> - The region code, specified as a ccTLD ("top-level domain") two-character value. This parameter will only influence, not fully restrict, results from the geocoder.</p>
<p><code>msg.components</code> - The component filters, separated by a pipe (|). Each component filter consists of a component:value pair and will fully restrict the results from the geocoder.</p>

#### Return values:

<p><code>msg.status</code> - Will either be 'OK' or provide an error state.</p>
<p>If <code>msg.status</code> returned 'OK':
<p><code>msg.location</code> - If provided with an <code>address</code>, <code>msg.location</code> will contain a <code>lat</code> and <code>lon</code> point. If provided with a <code>lat</code>/<code>lon</code> pair, <code>msg.location</code> will contain an <code>address</code></p>
<br>
<p>Otherwise:</p>
<p><code>msg.error</code> will contain a more detailed error message, if available</p>
<p>For more information, please visit the <a href="https://developers.google.com/maps/documentation/geocoding/">Google Geocoding API Developer Docs</a>


### Places

<p>Utilizes the Google Places API in order to find and learn more about local establishments.</p>
<p>The node can be configured to send three different types of Places requests by toggling the <code>reqType</code> parameter in the node.</p>

### Google Places Nearby
#### Input Parameters:
<p><code>name</code> - Name of the node</p>
<p><code>reqType</code> - Toggle to switch between a Places Nearby, Places Text, and Places Details request.</p>
<p>All of the following parameters can be supplied as part of the top level <code>msg</code> object.</p>
<p><code>msg.key</code> - Your application's API key. This key identifies your application for purposes of quota management. <i>(Required)</i></p>
<p><code>msg.location.lat</code> - Latitude point to be sent to Google in order to be converted to a human-readable address. <i>(Required)</i></p>
<p><code>msg.location.lon</code> - Longitude point to be sent to Google in order to be converted to a human-readable address. <i>(Required)</i></p>
<p><code>msg.location.radius</code> - Defines the distance (in meters) within which to return place results. The maximum allowed radius is 50000 meters. <i>(Required if rankby=prominence. If rankby=distance, radius is not allowed)</i></p>
<p><code>msg.keyword</code> - A term to be matched against all content that Google has indexed for this place, including but not limited to name, type, and address, as well as customer reviews and other third-party content.</p>
<p><code>msg.language</code> - The language in which to return results.</p>
<p><code>msg.minprice</code> - Restricts results to only those places within the specified price level. Valid values are in the range from 0 (most affordable) to 4 (most expensive), inclusive.</p>
<p><code>msg.maxprice</code> - Restricts results to only those places within the specified price level. Valid values are in the range from 0 (most affordable) to 4 (most expensive), inclusive.</p>
<p><code>msg.name</code> - The name of the business to search for.</p>
<p><code>msg.types</code> - Restricts the results to places matching at least one of the specified types. Types should be separated with a pipe symbol (type1|type2|etc). (<a href="https://developers.google.com/places/documentation/supported_types" target="_new">Click here</a> for supported types)</p>
<p><code>msg.opennow</code> - If set to true, will only return results that are currently open now.</p>

#### Return values:
<p><code>msg.status</code> - Will either be 'OK' or provide an error state.</p>
<p>If <code>msg.status</code> returned 'OK':
<p><code>msg.location</code> - Will contain <code>lat</code>, <code>lon</code>, and <code>address</code></p>
<p><code>msg.placeid</code> - A unique identifier for a place. To retrieve information about the place, pass this identifier in the placeId field of a Places API request.</p>
<p><code>msg.payload</code> - <br>
<code>{<br>
    <b>placeid</b> - A unique identifier for a place. To retrieve information about the place, pass this identifier in the placeId field of a Places API request.<br>
    <b>name</b> - The name of the establishment<br>
    <b>vicinity</b> - Contains a feature name of a nearby location. Often this feature refers to a street or neighborhood within the given results.<br>
    <b>types</b> - Contains an array of feature types describing the given result<br>
    <b>pricelevel</b> - The price level of the place, on a scale of 0 to 4 (0-Free 1-Inexpensive 2-Moderate 3-Expensive 4-Very Expensive).<br>
    <b>rating</b> - Contains the place's rating, from 1.0 to 5.0, based on aggregated user reviews.<br>
    <b>opennow</b> - Boolean that shows whether the establishment is currently open.<br>
}</code>
<p>Otherwise:</p>
<p><code>msg.error</code> will contain a more detailed error message, if available</p>

### Google Places Text
#### Input Parameters:
<p><code>name</code> - Name of the node</p>
<p><code>reqType</code> - Toggle to switch between a Places Nearby, Places Text, and Places Details request.</p>
<p>All of the following parameters can be supplied as part of the top level <code>msg</code> object.</p>
<p><code>msg.key</code> - Your application's API key. This key identifies your application for purposes of quota management. <i>(Required)</i></p>
<p><code>msg.query</code> - The text string on which to search, for example: "restaurant". The Google Places service will return candidate matches based on this string and order the results based on their perceived relevance. <i>(Required)</i></p>
<p><code>msg.location.lat</code> - Latitude point to be sent to Google in order to be converted to a human-readable address.</p>
<p><code>msg.location.lon</code> - Longitude point to be sent to Google in order to be converted to a human-readable address.</p>
<p><code>msg.location.radius</code> - Defines the distance (in meters) within which to return place results. The maximum allowed radius is 50000 meters.</p>
<p><code>msg.keyword</code> - A term to be matched against all content that Google has indexed for this place, including but not limited to name, type, and address, as well as customer reviews and other third-party content.</p>
<p><code>msg.language</code> - The language in which to return results.</p>
<p><code>msg.minprice</code> - Restricts results to only those places within the specified price level. Valid values are in the range from 0 (most affordable) to 4 (most expensive), inclusive.</p>
<p><code>msg.maxprice</code> - Restricts results to only those places within the specified price level. Valid values are in the range from 0 (most affordable) to 4 (most expensive), inclusive.</p>
<p><code>msg.types</code> - Restricts the results to places matching at least one of the specified types. Types should be separated with a pipe symbol (type1|type2|etc). (<a href="https://developers.google.com/places/documentation/supported_types" target="_new">Click here</a> for supported types)</p>
<p><code>msg.opennow</code> - If set to true, will only return results that are currently open now.</p>

#### Return values:
<p><code>msg.status</code> - Will either be 'OK' or provide an error state.</p>
<p>If <code>msg.status</code> returned 'OK':
<p><code>msg.title</code> - The name of the establishment.
<p><code>msg.location</code> - Will contain <code>lat</code>, <code>lon</code>, and <code>address</code></p>
<p><code>msg.placeid</code> - A unique identifier for a place. To retrieve information about the place, pass this identifier in the placeId field of a Places API request.</p>
<p><code>msg.payload</code> - Will contain the name and address of the result.
<p><code>msg.detailsJson</code> - <br>
<code>{<br>
    <b>placeid</b> - A unique identifier for a place. To retrieve information about the place, pass this identifier in the placeId field of a Places API request.<br>
    <b>name</b> - The name of the establishment<br>
    <b>address</b> - Human readable address of the establishment<br>
    <b>types</b> - Contains an array of feature types describing the given result<br>
    <b>pricelevel</b> - The price level of the place, on a scale of 0 to 4 (0-Free 1-Inexpensive 2-Moderate 3-Expensive 4-Very Expensive).<br>
    <b>rating</b> - Contains the place's rating, from 1.0 to 5.0, based on aggregated user reviews.<br>
}</code>
<p>Otherwise:</p>
<p><code>msg.error</code> will contain a more detailed error message, if available</p>

### Google Places Details
#### Input Parameters:
<p><code>Name</code> - Name of the node</p>
<p><code>reqType</code> - Toggle to switch between a Places Nearby, Places Text, and Places Details request.</p>
<p>All of the following parameters can be supplied as part of the top level <code>msg</code> object.</p>
<p><code>msg.key</code> - Your application's API key. This key identifies your application for purposes of quota management. <i>(Required)</i></p>
<p><code>msg.placeid</code> - A unique identifier that is returned from a Google Places request. <i>(Required)</i></p>
<p><code>msg.language</code> - The language in which to return results.</p>
<p><code>msg.extensions</code> - Indicates if the Place Details response should include additional fields. Additional fields may include Premium data, requiring an additional license, or values that are not commonly requested. Extensions are currently experimental. Supported values for the extensions parameter are {review_summary}.</p>

#### Return values:
<p><code>msg.status</code> - Will either be 'OK' or provide an error state.</p>
<p>If <code>msg.status</code> returned 'OK':
<p><code>msg.location</code> - Will contain <code>lat</code>, <code>lon</code>, and <code>address</code></p>
<p><code>msg.payload</code> - <br>
    {<br>
        <b>name</b> - The name of the establishment<br>
        <b>address</b> - Human readable address of the establishment<br>
        <b>phone</b> - Locally formatted phone number for the establishment<br>
        <b>website</b> - The web address for the establishment<br>
        <b>rating</b> - Contains the place's rating, from 1.0 to 5.0, based on aggregated user reviews.<br>
        <b>pricelevel</b> - The price level of the place, on a scale of 0 to 4 (0-Free 1-Inexpensive 2-Moderate 3-Expensive 4-Very Expensive).<br>
        <b>opennow</b> - Boolean that shows whether the establishment is currently open.<br>
        <b>open</b> - Will return the day (0-6) and time (0000-2359) that the establishment is open.<br>
        <b>close</b> - Will return any day (0-6) that the establishment is closed.<br>
        <b>permanently_closed</b> - Will return true if the establishment is permanently closed.<br>
    }</code>
<br>
<p>Otherwise:</p>
<p><code>msg.error</code> will contain a more detailed error message, if available</p>
<p>For more information, please visit the <a href="https://developers.google.com/maps/documentation/geocoding/">Google Geocoding API Developer Docs</a>

### Plus

<p>Interact with the Google+ API to get information about people, activities, and comments.</p>

#### Request Types:
<p><b>People</b> - Allows you to interact with Google+ profiles. You are able to <i>get</i> a particular profile, <i>search</i> for a profile, or gather a <i>list</i> of people that have +1'd or reshared an activity.</p>
<p><b>Activities</b> - Allows you to interact with Google+ activities. You are able to <i>get</i> a particular activity, <i>search</i> for an activitiy, or gather a <i>list</i> of activities directly related to a person.</p>
<p><b>Comments</b> - Allows you to interact with Google+ comments. You are able to <i>get</i> a particular comment, or gather a <i>list</i> of comments attached to an activity.</p>

#### Inputs:
<p><b>User Id</b> - The ID of the person to get the profile for. The special value "me" can be used to indicate the authenticated user.</p>
<p><b>Activity Id</b> - The ID of the activity to get.</p>
<p><b>Comment Id</b> - The ID of the comment to get.</p>
<p><b>Collection</b> - The collection of activities to list. Acceptable values are: <i>public</i>: All public activities created by the specified user.</p>
<p><b>Language</b> - Specify the preferred language to search with. See <a href="https://developers.google.com/+/api/search.html#available-languages">search language codes</a> for available values.</p>
<p><b>Max Results</b> - The maximum number of activities to include in the response, which is used for paging.</p>
<p><b>Sort Order</b> - The order in which to sort the list of comments. Acceptable values are: <i>ascending</i>: Sort oldest comments first. (default); <i>descending</i>: Sort newest comments first.</p>
<p><b>Order by</b> - Specifies how to order search results. Acceptable values are: <i>best</i>: Sort activities by relevance to the user, most relevant first; <i>recent</i>: Sort activities by published date, most recent first. (default)</p>
<p><b>Page Token</b> - The continuation token, which is used to page through large result sets. To get the next page of results, set this parameter to the value of "nextPageToken" from the previous response.</p>
