/**
 * Copyright 2015 IBM Corp.
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
    var clone = require("clone");

    function GooglePlusNode(n) {
        RED.nodes.createNode(this,n);
        this.google = RED.nodes.getNode(n.google);
        
        var node = this;
        
        this.on('input', function(msg){
            var url, queryParams, headers, reqType, action, accessToken;
            reqType = n.reqType || msg.reqType;
            action = n.action || msg.action;
            var query = n.query || msg.query;
            var collection = n.collection || msg.collection;
            var userId = n.userId || msg.userId || 'me';
            var activityId = n.activityId || msg.activityId;
            var commentId = n.commentId || msg.commentId;
            var language = n.language || msg.language;
            var maxResults = n.maxResults || msg.maxResults;
            var pageToken = n.pageToken || msg.pageToken;
            var orderBy = n.orderBy || msg.orderBy;
            var sortOrder = n.sortOrder || msg.sortOrder;
            
            function processInput(){
                queryParams = {};
                headers = {
                    Authorization: 'Bearer ' + accessToken
                };
                
                if(reqType === 'comments'){
                    if(action === 'list'){
                        commentsListRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    } else{ //id request
                        commentsIdRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    }
                } else if (reqType === 'activities'){
                    if(action === 'search'){
                        activitiesSearchRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    } else if(action === 'list'){
                        activitiesListRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    } else{ //id request
                        activitiesIdRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    }
                } else{ //people request
                    if(action === 'search'){
                        peopleSearchRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    } else if(action === 'list'){
                        peopleListRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    } else{ //id request
                        peopleIdRequest(function(response){
                            if(response){
                                node.send(response);
                            }
                        });
                    }
                }
            }
            
            function peopleIdRequest(cb){
                url = 'https://www.googleapis.com/plus/v1/people/' + userId;
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handlePeopleIdResponse(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function peopleSearchRequest(cb){
                url = 'https://www.googleapis.com/plus/v1/people';
                if(!query){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-query")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                queryParams.query = query;
                if(language){
                    queryParams.language = language;
                }
                if(maxResults){
                    queryParams.maxResults = maxResults;
                }
                if(pageToken){
                    queryParams.pageToken = pageToken;
                }
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handlePeopleSearchResponse(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function peopleListRequest(cb){
                if(!collection){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-collection")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/people/' + userId + '/people' + '/' + collection;
                if(maxResults){
                    queryParams.maxResults = maxResults;
                }
                if(pageToken){
                    queryParams.pageToken = pageToken;
                }
                if(orderBy){
                    queryParams.orderBy = orderBy;
                }
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handlePeopleListResponse(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function activitiesIdRequest(cb){
                if(!activityId){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-activityid")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/activities/' + activityId;
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handleActivitiesIdRequest(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function activitiesSearchRequest(cb){
                if(!query){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-query")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/activities';
                queryParams.query = query;
                if(language){
                    queryParams.language = language;
                }
                if(maxResults){
                    queryParams.maxResults = maxResults;
                }
                if(pageToken){
                    queryParams.pageToken = pageToken;
                }
                if(orderBy){
                    queryParams.orderBy = orderBy;
                }
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handleActivitiesSearchRequest(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function activitiesListRequest(cb){
                if(!collection){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-collection")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/people/' + userId + '/activities/' + collection;
                if(maxResults){
                    queryParams.maxResults = maxResults;
                }
                if(pageToken){
                    queryParams.pageToken = pageToken;
                }
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handleActivitiesListRequest(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function commentsIdRequest(cb){
                if(!commentId){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-commentid")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/comments/' + commentId;
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handleCommentsIdRequest(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function commentsListRequest(cb){
                if(!activityId){
                    var error = {
                        code: 400,
                        status: 'MISSING_VALUES',
                        message: RED._("plus.error.no-activityid")
                    };
                    throwNodeError(error, msg);
                    return;
                }
                url = 'https://www.googleapis.com/plus/v1/activities/' + activityId + '/comments';
                if(maxResults){
                    queryParams.maxResults = maxResults;
                }
                if(pageToken){
                    queryParams.pageToken = pageToken;
                }
                if(sortOrder){
                    queryParams.sortOrder = sortOrder;
                }
                sendReqToGoogle(function(err, data){
                    if(err){
                        throwNodeError({
                            code: 500,
                            status: err,
                            message: err
                        }, msg);
                        return;
                    } else{
                        handleCommentsListRequest(JSON.parse(data), function(msg){
                            cb(msg);
                        });
                    }
                });
            }
            
            function handlePeopleIdResponse(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                        code: data.error.code,
                        status: data.error.errors[0].reason,
                        message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.displayName;
                    newMsg.description = data.displayName;
                    newMsg.data = data;
                    newMsg.userid = data.id;
                    newMsg.payload = {
                        displayName: data.displayName,
                        name: data.name,
                        gender: data.gender,
                        birthday: data.birthday,
                        nickname: data.nickname,
                        occupation: data.occupation,
                        skills: data.skills,
                        url: data.url,
                        aboutMe: data.aboutMe,
                        relationshipStatus: data.relationshipStatus,
                        urls: data.urls,
                        organizations: data.organizations,
                        placesLived: data.placesLived,
                        tagline: data.tagline,
                        emails: data.emails,
                        image: data.image.url,
                        isPlusUser: data.isPlusUser,
                        status: RED._("plus.message.ok")
                    };
                    cb(newMsg);
                }
                
            }
            
            function handlePeopleSearchResponse(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                            code: data.error.code,
                            status: data.error.errors[0].reason,
                            message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.description = data.items.length + ' results returned';
                    newMsg.data = data;
                    newMsg.payload = {
                        results: [],
                        nextPageToken: data.nextPageToken,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.nextPageToken = data.nextPageToken;
                    for(var i = 0; i < data.items.length; i++){
                        newMsg.payload.results.push({
                            id: data.items[i].id,
                            displayName: data.items[i].displayName,
                            url: data.items[i].url,
                            image: data.items[i].image.url
                        });
                    }
                    cb(newMsg);
                }
            }
            
            function handlePeopleListResponse(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                         code: data.error.code,
                           status: data.error.errors[0].reason,
                           message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.description = data.items.length + ' results returned';
                    newMsg.data = data;
                    newMsg.payload = {
                        results: [],
                        nextPageToken: data.nextPageToken,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.nextPageToken = data.nextPageToken;
                    for(var i = 0; i < data.items.length; i++){
                        newMsg.payload.results.push({
                            id: data.items[i].id,
                            displayName: data.items[i].displayName,
                            url: data.items[i].url,
                            image: data.items[i].image.url
                        });
                    }
                    cb(newMsg);
                }
            }
            
            function handleActivitiesIdRequest(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                           code: data.error.code,
                           status: data.error.errors[0].reason,
                           message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.payload = {
                        id: data.id,
                        url: data.url,
                        actor: {
                            id: data.actor.id,
                            displayName: data.actor.displayName
                        },
                        verb: data.verb,
                        published: data.published,
                        updated: data.updated,
                        object: {
                            objectType: data.object.objectType,
                            id: data.object.id,
                            actor: data.object.actor,
                            content: data.object.content,
                            originalContent: data.object.originalContent,
                            url: data.object.url,
                            replies: data.object.replies.totalItems,
                            plusoners: data.object.plusoners.totalItems,
                            
                        },
                        location: {
                            geocode: data.geocode,
                            address: data.address,
                            radius: data.radius,
                            placeId: data.placeId,
                            placeName: data.placeName
                        },
                        status: RED._("plus.message.ok")
                    };
                    newMsg.description = newMsg.payload.actor.displayName + ', ' + newMsg.payload.verb + ', ' + newMsg.payload.object.id;
                    newMsg.activityId = data.id;
                    cb(newMsg);
                }
            }
            
            function handleActivitiesSearchRequest(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                         code: data.error.code,
                           status: data.error.errors[0].reason,
                           message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.payload = {
                        results: [],
                        nextPageToken: data.nextPageToken,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.nextPageToken = data.nextPageToken;
                    for(var i = 0; i < data.items.length; i++){
                        newMsg.payload.results.push({
                            id: data.items[i].id,
                            url: data.items[i].url,
                            actor: {
                                id: data.items[i].actor.id,
                                displayName: data.items[i].actor.displayName
                            },
                            verb: data.items[i].verb,
                            published: data.items[i].published,
                            updated: data.items[i].updated,
                            object: {
                                objectType: data.items[i].object.objectType,
                                id: data.items[i].object.id,
                                actor: data.items[i].object.actor,
                                content: data.items[i].object.content,
                                originalContent: data.items[i].object.originalContent,
                                url: data.items[i].object.url,
                                replies: data.items[i].object.replies.totalItems,
                                plusoners: data.items[i].object.plusoners.totalItems,
                                
                            },
                            location: {
                                geocode: data.items[i].geocode,
                                address: data.items[i].address,
                                radius: data.items[i].radius,
                                placeId: data.items[i].placeId,
                                placeName: data.items[i].placeName
                            }
                        });
                    }
                    cb(newMsg);
                }
            }
            
            function handleActivitiesListRequest(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                         code: data.error.code,
                           status: data.error.errors[0].reason,
                           message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.payload = {
                        results: [],
                        nextPageToken: data.nextPageToken,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.nextPageToken = data.nextPageToken;
                    for(var i = 0; i < data.items.length; i++){
                        newMsg.payload.results.push({
                            id: data.items[i].id,
                            url: data.items[i].url,
                            actor: {
                                id: data.items[i].actor.id,
                                displayName: data.items[i].actor.displayName
                            },
                            verb: data.items[i].verb,
                            published: data.items[i].published,
                            updated: data.items[i].updated,
                            object: {
                                objectType: data.items[i].object.objectType,
                                id: data.items[i].object.id,
                                actor: data.items[i].object.actor,
                                content: data.items[i].object.content,
                                originalContent: data.items[i].object.originalContent,
                                url: data.items[i].object.url,
                                replies: data.items[i].object.replies.totalItems,
                                plusoners: data.items[i].object.plusoners.totalItems,
                                
                            },
                            location: {
                                geocode: data.items[i].geocode,
                                address: data.items[i].address,
                                radius: data.items[i].radius,
                                placeId: data.items[i].placeId,
                                placeName: data.items[i].placeName
                            }
                        });
                    }
                    cb(newMsg);
                }
            }
            
            function handleCommentsIdRequest(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {
                         code: data.error.code,
                           status: data.error.errors[0].reason,
                           message: data.error.message
                    };
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = RED._("plus.message.comment") + " " + data.id;
                    newMsg.payload = {
                        id: data.id,
                        actor: {
                            id: data.actor.id,
                            displayName: data.actor.displayName
                        },
                        verb: data.verb,
                        object: {
                            objectType: data.object.objectType,
                            content: data.object.content,
                            originalContent: data.object.originalContent
                        },
                        published: data.published,
                        updated: data.updated,
                        inReplyTo: data.inReplyTo,
                        plusoners: data.plusoners.totalItems,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.description = data.object.originalContent;
                    newMsg.commentId = data.id;
                    cb(newMsg);
                }
            }
            
            function handleCommentsListRequest(data, cb){
                if(data.hasOwnProperty('error')){
                    var err = {};
                    err.message = data.error.message;
                    err.code = data.error.code;
                    err.status = data.error.errors[0].reason;
                    throwNodeError(err, msg);
                    return;
                }else{
                    var newMsg = cloneMsg(msg);     //quick clone msg
                    newMsg.data = data;
                    newMsg.title = data.title;
                    newMsg.payload = {
                        results: [],
                        nextPageToken: data.nextPageToken,
                        status: RED._("plus.message.ok")
                    };
                    newMsg.nextPageToken = data.nextPageToken;
                    for(var i = 0; i < data.items.length; i++){
                        newMsg.payload.results.push({
                            id: data.items[i].id,
                            actor: {
                                id: data.items[i].actor.id,
                                displayName: data.items[i].actor.displayName
                            },
                            verb: data.items[i].verb,
                            object: {
                                objectType: data.items[i].object.objectType,
                                content: data.items[i].object.content,
                                originalContent: data.items[i].object.originalContent
                            },
                            published: data.items[i].published,
                            updated: data.items[i].updated,
                            inReplyTo: data.items[i].inReplyTo,
                            plusoners: data.items[i].plusoners.totalItems
                        });
                    }
                    cb(newMsg);
                }
            }
            
            function sendReqToGoogle(cb){
                request.get({
                    url: url,
                    headers: headers,
                    qs: queryParams,
                    method: "GET"
                }, function(err, resp, body){
                    cb(err, body);
                });
            }
            
            
            var curTime = new Date().getTime() / 1000;
            
            if(node.google && node.google.credentials){
                var expireTime = node.google.credentials.expireTime;
                var expired = (curTime > expireTime);
                if(expired){
                    console.log('expired token');
                    node.google.refreshToken(function(){
                        console.log("refreshed");
                        accessToken = node.google.credentials.accessToken;
                        processInput();
                    });
                } else{
                    accessToken = node.google.credentials.accessToken;
                    processInput();
                }
            } else if(msg.credentials && msg.credentials.hasOwnProperty('accessToken')){
                /*if(msg.credentials.hasOwnProperty('refreshToken') && msg.credentials.hasOwnProperty('expireTime')){
                    
                } else if (msg.credentials.hasOwnProperty('refreshToken')){
                    
                } else{
                */  accessToken = msg.credentials.accessToken;
                //}
            } else if(msg.accessToken){
                accessToken = msg.accessToken;
            }
            else{
                throwNodeError({
                    code: 400,
                    status: 'MISSING_VALUES',
                    message: RED._("plus.error.no-accesstoken")
                }, msg);
                return;
            }
        });
        
        function throwNodeError(err, msg){
            node.status({fill:"red",shape:"ring",text:"plus.status.failed"});
            msg.error = err;
            node.error(err, msg);
            return;
        }
        
    }
    RED.nodes.registerType("google plus", GooglePlusNode);
    
    function cloneMsg(msg){
        var req = msg.req;
        var res = msg.res;
        delete msg.req;
        delete msg.res;
        var m = clone(msg);
        if (req) {
            m.req = req;
            msg.req = req;
        }
        if (res) {
            m.res = res;
            msg.res = res;
        }
        return m;
    }
};