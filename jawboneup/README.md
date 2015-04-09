node-red-node-jawboneup
=======================

A <a href="http://nodered.org" target="_new">Node-RED</a> node to retrieve
workout information from <a href="https://jawbone.com/up" target="_new">Jawbone</a>.

Install
-------

Run the following command in the root directory of your Node-RED install

        npm install node-red-node-jawboneup

Usage
-----

Jawbone Up node.

Can be used to retrieve the workouts completed since the provided time (given as epoch time). This
time can be passed in as settings on the node or as the `msg.starttime` section of the message input.
The value set on the node will take precedence over the contents of incoming message.

The number of results to return from the query and how to return them (either as a single message
or as multiple messages) are settings on the node.

The node sets the following properties, if available,

  - `payload` - the JSON of the workout
  - `title` - the type of workout
  - `id` - the unique id for the workout
  - `location.lat` - the latitude of where the workout took place
  - `location.lon` - the longitude of where the workout took place
  - `payload.type` - the type of workout
  - `payload.starttime` - the start time of the workout as a Javascript Date object
  - `payload.duration` - the duration of the workout in seconds
  - `payload.distance` - the distance of the workout in meters
  - `payload.calories` - the total calories burned during the workout
  - `data` - the JSON of the workout

The exact location of these properties depends on the number of results chosen to be returned along
with how to return them:

  - If the node output value is set to one then for both returning as a single message and as multiple
messages, the node returns a msg for the latest workout since the provided start time. The returned msg
has the properties set on it.
  - If the node output value is set to more than one to be returned as a single message
the node sets `msg.payload`
to be an array of msg's, each one corresponding to a workout.  The first element in the array is
the latest workout and the length of the array is the output value set on the node or the
number of workouts found, whichever is smaller. Each element in this array has the properties on them.
  - If the node output value is set to more than one but to be returned as a multiple then the node sends
multiple msgs, each one representing a workout found.

Jawbone and Up are trademarks of Jawbone.
