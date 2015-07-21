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
    var request = require('request');

    var apiEndpoint = "http://countdown.api.tfl.gov.uk/interfaces/ura/instant_V1?";

    function fetchStopsInRadius(lat, lon, radius, callback) {
      var fetchQuery = "Circle="+ lat + "," + lon + "," + radius + "&StopPointState=0";
      var returnList = "&ReturnList=StopCode1,StopPointName,Bearing,StopPointIndicator,StopPointType,Latitude,Towards";
      var requestString = apiEndpoint + fetchQuery + returnList;

      request(requestString, function (error, response, body) {
          if (!error && response.statusCode == 200) {
              var rawArray = body.split("\n");
              var stationsArray = [];
              for(var i = 1; i < rawArray.length; i++) {
                  stationsArray.push(JSON.parse(rawArray[i]));
              }
              callback(stationsArray);
          } else if(error) {
              callback(RED._("tfl-bus.error.error", {error: error}));
              console.log(error);
          } else if(response !== 200) {
              callback(response);
              console.log(response);
          }
      });
    }

    function fetchLinesForStop(stopCode1, callback) {
        var fetchQuery = "StopCode1="+ stopCode1;
        var returnList = "&ReturnList=StopCode2,StopPointName,LineName,DestinationText,EstimatedTime,ExpireTime,RegistrationNumber,VehicleID";
        var requestString = apiEndpoint + fetchQuery + returnList;

        request(requestString, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var rawArray = body.split("\n");
                var linesArray = [];
                var lineNoSet = {};
                for(var i = 1; i < rawArray.length; i++) {
                    var tempJsonObj = JSON.parse(rawArray[i]);
                    if (!lineNoSet[tempJsonObj[3]]) {
                        linesArray.push([tempJsonObj[3], tempJsonObj[4]]);
                    }
                    lineNoSet[tempJsonObj[3]] = true;
                }
                linesArray.sort();
                callback(linesArray);
            } else if(error) {
                callback(RED._("tfl-bus.error.error", {error: error}));
            } else if(response !== 200) {
                callback(response);
            }
        });
    }

    function fetchDataForStopAndLine(stopCode1, lineID, callback) {
        if(lineID == "NODEPARTURE") {
            callback(null,null);
            return;
        }
        var fetchQuery = "StopCode1="+ stopCode1 + "&LineID=" + lineID;
        var returnList = "&ReturnList=StopPointName,LineName,DestinationText,EstimatedTime,RegistrationNumber";
        var requestString = apiEndpoint + fetchQuery + returnList;

        request(requestString, function (error, response, body) {
            if (!error && response.statusCode == 200) {
                var rawArray = body.split("\n");
                var linesArray = [];
                for(var i = 1; i < rawArray.length; i++) {
                    var tempJsonObj = JSON.parse(rawArray[i]);
                    linesArray.push(tempJsonObj);
                }
                callback(null,linesArray);
            } else if(error) {
                callback(error,null);
            } else if(response !== 200) {
                callback(response,null);
            }
        });
    }

    function TflbusNode(n) {
        RED.nodes.createNode(this,n);

        var node = this;
        node.stopCode1 = n.stopCode1;
        node.lineID = n.lineID;
        node.lat = n.lat;
        node.lon = n.lon;
        node.radius = n.radius;

        if(!node.stopCode1 || !node.lineID || node.stopCode1 === "unset" || node.lineID === "unset") {
            node.error(RED._("tfl-bus.error.no-bus-stops"));
            return;
        }

        node.on("input", function(msg) {

            if(msg.location && msg.location.lat && msg.location.on && msg.location.radius) {
                //TODO implement bus stop finder? ==> To be done later
            }
            fetchDataForStopAndLine(node.stopCode1, node.lineID, function(err,departuresArray) {
                if(err) {
                    node.error(err,msg);
                    return;
                } else {
                    msg.payload = {};
                    if (departuresArray) {
                        // the node only considers the first bus arriving to the stop
                        var firstBusArrivingArray = departuresArray[0];
                        // [1] => from (StopPointName => this stop)
                        // [2] => LineID
                        // [3] => DestinationText
                        // [4] => RegistrationNumber
                        // [5] => EstimatedTime
                        msg.payload.StopPointName = firstBusArrivingArray[1];
                        msg.payload.LineID = firstBusArrivingArray[2];
                        msg.payload.DestinationText = firstBusArrivingArray[3];
                        msg.payload.RegistrationNumber = firstBusArrivingArray[4];
                        msg.payload.EstimatedTime = new Date(firstBusArrivingArray[5]);
                    }
                }
                if(!msg.location) {
                    msg.location = {};
                }
                msg.location.lat = node.lat;
                msg.location.lon = node.lon;
                msg.location.radius = node.radius;
                node.send(msg);
            });
        });

        node.on("close", function() {
            node.stopCode1 = null;
            node.lineID = null;
            node.lat = null;
            node.lon = null;
            node.radius = null;
            node.acceptedtcs = null;
        });
    }

    RED.httpAdmin.get('/tfl-bus/stopsquery', function(req, res) {
        var state = req.query;
        fetchStopsInRadius(state.lat, state.lon, state.radius, function(stops) {
            res.send(stops);
        });
    });

    RED.httpAdmin.get('/tfl-bus/linesquery', function(req, res) {
        var state = req.query;
        fetchLinesForStop(state.stopCode1, function(lines) {
            res.send(lines);
        });
    });

    RED.nodes.registerType("tfl bus",TflbusNode);
};
