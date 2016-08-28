'use strict';
var app = require('express');
var waterfall = require('async/waterfall');
var crypto = require('crypto');

var errorCodes = require(__base + 'server/config/error');
var env = require(__base + 'server/config/env');
var authorization = require(__base + 'server/app/libraries/auth.lib');


//Load model
var authModel = require('./auth.model');
module.exports = {
	isSignedIn: function(req, res){
		
		waterfall([
			function(callback){
				authorization.verify(req,res,callback);
			}
		],function(err,result){
			var response =  {'jsonrpc':'2.0'};
			try{	
				if(err == true)
				{
					response.error = result;
				}
				else
				{
					response.result =  result;
				}
			}
			catch(e){
				response.error = errorCodes['-32000'];
			}
			//return response to front end
			res.send(response);
		});
	},
	logout:function(req,res){
		delete req.user;
		res.send({status:true});
	}
};
