/*
  Copyright 2014 IBM Corp.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/
module.exports = function(RED) {
    "use strict";
    var xml2js = require('xml2js');
    var http = require("http");
    var dataJSON;
    var STATIONS_TO_RETURN = 10; //the number of nearest stations to be returned by a lat/lon request only.
    var TIME_BETWEEN_REQUESTS = 300000; //the time in ms between requests to the server from the input node.

    //function to pull the data from the API. Reformats it into a JSON which can more easily be used.
    function pullData(callback){
        var data = "";
        http.get("http://www.tfl.gov.uk/tfl/syndication/feeds/cycle-hire/livecyclehireupdates.xml", function(res) {
            res.on('data', function (chunk) {
                data+= chunk;
            });
            res.on('end', function() {
                if(res.statusCode == 200){
                    xml2js.parseString(data, function (err, result) {
                        dataJSON = JSON.parse(JSON.stringify(result));
                        callback();
                    });
                } else {
                    dataJSON = {statuscode: res.statusCode};
                    console.log(res);
                    callback();
                }
            });
        }).on('error', function(e) {
            dataJSON = {error: e};
            console.log(e);
            callback();
        });
    }

     //Accepts a station or array of stations and formats them to be output.
    function stationFormat(station, callback){
        var response;
        if(Array.isArray(station)){
            response = [];
            for(var i=0; i<station.length; i++){
                var responseObject = {};
                responseObject.stationid = station[i].id[0];
                responseObject.area = station[i].name[0];
                responseObject.lat = station[i].lat[0];
                responseObject.lon = station[i].long[0];
                if(station[i].locked[0] === "false"){
                    responseObject.locked = false;
                } else if (station[i].locked[0] === "true"){
                    responseObject.locked = true;
                }
                responseObject.bikes = Number(station[i].nbBikes[0]);
                responseObject.spaces = Number(station[i].nbEmptyDocks[0]);
                response.push(responseObject);
            }
        } else {
            response = {};
            response.stationid = station.id[0];
            response.area = station.name[0];
            response.lat = station.lat[0];
            response.lon = station.long[0];
            if(station.locked[0] === "false"){
                response.locked = false;
            } else if (station.locked[0] === "true"){
                response.locked = true;
            }
            response.bikes = Number(station.nbBikes[0]);
            response.spaces = Number(station.nbEmptyDocks[0]);
        }
        callback(response);
    }
    //uses a specific station ID to search the dataJSON and return a single station.
    function findId(id, callback){
        var response;
        for (var i=0 ; i < dataJSON.stations.station.length; i++) {
            if(dataJSON.stations.station[i].id[0] === id){
                response = dataJSON.stations.station[i];
                callback(response);
            }
        }
        if(!response){
            callback("ERROR");
        }
    }
    //Uses a specific station name to search the dataJSON and return a single station. If
    //no match is found, an ERROR string is returned instead.
    function findStation(station, callback){
        var response;
        for (var i=0 ; i < dataJSON.stations.station.length; i++) {
            if(dataJSON.stations.station[i].name[0] === station){
                response = dataJSON.stations.station[i];
                callback(response);
            }
        }
        if(!response){
            callback("ERROR");
        }
    }

    //Uses the dataJSON returned by the API and pullData function to select and return the nearest
    //amount stations to a set of provided coordinates in an array with ascending order of distance.
    //This amount is declared at the top of this class as the variable STATIONS_TO_RETURN.
    function findLocation(lat, lon, callback){
        var distances = [];
        var returns = [];
        for (var i=0 ; i < dataJSON.stations.station.length; i++) {
            var statLat = dataJSON.stations.station[i].lat[0];
            var statLon = dataJSON.stations.station[i].long[0];
            var diffLat = (statLat-lat);
            if(diffLat < 0){
                diffLat = -diffLat;
            }
            var diffLon = (statLon-lon);
            if(diffLon < 0){
                diffLon = -diffLon;
            }
            var dist = Math.sqrt(Math.pow(diffLat, 2) + Math.pow(diffLon, 2));//triangulate the coordinates accounting for ratio difference between lat/lon
            distances.push({distance: dist, data:dataJSON.stations.station[i]});
        }

        distances.sort(function(a,b) { 
            return a.distance - b.distance;
        });
        
        for(var j=0; j<STATIONS_TO_RETURN; j++){
            returns.push(distances[j].data);
        }

        callback(returns);
    }

    function processStation(node, msg, callback){
        findStation(node.station, function(response){
            if(response === "ERROR"){
                node.error("Invalid area provided. Please use one of the autocomplete suggestions.");
                callback();
            } else {
                stationFormat(response, function(formattedStation){
                    msg.payload = formattedStation;
                    msg.location.lat = msg.payload.lat;
                    msg.location.lon = msg.payload.lon;
                    msg.description = "Barclays Cycle Hire information for the station located in " + msg.payload.area;
                    msg.title = "Current Barclays Cycle Hire station information";
                    callback();
                });
            }
        });
    }

    function processStationID(node, msg, callback){
        findId(node.stationid, function(response){
            stationFormat(response, function(formattedStation){
                msg.payload = formattedStation;
                msg.location.lat = msg.payload.lat;
                msg.location.lon = msg.payload.lon;
                msg.description = "Barclays Cycle Hire information for the station located in " + msg.payload.area;
                msg.title = "Current Barclays Cycle Hire station information";
                callback();
            });
        });
    }

    function processCoordinates(node, msg, callback){
        if(180 >= node.lon && node.lon >= -180){
            if(90 >= node.lat && node.lat >= -90){
                findLocation(node.lat, node.lon, function(response){
                    stationFormat(response, function(formattedStation){
                        msg.payload = formattedStation;
                        msg.location.lat = node.lat;
                        msg.location.lon = node.lon;
                        msg.description = "Barclays Cycle Hire information for the " + STATIONS_TO_RETURN + " closest stations to coordinates: " + node.lat + ", " + node.lon;
                        msg.title = "Current Barclays Cycle Hire station information";
                        callback();
                    });
                });
            } else {
                node.error("Invalid latitude provided.");
                callback();
            }
        } else {
            node.error("Invalid longitude provided.");
            callback();
        }
    }

    function processHandler(node, msg, callback){
        msg.payload = {};
        msg.data = {};
        msg.location = {};
        msg.title = {};
        msg.description = {};

        if(node.station){
            processStation(node, msg, function(){
                callback();
            });
        } else if (node.stationid){
            processStationID(node, msg, function(){
                callback();
            });
        } else if (node.lat && node.lon) {
            processCoordinates(node, msg, function(){
                callback();
            });
        } else {
            node.error("Invalid data provided.");
            callback();
        }
    }

    function CycleHire(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        this.on('input', function(msg) {
            if(n.station){
                node.station = n.station;
            } else {
                if(msg.payload && msg.payload.stationid){
                    node.stationid = msg.payload.stationid;
                } else {
                    if(n.lat){
                        node.lat = n.lat;
                    } else if(msg.location && msg.location.lat) {
                        node.lat = msg.location.lat;
                    }

                    if(n.lon){
                        node.lon = n.lon;
                    } else if (msg.location && msg.location.lon) {
                        node.lon = msg.location.lon;
                    }
                }
            }

            if(!dataJSON){
                pullData(function(){
                    if(dataJSON.error){
                        node.error("Error connecting to the API: " + dataJSON.error);
                    } else {
                        processHandler(node, msg, function(){
                            node.send(msg);
                        });
                    }
                });
            } else {
                processHandler(node, msg, function(){
                    node.send(msg);
                });
            }
        });
    }

    function CycleHireInput(n){
        RED.nodes.createNode(this, n);
        var node = this;

        this.repeat = TIME_BETWEEN_REQUESTS;
        this.interval_id = null;
        var previousdata = null;
        
        this.interval_id = setInterval( function() {
            node.emit("input",{});
        }, this.repeat );
        
        this.on('input', function(msg) {
            if(n.station){
                node.station = n.station;
            } else {
                if(n.lat){
                    node.lat = n.lat;
                } 
                if(n.lon){
                    node.lon = n.lon;
                }
            }

            if(!dataJSON){
                pullData(function(){
                    if(dataJSON.error){
                        node.error("Error connecting to the API: " + dataJSON.error);
                    } else {
                        processHandler(node, msg, function(){
                            var msgString = JSON.stringify(msg.payload);
                            if(msgString !== previousdata){
                                previousdata = msgString;
                                node.send(msg);
                            }
                        });
                    }
                });
            } else {
                processHandler(node, msg, function(){
                    var msgString = JSON.stringify(msg.payload);
                    if(msgString !== previousdata){
                        previousdata = msgString;
                        node.send(msg);
                    }
                });
            }
        });
        
        this.on("close", function() {
            if (this.interval_id !== null) {
                clearInterval(this.interval_id);
            }
        });
        node.emit("input",{});
    }

    RED.httpAdmin.get('/cyclehire/data', function(req, res) {
        pullData( function() {
            res.send(dataJSON);
        });
        
    });

    RED.nodes.registerType("tfl cyclehire",CycleHire);
    RED.nodes.registerType("tfl cyclehire in",CycleHireInput);
};
