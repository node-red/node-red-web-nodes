/**
 * Copyright 2014,2020 IBM Corp.
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
    var request = require("request");

    function assignmentFunction(node, msg, lat, lon, city, country, language, callback) {
        if (country && city) {
            node.country = country;
            node.city = city;
        }
        else if (lat && lon) {
            if (90 >= lat && lat >= -90) {
                node.lat = lat;
            } else {
                node.error(RED._("weather.error.invalid-lat"),msg);
                return;
            }
            if (180 >= lon && lon >= -180) {
                node.lon = lon;
            } else {
                node.error(RED._("weather.error.invalid-lon"),msg);
                return;
            }
        }
        node.language = language || "en";
        callback();
    }

    function weatherPoll(node, msg, callback) {
        //wipe clear the payload if it exists, or create it if it doesn't
        msg.payload = {};
        msg.location = {};

        var url;
        if (node.hasOwnProperty("credentials") && node.credentials.hasOwnProperty("apikey")) {
            //If there is a value missing, the URL is not initialised.
            if (node.wtype === "forecast") {
                if (node.lat && node.lon) {
                    url = "http://api.openweathermap.org/data/2.5/forecast?lang=" + node.language + "&cnt=40&units=metric&lat=" + node.lat + "&lon=" + node.lon + "&APPID=" + node.credentials.apikey;
                } else if (node.city && node.country) {
                    url = "http://api.openweathermap.org/data/2.5/forecast?lang=" + node.language + "&cnt=40&units=metric&q=" + node.city + "," + node.country + "&APPID=" + node.credentials.apikey;
                }
            } else if (node.wtype === "current") {
                if (node.lat && node.lon) {
                    url = "http://api.openweathermap.org/data/2.5/weather?lang=" + node.language + "&lat=" + node.lat + "&lon=" + node.lon + "&APPID=" + node.credentials.apikey;
                } else if (node.city && node.country) {
                    url = "http://api.openweathermap.org/data/2.5/weather?lang=" + node.language + "&q=" + node.city + "," + node.country + "&APPID=" + node.credentials.apikey;
                }
            } else if (node.wtype === "onecall") {
                if (node.lat && node.lon) {
                    url = "https://api.openweathermap.org/data/3.0/onecall?lang=" + node.language + "&lat=" + node.lat + "&lon=" + node.lon + "&units=metric&APPID=" + node.credentials.apikey;
                }
            }

            //If the URL is not initialised, there has been an error with the input data,
            //and a node.error is reported.
            if (url) {
                node.status({fill:"blue",shape:"dot",text:"weather.status.requesting"});
                request.get(url, function(error, result, data) {
                    if (error) {
                        callback(error);
                        return;
                    }
                    var weather = data;
                    var jsun;
                    if (weather.indexOf("Invalid API key") > -1) {
                        callback(RED._("weather.error.invalid-key"));
                        return;
                    }
                    try {
                        jsun = JSON.parse(weather);
                    } catch (e) {
                        callback(RED._("weather.error.invalid-json"));
                        return;
                    }
                    if (jsun) {
                        msg.data = jsun;
                        if (jsun.hasOwnProperty("weather") && jsun.hasOwnProperty("main")) {
                            msg.payload.id = jsun.weather[0].id;
                            msg.payload.weather = jsun.weather[0].main;
                            msg.payload.detail = jsun.weather[0].description;
                            msg.payload.icon = jsun.weather[0].icon;
                            msg.payload.tempk = jsun.main.temp;
                            if (jsun.main.hasOwnProperty("temp")) { msg.payload.tempc = parseInt(10 * (Number(jsun.main.temp) - 273.15))/10; }
                            if (jsun.main.hasOwnProperty("temp_max")) { msg.payload.temp_maxc = parseInt(10 * (Number(jsun.main.temp_max) - 273.15))/10; }
                            if (jsun.main.hasOwnProperty("temp_min")) { msg.payload.temp_minc = parseInt(10 * (Number(jsun.main.temp_min) - 273.15))/10; }
                            msg.payload.humidity = jsun.main.humidity;
                            msg.payload.pressure = jsun.main.pressure;
                            msg.payload.maxtemp = jsun.main.temp_max;
                            msg.payload.mintemp = jsun.main.temp_min;
                            msg.payload.windspeed = jsun.wind.speed;
                            msg.payload.winddirection = jsun.wind.deg;
                            msg.payload.location = jsun.name;
                            msg.payload.sunrise = jsun.sys.sunrise;
                            msg.payload.sunset = jsun.sys.sunset;
                            msg.payload.clouds = jsun.clouds.all;
                            if (jsun.hasOwnProperty("rain")) { msg.payload.rain = jsun.rain["1h"]; }
                            if (jsun.hasOwnProperty("coord")) {
                                msg.location.lon = jsun.coord.lon;
                                msg.location.lat = jsun.coord.lat;
                            }
                            msg.location.city = jsun.name;
                            msg.location.country = jsun.sys.country;
                            if (jsun.hasOwnProperty("dt")) { msg.time = new Date(jsun.dt*1000); }
                            msg.title = RED._("weather.message.title");
                            msg.description = RED._("weather.message.description", {lat: msg.location.lat, lon: msg.location.lon});
                            msg.payload.description = (RED._("weather.message.payload", {name: jsun.name, lat: jsun.coord.lat, lon: jsun.coord.lon, main: jsun.weather[0].main, description: jsun.weather[0].description}));
                            callback();
                        } else if (jsun.hasOwnProperty("list")) {
                            msg.payload = jsun.list;
                            if (jsun.hasOwnProperty("city")) {
                                msg.location.city = jsun.city.name;
                                msg.location.country = jsun.city.country;
                                if (jsun.city.hasOwnProperty("coord")) {
                                    msg.location.lat = jsun.city.coord.lat;
                                    msg.location.lon = jsun.city.coord.lon;
                                }
                            }
                            msg.title = RED._("weather.message.forecast");
                            callback();
                        } else if(jsun.hasOwnProperty("current") && jsun.hasOwnProperty("hourly") && jsun.hasOwnProperty("daily")) {
                            msg.payload.current = jsun.current;
                            msg.payload.hourly = jsun.hourly;
                            msg.payload.daily = jsun.daily;
                            if(jsun.hasOwnProperty('minutely')) {
                                msg.payload.minutely = jsun.minutely;
                            }
                            msg.location.lat = jsun.lat;
                            msg.location.lon = jsun.lon;
                            callback();
                        } else {
                            if (jsun.message === "Error: Not found city") {
                                callback(RED._("weather.error.invalid-city_country"));
                                return;
                            } else {
                                callback(jsun.cod + " " + jsun.message);
                                return;
                            }
                        }
                    }
                });
                node.status({});
            } else {
                callback(RED._("weather.error.invalid-location"));
            }
        } else {
            node.error(RED._("weather.error.no-api-key"),msg);
        }
    }

    function OpenWeatherMapInputNode(n) {
        RED.nodes.createNode(this, n);
        this.wtype = n.wtype || "current";
        this.repeat = 600000;  // every 10 minutes
        this.interval_id = null;
        var node = this;
        var previousdata = null;
        var city;
        var country;
        var language;
        var lat;
        var lon;
        if ((!node.credentials) || (!node.credentials.hasOwnProperty("apikey"))) { node.error(RED._("weather.error.no-api-key")); }

        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );

        this.on('input', function(msg) {
            if (n.country && n.city) {
                country = n.country;
                city = n.city;
            } else if (n.lat && n.lon) {
                lat = n.lat;
                lon = n.lon;
            }
            language = n.language || "en";
            if (language === "msg") {
                language = msg.language || "en";
            }
            assignmentFunction(node, msg, lat, lon, city, country, language, function() {
                weatherPoll(node, msg, function(err) {
                    if (err) {
                        node.error(err,msg);
                    } else {
                        var msgString = JSON.stringify(msg);
                        if (msgString !== previousdata) {
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
        this.wtype = n.wtype || "current";
        var node = this;
        var city;
        var country;
        var language;
        var lat;
        var lon;
        if ((!node.credentials) || (!node.credentials.hasOwnProperty("apikey"))) { node.error(RED._("weather.error.no-api-key")); }

        this.on('input', function(msg) {
            if (n.country && n.city) {
                country = n.country;
                city = n.city;
            } else if (n.lat && n.lon) {
                lat = n.lat;
                lon = n.lon;
            } else if (msg.location) {
                if (msg.location.lat && msg.location.lon) {
                    lat = msg.location.lat;
                    lon = msg.location.lon;
                } else if (msg.location.city && msg.location.country) {
                    city = msg.location.city;
                    country = msg.location.country;
                }
            }
            language = n.language || "en";
            if (language === "msg") {
                language = msg.language || "en";
            }
            assignmentFunction(node, msg, lat, lon, city, country, language, function() {
                weatherPoll(node, msg, function(err) {
                    if (err) {
                        node.error(err,msg);
                    } else {
                        node.send(msg);
                    }
                });
            });
        });
    }

    RED.nodes.registerType("openweathermap",OpenWeatherMapQueryNode,{
        credentials: {
            apikey: {type:"password"}
        }
    });

    RED.nodes.registerType("openweathermap in",OpenWeatherMapInputNode,{
        credentials: {
            apikey: {type:"password"}
        }
    });
};
