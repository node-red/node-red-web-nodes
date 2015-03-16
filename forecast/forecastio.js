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
    var https = require("https");

    function assignmentFunction(node, date, time, lat, lon, forecastioConfig, callback){
        if (forecastioConfig && forecastioConfig.credentials && forecastioConfig.credentials.client_key) {
            node.apikey = forecastioConfig.credentials.client_key;
        } else {
            return callback("missing forecast.io credentials");
        }

        if(90 >= lat && 180 >= lon && lat >= -90 && lon >= -180){
            node.lat = lat;
            node.lon = lon;
        } else {
            return callback("Invalid lat/lon provided");
        }

        if(date && time){ 
            node.date = date;
            node.time = time;
            node.year = date.substring(0,4);
            node.month = date.substring(5,7);
            node.day = date.substring(8); //takes the substring from the 8th character to the end of the string
            node.hours = time.substring(0,2);
            node.minutes = time.substring(3);
        } else if (node.date){
            return callback("Invalid time provided");
        } else if (node.time){
            return callback("Invalid date provided");
        }
        callback();
    }
    
    function weatherPoll(node, msg, callback) {
        var url;
        var when;
        //If node settings are available, it prioritises these. If the node settings are missing, it checks the msg input instead.

        var today = new Date();
        if(today.getFullYear() - node.year > 60){
            node.warn("Date more than 60 years in the past. Results may be unreliable");
        } else if (today.getFullYear() - node.year < -10){
            node.warn("Date more than 10 years in the future. Results may be unreliable");
        }
        
        //wipe clear the msg properties if they exist, or create it if it doesn't
        msg.payload = {};
        msg.location = {};
        //If there is a value missing, the URL is not initialised.
        if (node.year && node.month && node.day && node.hours && node.minutes){
            url = ("https://api.forecast.io/forecast/" + node.apikey + "/" + node.lat + "," + node.lon + "," + node.year + "-" + node.month + "-" + node.day + "T" + node.hours + ":" + node.minutes + ":00");
            when = 0;
        } else if (node.lat && node.lon && node.apikey){
            url = ("https://api.forecast.io/forecast/" + node.apikey + "/" + node.lat + "," + node.lon);
            when = 1;
        } 
        //If the URL is not initialised, there has been an error with the input data,
        //and a node.error is reported.
        if(url){
            https.get(url, function(res) {
                var weather = "";
                            
                res.on('data', function(d) {
                    weather += d; 
                });
                      
                res.on('end', function() {
                    if(weather === "Forbidden"){
                        return callback("Incorrect API key provided");
                    } else {
                        var jsun = JSON.parse(weather);
                        msg.data = jsun;
                        msg.payload.weather = jsun.daily.data[when].icon;
                        msg.payload.detail = jsun.daily.data[when].summary;
                        msg.payload.humidity = jsun.daily.data[when].humidity;
                        msg.payload.maxtemp = jsun.daily.data[when].temperatureMax;
                        msg.payload.mintemp = jsun.daily.data[when].temperatureMin;
                        msg.payload.windspeed = jsun.daily.data[when].windSpeed;
                        msg.payload.winddirection = jsun.daily.data[when].windBearing;
                        msg.payload.lon = jsun.latitude;
                        msg.payload.lat = jsun.longitude;
                        msg.payload.clouds = jsun.daily.data[when].cloudCover;
                        msg.payload.precipitation = jsun.daily.data[when].precipProbability;
                        msg.payload.sunrise = jsun.daily.data[when].sunriseTime;
                        msg.payload.sunset = jsun.daily.data[when].sunsetTime;
                        msg.location.lat = jsun.latitude;
                        msg.location.lon = jsun.longitude;
                        msg.time = new Date(jsun.daily.data[when].time*1000);
                        msg.title = "Weather Forecast Information";
                        msg.description = "Weather forecast information for: " + msg.time.toLocaleString() + " at coordinates: " + msg.location.lat + ", " + msg.location.lon;
                        callback();
                    } 
                });
            }).on('error', function(e) {
                callback(e);
            });
        } else {
            callback("invalid url");
        }
    }

    function ForecastioInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.repeat = 900000;
        this.interval_id = null;
        var previousdata = null;
        
        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );
        
        this.on('input', function(msg) { 
            assignmentFunction(node, n.date, n.time, n.lat, n.lon, RED.nodes.getNode(n.forecastio), function(err){
                if (err) {
                    node.error(err,msg);
                } else {
                    weatherPoll(node, msg, function(err){
                        if (err) {
                            node.error(err,msg);
                        } else {
                            var msgString = JSON.stringify(msg.payload);
                            if(msgString !== previousdata){
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
        
    function ForecastioQueryNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;

        this.on ('input', function(msg) {
            var date;
            var time;
            var lat;
            var lon;

            if(n.lat && n.lon){
                if(90 >= n.lat && 180 >= n.lon && n.lat >= -90 && n.lon >= -180){
                    lat = n.lat;
                    lon = n.lon;
                } else {
                    node.error("Invalid lat/lon in node settings");
                    return;
                }
            } else if(msg.location){
                //query node code to check the input for information.
                if (msg.location.lat && msg.location.lon){
                    if(90 >= msg.location.lat && 180 >= msg.location.lon && msg.location.lat >= -90 && msg.location.lon >= -180){
                        lat = msg.location.lat;
                        lon = msg.location.lon;
                    } else {
                        node.error("Invalid lat/lon in msg.location");
                        return;
                    }
                }
            } 
            
            //the date string is in the format YYYY-MM-DD
            //the time string is in the format HH:MM
            if(n.date && n.time){
                date = n.date;
                time = n.time;
            } else if (msg.time && n.mode === "message"){
                date = msg.time.toISOString().substring(0,10);
                time = msg.time.toISOString().substring(11,16);
            }

            assignmentFunction(node, date, time, lat, lon, RED.nodes.getNode(n.forecastio), function(err){
                if (err) {
                    node.error(err,msg);
                } else {
                    weatherPoll(node, msg, function(err){
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

    function ForecastioCredentials(n) {
        RED.nodes.createNode(this,n);
        this.key_identifier = n.key_identifier;
    }
    
    RED.nodes.registerType("forecastio-credentials",ForecastioCredentials,{
        credentials: {
            key_identifier: {type:"text"},
            client_key: {type:"password"}
        }       
    });
    RED.nodes.registerType("forecastio",ForecastioQueryNode);  
    RED.nodes.registerType("forecastio in",ForecastioInputNode);

};
