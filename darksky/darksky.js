/**
 * Copyright 2014,2016 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

module.exports = function(RED) {
    "use strict";
    var https = require("https");

    function assignmentFunction(node, date, time, lat, lon, DarkSkyConfig, callback) {
        if (DarkSkyConfig && DarkSkyConfig.credentials && DarkSkyConfig.credentials.client_key) {
            node.apikey = DarkSkyConfig.credentials.client_key.trim();
        } else {
            return callback(RED._("darksky.error.no-credentials"));
        }

        if (90 >= lat && 180 >= lon && lat >= -90 && lon >= -180) {
            node.lat = lat;
            node.lon = lon;
        } else {
            return callback(RED._("darksky.error.invalid-lat_lon"));
        }

        if (date && time) {
            node.date = date;
            node.time = time;
            node.year = date.substring(0,4);
            node.month = date.substring(5,7);
            node.day = date.substring(8); //takes the substring from the 8th character to the end of the string
            node.hours = time.substring(0,2);
            node.minutes = time.substring(3);
        } else if (node.date) {
            return callback(RED._("darksky.error.invalid-time"));
        } else if (node.time) {
            return callback(RED._("darksky.error.invalid-date"));
        }
        callback();
    }

    function weatherPoll(node, msg, callback) {
        var url;
        var when;
        //If node settings are available, it prioritises these. If the node settings are missing, it checks the msg input instead.

        var today = new Date();
        if (today.getFullYear() - node.year > 60) {
            node.warn(RED._("darksky.warn.more-than-60-years"));
        } else if (today.getFullYear() - node.year < -10) {
            node.warn(RED._("darksky.warn.more-than-10-years"));
        }
        //wipe clear the msg properties if they exist, or create it if it doesn't
        msg.payload = {};
        msg.location = {};
        //If there is a value missing, the URL is not initialised.

        if (typeof(node.lang) == 'undefined') { node.lang = 'en'; }
        if (node.year && node.month && node.day && node.hours && node.minutes) {
            url = ("https://api.darksky.net/forecast/" + node.apikey + "/" + node.lat + "," + node.lon + "," + node.year + "-" + node.month + "-" + node.day + "T" + node.hours + ":" + node.minutes + ":00?units=" + node.units + "&lang=" + node.lang);
            when = 0;
        } else if (node.lat && node.lon && node.apikey) {
            url = ("https://api.darksky.net/forecast/" + node.apikey + "/" + node.lat + "," + node.lon + "?units=" + node.units + "&lang=" + node.lang);
            when = 1;
        }
        //If the URL is not initialised, there has been an error with the input data,
        //and a node.error is reported.
        //console.log("URL",url);
        if (url) {
            https.get(url, function(res) {
                var weather = "";

                res.on('data', function(d) {
                    weather += d;
                });

                res.on('end', function() {
                    if (weather === "Forbidden") {
                        return callback(RED._("darksky.error.incorrect-apikey"));
                    } else {
                        var jsun;
                        try {
                            jsun = JSON.parse(weather);
                        } catch (err) {
                            return callback(RED._("darksky.error.api-response", { response:weather }));
                        }
                        if (!jsun.daily) {
                            return callback(RED._("darksky.error.api-response", { response:weather }));
                        }
                        msg.data = jsun;
                        msg.payload.weather = jsun.daily.data[when].icon;
                        msg.payload.detail = jsun.daily.data[when].summary;
                        msg.payload.humidity = jsun.daily.data[when].humidity;
                        msg.payload.maxtemp = jsun.daily.data[when].temperatureMax;
                        msg.payload.mintemp = jsun.daily.data[when].temperatureMin;
                        msg.payload.windspeed = jsun.daily.data[when].windSpeed;
                        msg.payload.winddirection = jsun.daily.data[when].windBearing;
                        msg.payload.lat = jsun.latitude;
                        msg.payload.lon = jsun.longitude;
                        msg.payload.clouds = jsun.daily.data[when].cloudCover;
                        msg.payload.precipitation = jsun.daily.data[when].precipProbability;
                        msg.payload.sunrise = jsun.daily.data[when].sunriseTime;
                        msg.payload.sunset = jsun.daily.data[when].sunsetTime;
                        msg.payload.units = jsun.flags.units;
                        msg.location.lat = jsun.latitude;
                        msg.location.lon = jsun.longitude;
                        msg.time = new Date(jsun.daily.data[when].time*1000);
                        msg.title = RED._("darksky.message.weather-forecast");
                        msg.description = RED._("darksky.message.weather-info", {time:msg.time.toLocaleString(), lat:msg.location.lat, lon:msg.location.lon});
                        callback();
                    }
                });
            }).on('error', function(e) {
                callback(e);
            });
        } else {
            callback(RED._("darksky.error.invalid-url"));
        }
    }

    function DarkSkyInputNode(n) {
        RED.nodes.createNode(this, n);
        this.lang = n.lang || "en";
        this.units = n.units || "us";
        var node = this;
        this.repeat = 900000;
        this.interval_id = null;
        var previousdata = null;

        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );

        this.on('input', function(msg) {
            assignmentFunction(node, n.date, n.time, n.lat, n.lon, RED.nodes.getNode(n.darksky), function(err) {
                if (err) {
                    node.error(err,msg);
                } else {
                    weatherPoll(node, msg, function(err) {
                        if (err) {
                            node.error(err,msg);
                        } else {
                            var msgString = JSON.stringify(msg.payload);
                            if (msgString !== previousdata) {
                                previousdata = msgString;
                                node.send(msg);
                            }
                        }
                    });
                }
            });
        });

        this.on("close", function() {
            if (this.interval_id !== null) {
                clearInterval(this.interval_id);
            }
        });

        node.emit("input",{});
    }

    function DarkSkyQueryNode(n) {
        RED.nodes.createNode(this,n);
        this.units = n.units || "us";
        this.lang = n.lang || "en";
        var node = this;

        this.on ('input', function(msg) {
            var date;
            var time;
            var lat;
            var lon;

            if (n.lat && n.lon) {
                if (90 >= n.lat && 180 >= n.lon && n.lat >= -90 && n.lon >= -180) {
                    lat = n.lat;
                    lon = n.lon;
                } else {
                    node.error(RED._("darksky.error.settings-invalid-lat_lon"));
                    return;
                }
            } else if (msg.location) {
                //query node code to check the input for information.
                if (msg.location.lat && msg.location.lon) {
                    if (90 >= msg.location.lat && 180 >= msg.location.lon && msg.location.lat >= -90 && msg.location.lon >= -180) {
                        lat = msg.location.lat;
                        lon = msg.location.lon;
                    } else {
                        node.error(RED._("darksky.error.msg-invalid-lat_lon"));
                        return;
                    }
                }
            }

            //the date string is in the format YYYY-MM-DD
            //the time string is in the format HH:MM
            if (n.date && n.time) {
                date = n.date;
                time = n.time;
            }
            else if (msg.time && (n.mode === "message")) {
                if (!isNaN(parseInt(msg.time)) && (parseInt(msg.time) !== 0)) {
                    var epoch = new Date(parseInt(msg.time));
                    date = epoch.toISOString().substring(0,10);
                    time = epoch.toISOString().substring(11,16);
                }
                else {
                    if (msg.time.toISOstring) {
                        date = msg.time.toISOString().substring(0,10);
                        time = msg.time.toISOString().substring(11,16);
                    }
                    else { date = null; time = null;}
                }
            }
            else { date = null; time = null;}

            assignmentFunction(node, date, time, lat, lon, RED.nodes.getNode(n.darksky), function(err) {
                if (err) {
                    node.error(err,msg);
                } else {
                    weatherPoll(node, msg, function(err) {
                        if (err) {
                            node.error(err,msg);
                        } else {
                            node.send(msg);
                        }
                    });
                }
            });
        });
    }

    function DarkSkyCredentials(n) {
        RED.nodes.createNode(this,n);
        this.key_identifier = n.key_identifier;
    }

    RED.nodes.registerType("darksky-credentials",DarkSkyCredentials,{
        credentials: {
            key_identifier: {type:"text"},
            client_key: {type:"password"}
        }
    });
    RED.nodes.registerType("darksky",DarkSkyQueryNode);
    RED.nodes.registerType("darksky in",DarkSkyInputNode);
};
