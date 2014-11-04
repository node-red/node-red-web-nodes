module.exports = function(RED) {
    "use strict";
    var http = require("http");
    
    function weatherPoll(node, n, msg, callback) {
        var url;
        var lat;
        var lon;
        var city;
        var country;
        
        if (n.country){
            country = n.country;
        } else if(msg.location){
            if(msg.location.country){
                country = msg.location.country;
            }
        }
        
        if (n.city) {
            city = n.city;
        } else if(msg.location){
            if(msg.location.city){
                city = msg.location.city;
            }
        }
        
        if(!country || !city){
            if (n.lat) {
                lat = n.lat;
            } else if(msg.location){
                if(msg.location.lat){
                    if(90 >= msg.location.lat && msg.location.lat >= -90){
                        lat = msg.location.lat;
                    } else {
                        node.error("Invalid lat in msg.location");
                    }
                }
            }
            
            if(n.lon){
                lon = n.lon;
            } else if(msg.location){
                if(msg.location.lon){
                    if(180 >= msg.location.lon && msg.location.lon >= -180){
                        lon = msg.location.lon;
                    } else {
                        node.error("Invalid lon in msg.location");
                    }
                } 
            }
        }
        
        //if there is data in the message input, it overwrites the node setting values.
        //If the data is erroneous or not there, the values remain the node settings.
        
        //wipe clear the payload if it exists, or create it if it doesn't
        msg.payload = {};
        msg.location = {};
        
        //If there is a value missing, the URL is not initialised.
        if (lat && lon){
            url = "http://api.openweathermap.org/data/2.5/weather?lat=" + lat + "&lon=" + lon;
        } else if (city && country) {
            url = "http://api.openweathermap.org/data/2.5/weather?q=" + city + "," + country;
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
                    var jsun = JSON.parse(weather);
                    if(jsun.weather){
                        msg.data = jsun;
                        msg.payload.weather = jsun.weather[0].main;
                        msg.payload.detail = jsun.weather[0].description;
                        msg.payload.tempk = jsun.main.temp;
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
                       
                        msg.payload.description = ("The weather in " + jsun.name + " at coordinates: " + jsun.coord.lat + ", " + jsun.coord.lon + " is " + jsun.weather[0].main + " (" + jsun.weather[0].description + ")." );
                        callback();
                    } else {
                        if (jsun.message === "Error: Not found city"){                       
                            node.error("Invalid city/country")
                        } else {
                            node.error(jsun.cod + " " + jsun.message);
                        }
                    }
                });
            }).on('error', function(e) {
                  node.error(e);
            });
        } else {
            node.error("Invalid location information provided");
        }
    }
    
    function OpenWeatherMapInputNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.repeat = 300000;
        this.interval_id = null;
        var previousdata = null;
        
        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );
        
        this.on('input', function(msg) {    
            weatherPoll(node, n, msg, function(){
                var msgString = JSON.stringify(msg);
                if(msgString !== previousdata){
                    previousdata = msgString;       
                    node.send(msg);                 
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
        
    function OpenWeatherMapQueryNode(n) {
        RED.nodes.createNode(this,n);
        var node = this;
        
        this.on ('input', function(msg) {
            weatherPoll(node, n, msg, function(){
                node.send(msg);
            }); 
        });
    }
    
RED.nodes.registerType("openweathermap",OpenWeatherMapQueryNode);  
RED.nodes.registerType("openweathermap in",OpenWeatherMapInputNode);

};
