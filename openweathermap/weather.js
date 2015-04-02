/**
 * Copyright 2014 IBM Corp.
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
    var http = require("http");

    function assignmentFunction(node, msg, lat, lon, city, country, callback){
        if (country && city){
            node.country = country;
            node.city = city;
        } else if(lat && lon) {
            if(90 >= lat && lat >= -90){
                node.lat = lat;
            } else {
                node.error("Invalid lat provided",msg);
                return;
            }

            if(180 >= lon && lon >= -180){
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

        var url;
        //If there is a value missing, the URL is not initialised.
        if (node.lat && node.lon){
            url = "http://api.openweathermap.org/data/2.5/weather?lat=" + node.lat + "&lon=" + node.lon;
        } else if (node.city && node.country) {
            url = "http://api.openweathermap.org/data/2.5/weather?q=" + node.city + "," + node.country;
        }

        //If the URL is not initialised, there has been an error with the input data,
        //and a node.error is reported.
        if(url){
            http.get(url, function(res) {
                var weather = "";
                res.on('data', function(d) {
                    weather += d;
                });

                res.on('end', function() {
                    var jsun;
                    try {
                        jsun = JSON.parse(weather);
                    } catch (e) {
                        callback("The API has returned an invalid JSON");
                        return;
                    }
                    if(jsun){
                        if(jsun.weather){
                            msg.data = jsun;
                            msg.payload.weather = jsun.weather[0].main;
                            msg.payload.detail = jsun.weather[0].description;
                            msg.payload.tempk = jsun.main.temp;
                            msg.payload.tempc = Number(jsun.main.temp) - 273.2;
                            msg.payload.humidity = jsun.main.humidity;
                            msg.payload.maxtemp = jsun.main.temp_max;
                            msg.payload.mintemp = jsun.main.temp_min;
                            msg.payload.windspeed = jsun.wind.speed;
                            msg.payload.winddirection = jsun.wind.deg;
                            msg.payload.location = jsun.name;
                            msg.payload.sunrise = jsun.sys.sunrise;
                            msg.payload.sunset = jsun.sys.sunset;
                            msg.payload.clouds = jsun.clouds.all;
                            msg.location.lon = jsun.coord.lon;
                            msg.location.lat = jsun.coord.lat;
                            msg.location.city = jsun.name;
                            msg.location.country = jsun.sys.country;
                            msg.time = new Date(jsun.dt*1000);
                            msg.title = "Current Weather Information";
                            msg.description = "Current weather information at coordinates: " + msg.location.lat + ", " + msg.location.lon;

                            msg.payload.description = ("The weather in " + jsun.name + " at coordinates: " + jsun.coord.lat + ", " + jsun.coord.lon + " is " + jsun.weather[0].main + " (" + jsun.weather[0].description + ")." );
                            callback();
                        } else {
                            if (jsun.message === "Error: Not found city"){
                                callback("Invalid city/country");
                                return;
                            } else {
                                callback(jsun.cod + " " + jsun.message);
                                return;
                            }
                        }
                    }
                });
            }).on('error', function(e) {
                callback(e);
                return;
            });
        } else {
            callback("Invalid location information provided");
        }
    }

    function OpenWeatherMapInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.repeat = 300000;
        this.interval_id = null;
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

        node.emit("input",{});
    }

    function OpenWeatherMapQueryNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        var city;
        var country;
        var lat;
        var lon;

        this.on ('input', function(msg) {
            if (n.country && n.city){
                country = n.country;
                city = n.city;
            } else if(n.lat && n.lon) {
                lat = n.lat;
                lon = n.lon;
            } else if(msg.location){
                if(msg.location.lat && msg.location.lon){
                    lat = msg.location.lat;
                    lon = msg.location.lon;
                } else if(msg.location.city && msg.location.country) {
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

RED.nodes.registerType("openweathermap",OpenWeatherMapQueryNode);
RED.nodes.registerType("openweathermap in",OpenWeatherMapInputNode);

};
