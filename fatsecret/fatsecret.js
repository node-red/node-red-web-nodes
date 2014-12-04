module.exports = function(RED) {
    "use strict";
    var http = require("http");
    var crypto = require("crypto");

    function generateSignatureString(parameterObject, secretObject, url, callback){
        parameterObject.oauth_signature_method = "HMAC-SHA1";
        parameterObject.oauth_timestamp = new Date().getTime();
        parameterObject.oauth_nonce = crypto.randomBytes(18).toString('base64').replace(/\//g, '-').replace(/\+/g, '_');
        parameterObject.oauth_version = "1.0";

        var propertiesList = [];

        for(var key in parameterObject){
            if(parameterObject.hasOwnProperty(key)){
                propertiesList[propertiesList.length] = [key, parameterObject[key]];
            }
        }

        propertiesList.sort(function(a, b) {
            if (a[0] === b[0]) {
                return 0;
            }
            else {
                return (a[0] < b[0]) ? -1 : 1;
            }
        });

        var urlComponent = "";

        for(var i=0; i<propertiesList.length; i++){
            if(i>0){
                urlComponent = urlComponent + "&";
            }
            urlComponent = urlComponent + propertiesList[i][0] + "=" + propertiesList[i][1];
        }

        var urlEncoded = encodeURIComponent(url);
        var urlComponentEncoded = encodeURIComponent(urlComponent);
        var signatureKey;

        var signatureBaseString = "GET&" + urlEncoded + "&" + urlComponentEncoded;
        if(secretObject){
            signatureKey = secretObject.oauth_consumer_secret + "&" + (secretObject.oauth_access_secret || "");
        }

        var shasum = crypto.createHmac('sha1', signatureKey);
        shasum.update(signatureBaseString);
        var oauth_signature = encodeURIComponent(shasum.digest('base64'));
        var completedUrl = url + "?" + urlComponent + "&oauth_signature=" + oauth_signature;

        callback(completedUrl);
    }

    function getOauthTokens(key, secret, callback){
        var sigObject = {};
        var secretObject = {};
        sigObject.oauth_consumer_key = key;//"67209d50b61c4027aa08179e01f29bb4";
        secretObject.oauth_consumer_secret = secret; //"d4a5054fd17b4888a8eade385b628924";
        secretObject.oauth_access_secret = "";
        sigObject.oauth_callback = "oob";
        var urlStart = "http://www.fatsecret.com/oauth/request_token";

        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    var tokenstart = response.indexOf("oauth_token=")+12;
                    var secretstart = response.indexOf("oauth_token_secret=")+19;

                    if(tokenstart > 11 && secretstart >18){ //-1 offset for the added numbers
                        var oauth_token = response.substring(tokenstart, tokenstart+32);
                        var oauth_token_secret = response.substring(secretstart, secretstart+32);
                        var token_obj = {oauth_token:oauth_token, oauth_token_secret:oauth_token_secret};
                        callback(token_obj);
                    } else {
                        callback({error:response});
                    }
                    
                   
                });
            }).on('error', function(e) {
                  node.error(e);
            });
        });
    }

    function getAccessToken(key, secret, token, tokenSecret, verifier, callback){
        var sigObject = {};
        var secretObject = {};

        sigObject.oauth_consumer_key = key;
        secretObject.oauth_consumer_secret = secret;
        secretObject.oauth_access_secret = tokenSecret;
        sigObject.oauth_token = token;
        sigObject.oauth_verifier = verifier;

        var urlStart = "http://www.fatsecret.com/oauth/access_token";
        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    var tokenstart = response.indexOf("oauth_token=")+12;
                    var secretstart = response.indexOf("oauth_token_secret=")+19;
                    if(tokenstart > 11 && secretstart >18){ //-1 offset for the added numbers
                        var access_token = response.substring(tokenstart, tokenstart+32);
                        var access_secret = response.substring(secretstart, secretstart+32);
                        var access_obj = {access_token:access_token, access_secret:access_secret};
                        callback(access_obj);
                    } else {
                        callback({error:response});
                    }
                    
                });
            }).on('error', function(e) {
                  node.error(e);
                  callback();
            });
        });
    }

    function foodSearch(key, secret){
        var sigObject = {};
        var secretObject = {};

        sigObject.oauth_consumer_key = key;
        secretObject.oauth_consumer_secret = secret;
        secretObject.oauth_access_secret = "";

        sigObject.method = "foods.search";
        sigObject.search_expression = "Cheese";
        sigObject.max_results = 4;

        var urlStart = "http://platform.fatsecret.com/rest/server.api";
        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    console.log(response);
                });
            }).on('error', function(e) {
                  node.error(e);
                  callback();
            });
        });
    }

    function getFood(key, secret){
        var sigObject = {};
        var secretObject = {};

        sigObject.oauth_consumer_key = key;
        secretObject.oauth_consumer_secret = secret;
        
        sigObject.format = "json";

        sigObject.method = "food.get";
        sigObject.food_id = "1240";

        var urlStart = "http://platform.fatsecret.com/rest/server.api";
        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    console.log(response);
                });
            }).on('error', function(e) {
                  node.error(e);
                  callback();
            });
        });
    }

    function addFoodEntry(key, access_token, secret, access_secret){
        var sigObject = {};
        var secretObject = {};

        sigObject.oauth_consumer_key = key;
        secretObject.oauth_consumer_secret = secret;
        secretObject.oauth_access_secret = access_secret;
        sigObject.oauth_token = access_token;
        
        sigObject.format = "json";

        sigObject.method = "food_entry.create";
        sigObject.food_id = "1240";
        sigObject.food_entry_name = "Cheese";
        sigObject.serving_id = "2363";
        sigObject.number_of_units = "1";
        sigObject.meal = "lunch";

        var urlStart = "http://platform.fatsecret.com/rest/server.api";
        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    console.log(response);
                });
            }).on('error', function(e) {
                  node.error(e);
                  callback();
            });
        });
    }

    function getFoodEntry(key, access_token, secret, access_secret, date, callback){
        var sigObject = {};
        var secretObject = {};

        sigObject.oauth_consumer_key = key;
        secretObject.oauth_consumer_secret = secret;
        secretObject.oauth_access_secret = access_secret;
        sigObject.oauth_token = access_token;
        
        sigObject.format = "json";

        sigObject.method = "food_entries.get";
        sigObject.date = date;

        var urlStart = "http://platform.fatsecret.com/rest/server.api";

        generateSignatureString(sigObject, secretObject, urlStart, function(completedUrl){
            http.get(completedUrl, function(res) {
                var response = "";

                res.on('data', function(d) {
                    response += d; 
                });
                
                res.on('end', function() {
                    var jsun = JSON.parse(response);
                    callback(jsun);
                });
            }).on('error', function(e) {
                  node.error(e);
                  callback();
            });
        });
    }

    function FatSecret(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        this.on('input', function(msg) {
            console.log(n.mode);
            var fatsecretConfig = RED.nodes.getNode(n.fatsecret);
            if(fatsecretConfig){
                var key = fatsecretConfig.credentials.consumer_key;
                var secret = fatsecretConfig.credentials.consumer_secret;
                var access_token = fatsecretConfig.credentials.access_token;
                var access_secret = fatsecretConfig.credentials.access_secret;
                var date;
                var calculatedDate;
                var today = new Date();

                if(n.date && n.mode == "date"){
                    date = Date.parse(n.date.replace(/-/g,"/"));
                } else if (n.mode == "message"){
                    if(msg.time){
                        date = msg.time.getTime();
                    } else {
                        node.error("No msg.time present in the input.");
                    }
                } else if(n.mode == "today"){
                    date = today.getTime();
                } else if(n.mode == "yesterday"){
                    date = (today.getTime())-86400000;
                } else {
                    node.error("Missing mode entry"); //Shouldn't ever be reached
                }

                if(date){
                    calculatedDate = Math.floor((((date/1000)/60)/60)/24); //API requires the amount of days since 1970 rather than ms

                    console.log(calculatedDate);
                    getFoodEntry(key, access_token, secret, access_secret, calculatedDate, function(result){
                        if(result.food_entries === null){
                            node.warn("No food diary found for the specified date.");
                            node.send(msg);
                        } else {
                            msg.data = result;
                            var foodlist = { "Breakfast": [], "Lunch": [], "Dinner": [], "Other":[]};
                            for(var i=0; i<result.food_entries.food_entry.length; i++){
                                console.log("it");
                                var currentfood = result.food_entries.food_entry[i];
                                var meal = currentfood.meal;
                                if(meal === "Breakfast"){
                                    foodlist.Breakfast.push({"food": currentfood.food_entry_name, "calories": currentfood.calories, "servingid" : currentfood.serving_id, "amount" : currentfood.number_of_units});
                                } else if(meal === "Lunch") {
                                    foodlist.Lunch.push({"food": currentfood.food_entry_name, "calories": currentfood.calories, "servingid" : currentfood.serving_id, "amount" : currentfood.number_of_units});
                                } else if(meal === "Dinner") {
                                    foodlist.Dinner.push({"food": currentfood.food_entry_name, "calories": currentfood.calories, "servingid" : currentfood.serving_id, "amount" : currentfood.number_of_units});
                                } else if(meal === "Other") {
                                    foodlist.Other.push({"food": currentfood.food_entry_name, "calories": currentfood.calories, "servingid" : currentfood.serving_id, "amount" : currentfood.number_of_units});
                                }
                            }
                            msg.payload = foodlist;
                            node.send(msg);
                        }
                    });
                } else {
                    node.send(msg);
                }
            } else {
                node.error("Missing fatsecret credentials.");
                node.send(msg);
            }
        });
    }

    //This node requires the access to credentials before it can be taken any further. currently is inactive.
    // function FatSecretOut(n) {
    //     RED.nodes.createNode(this, n);
    //     var node = this;
    //     var fatsecretConfig = RED.nodes.getNode(n.fatsecret);
    //     if(fatsecretConfig){
    //         var key = fatsecretConfig.credentials.consumer_key;
    //         var secret = fatsecretConfig.credentials.consumer_secret;
    //         var access_token = fatsecretConfig.credentials.access_token;
    //         var access_secret = fatsecretConfig.credentials.access_secret;
    //     }

    //     this.on('input', function(msg) {
    //         //foodSearch(key, secret);
    //         var food = node.food;
    //         addFoodEntry(key, access_token, secret, access_secret, food);
    //     });
    // }

    function FatSecretCredentials(n) {
        RED.nodes.createNode(this,n);
        this.key_identifier = n.key_identifier;
    }

    RED.httpAdmin.get('/fatsecret-credentials/validate', function(req, res) {
        var consumer_key = req.query.consumer_key;
        var request_token = req.query.request_token;
        var request_verifier = req.query.request_verifier;
        var consumer_secret = req.query.consumer_secret;
        var token_secret = req.query.token_secret;
        var node_id = req.query.id;
        console.log(req.query);

        getAccessToken(consumer_key, consumer_secret, request_token, token_secret, request_verifier, function(access_obj){
            var credentials = RED.nodes.getCredentials(node_id) || {};
            credentials.key_identifier = req.query.key_identifier;
            credentials.access_token = access_obj.access_token;
            credentials.access_secret = access_obj.access_secret;
            credentials.consumer_key = req.query.consumer_key;
            credentials.consumer_secret = req.query.consumer_secret;
            RED.nodes.addCredentials(node_id,credentials);
            res.send(access_obj);
        });
    });

    RED.httpAdmin.get('/fatsecret-credentials/auth', function(req, res) {
        var oauth_consumer_key = req.query.consumer_key;
        var oauth_consumer_secret = req.query.consumer_secret;

        getOauthTokens(oauth_consumer_key, oauth_consumer_secret, function(token_obj){
            res.send(token_obj);
        });
    });

    RED.httpAdmin.get('/fatsecret/food', function(req, res) {
        var id = req.query.id;
        var food = req.query.food;
        var key = req.query.key;
        var secret = req.query.secret;
        var node = RED.nodes.getNode(id);
        var credentials = RED.nodes.getCredentials(id);

        console.log(node);
        if(key && secret){
            foodSearch(key, secret, function() {
                res.send();
            });
        }
    });

    RED.nodes.registerType("fatsecret-credentials",FatSecretCredentials,{
        credentials: {
            key_identifier: {type:"text"},
            access_token: {type:"text"},
            access_secret: {type:"text"},
            consumer_key: {value: ""},
            consumer_secret: {value: ""}
        }
    });

    RED.nodes.registerType("fatsecret",FatSecret);
    //RED.nodes.registerType("fatsecret out",FatSecretOut); - Cannot currently be used.
};