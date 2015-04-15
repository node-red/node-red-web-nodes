/**
 * Copyright 2014,2015 IBM Corp.
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
    var Wunderground = require('wundergroundnode');

    function assignmentFunction(node, msg, lat, lon, city, country, callback){
        if (country && city){
            node.country = country;
            node.city = city;
        } else if (lat && lon) {
            if (90 >= lat && lat >= -90) {
                node.lat = lat;
            } else {
                node.error("Invalid lat provided",msg);
                return;
            }

            if (180 >= lon && lon >= -180) {
                node.lon = lon;
            } else {
                node.error("Invalid lon provided",msg);
                return;
            }
        }
        callback();
    }

    function weatherPoll(node, msg, callback) {
        //wipe clear the payload if it exists, or create it if it doesn't
        msg.payload = {};
        msg.location = {};

        if (node.lat && node.lon){
            node.wunder.conditions().forecast().request(node.lat+","+node.lon, function(err, response){
                if (err) { callback(err); }
                else { handleResponse(response); }
            });
        } else if (node.city && node.country) {
            node.wunder.conditions().forecast().request(node.city+","+node.country, function(err, response){
                if (err) { callback(err); }
                else { handleResponse(response); }
            });
        }

        var handleResponse = function(res) {
            if (res.response.hasOwnProperty("error")) {
                console.log(res.response.error);
                callback(res.response.error);
            }
            else {
                var cur = res.current_observation;
                var loc = cur.display_location;
                msg.data = res;
                msg.payload.weather = cur.weather;
                msg.payload.tempk = Number(cur.temp_c) + 273.2;
                msg.payload.humidity = cur.relative_humidity;
                msg.payload.tempc = cur.temp_c;
                msg.payload.windspeed = cur.wind_kph;
                msg.payload.winddirection = cur.wind_degrees;
                msg.payload.location = cur.observation_location.full;
                msg.location.lon = Number(loc.longitude);
                msg.location.lat = Number(loc.latitude);
                msg.location.city = loc.city;
                msg.location.country = loc.country;
                msg.time = new Date(Number(cur.observation_epoch*1000));
                msg.title = "Data supplied by The Weather Underground.";
                msg.description = "Current weather information at coordinates: " + msg.location.lat + ", " + msg.location.lon;
                msg.payload.description = ("The weather in " + msg.location.city + " at coordinates: " + msg.location.lat + ", " + msg.location.lon + " is " +  cur.weather);
                var fcast = res.forecast.txt_forecast.forecastday[0];
                msg.payload.forecast = loc.city+" : "+fcast.title+" : "+ fcast.fcttext_metric;
                callback(null);
            }
        };
    }

    function WunderInputNode(n) {
        RED.nodes.createNode(this, n);
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("apikey"))) { this.apikey = credentials.apikey; }
        else { this.error("No Wunderground API key set"); }
        this.wunder = new Wunderground(this.apikey);
        this.repeat = 300000;
        this.interval_id = null;
        var node = this;
        var previousdata = null;
        var city;
        var country;
        var lat;
        var lon;

        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );

        this.on('input', function(msg) {
            if (n.country && n.city){
                country = n.country;
                city = n.city;
            } else if(n.lat && n.lon) {
                lat = n.lat;
                lon = n.lon;
            }
            assignmentFunction(node, msg, lat, lon, city, country, function() {
                weatherPoll(node, msg, function(err){
                    if (err) {
                        node.error(err,msg);
                    } else {
                        var msgString = JSON.stringify(msg);
                        if(msgString !== previousdata){
                            previousdata = msgString;
                            node.send(msg);
                        }
                    }
                });
            });
        });

        this.on("close", function() {
            if (this.interval_id !== null) {
                clearInterval(this.interval_id);
            }
        });

        this.interval_id = setTimeout( function() {
            node.emit("input",{});
        },2000); // start after 2 sec delay
    }

    function WunderNode(n) {
        RED.nodes.createNode(this,n);
        var credentials = this.credentials;
        if ((credentials) && (credentials.hasOwnProperty("apikey"))) { this.apikey = credentials.apikey; }
        else { this.error("No Wunderground API key set"); }
        this.wunder = new Wunderground(this.apikey);
        var node = this;
        var city;
        var country;
        var lat;
        var lon;

        this.on ('input', function(msg) {
            if (n.country && n.city){
                country = n.country;
                city = n.city;
            } else if (n.lat && n.lon) {
                lat = n.lat;
                lon = n.lon;
            } else if (msg.location){
                if(msg.location.lat && msg.location.lon){
                    lat = msg.location.lat;
                    lon = msg.location.lon;
                } else if (msg.location.city && msg.location.country) {
                    city = msg.location.city;
                    country = msg.location.country;
                }
            }
            assignmentFunction(node, msg, lat, lon, city, country, function() {
                weatherPoll(node, msg, function(err){
                    if (err) {
                        node.error(err,msg);
                    } else {
                        node.send(msg);
                    }
                });
            });
        });
    }

RED.nodes.registerType("wunderground",WunderNode, {
        credentials: { apikey: {type: "password"} }
    });
RED.nodes.registerType("wunderground in",WunderInputNode, {
        credentials: { apikey: {type: "password"} }
    });

};
