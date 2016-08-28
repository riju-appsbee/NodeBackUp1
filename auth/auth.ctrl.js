'use strict';
var app = require('express');
var waterfall = require('async/waterfall');
var validator = require('validator');
var crypto = require('crypto');
var errorCodes = require(__base + 'server/config/error');
var authorization = require(__base + 'server/app/libraries/auth.lib');
var env = require(__base + 'server/config/env');
var firebase = require(__base + 'server/app/libraries/firebase');





//Load model
var authModel = require('./auth.model');
module.exports = {
	login: function(req, res){
		//initalize

		var email = req.body.params.email;
		var password = req.body.params.password;

		//this is done to execute the function in  serial order
		waterfall([
			function(callback){

				//email validation
				if(!email || !validator.isEmail(email)){

					return callback(true, errorCodes["-32001"]);
				}
				//password validation
				if(!password || !validator.isLength(password,{ min: 6, max: 15 })){

					return callback(true, errorCodes["-32002"]);
				}
				//login logic model
				authModel.doLogin({email:email,password:password},callback);
			},
			function(user,callback){
				authorization.create(user,req,res,callback);
			},
			function createFirebaseToken(data, cb){
				if(data.uid !== undefined && !!data.uid){
					data.ftkn = firebase.createFirebaseToken(data.uid.toString());
					delete data.uid;
				}
				cb(null, data);
			}
		],function(err,result){
			var response =  {'jsonrpc':'2.0'};
			try{
				//error or successfull login
				if(err === true)
				{
					response.error = result;
				}
				else
				{
					response.result = result;
				}
			}
			catch(e){
				response.error = errorCodes["-32000"];
			}
			//return response to front end
			res.send(response);
		});
	}



};
