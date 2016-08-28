'use strict';
var crypto = require('crypto');

var env = require(__base + 'server/config/env');
var models = require(__base + 'server/config/sequelize');

module.exports = {
	doLogin: function(param,callback){
			var email = param.email;

			//hashing the password
			var password = crypto.createHmac("sha1",env.secret_key).update(param.password).digest('hex');

			//query the database
			models.main.employee.findAll({
				attributes:['id','name','email'],
				where: {
					email:email,
					password:password,
					active: true
				}
			}).then(function(rows) {
				callback(false,rows);
			},function(err){
				callback(true, err);
			});

	}
};
