'use strict';
//Arranging modules
var async = require("async");
var crypto = require('crypto');
var validator = require('validator');

var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');
var UploadAble = require(__base + 'server/app/libraries/uploadable.lib');

var OnFleet = require(__base + 'server/app/libraries/onfleet.lib');

//Load driver model
var driverModel = require('./driver.model');

//Load helper
var objHelper = require(__base + 'server/app/helpers/object.helper');

/**
 *URL : http://localhost:3000/api/driver/count
 *This function is to fetch total number of drivers.
 *@params : No param needed
 **/
function driverCount(req, res) {
    // res.send('hello');return;
    var response = {
        "jsonrpc": "2.0",
        'method': 'driverCount'
    };
    var searchQ = req.query.q || false;
    var state = req.query.ms || false;
    var marketOffice = req.query.mo || false;

    var countDriverList = function(callback) {
        // calling model for get data
        driverModel.getDriverListCount(state, marketOffice, searchQ,callback);
    };

    async.series([countDriverList], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = {
                    numPerPage: env.pagination.numPerPage,
                    count: result[0]
                };
            }
        } catch (e) {
            response.error = "Just caught an exception while fetching the list of drivers!";
            console.log(e);
        }
        res.send(response);
    });


}

/**
 *URL : http://localhost:3000/api/driver/list
 *This function is for fetching list of drivers page-wise.
 *@params : page number within req variables
 **/
function listOfDrivers(req, res) {
    var response = {
        "jsonrpc": "2.0"
    };
    //First task
    var fetchDriverList = function(cb) {
        var offset = req.query.p || 1;
        offset = (parseInt(offset) - 1) * env.pagination.numPerPage;
        var searchQ = req.query.q || false;
        var state = req.query.ms || false;
        var marketOffice = req.query.mo || false;
        driverModel.getListOfDrivers(state, marketOffice, searchQ, offset, env.pagination.numPerPage, cb);
    };
    async.waterfall([fetchDriverList], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while fetching the list of drivers!";
            console.log(e);
        }
        res.send(response);

    });

};

/**
 *URL : http://localhost:3000/api/driver/add
 *This function is for a new driver.
 *@params : all post data within req variables
 **/
function addDriver(req, res) {
    var response = {
        "jsonrpc": "2.0"
    };
    //Arranging request

    var rawPassword = req.body.params.password;
    req.body.params.password = crypto.createHmac("sha1", env.secret_key).update(rawPassword).digest('hex');
    req.body.params.active = (req.body.params.deactivated === 'true') ? 'false' : 'true';

    var market_office_details = {
        market_office_id: req.body.params.market_office_id,
        state_code: req.body.params.market_office_state_code
    };

    var post = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'password', 'country_code', 'phone', 'address', 'state_code', 'zipcode', 'contractor', 'driver_license', 'social_security_number',
        'driver_note', 'insurance_company_name', 'insurance_company_policy_number', 'insurance_policy_exp_date', 'dmv_license_last_check_date', 'dmv_license_next_check_date', 'foodjet_car', 'active', 'base_pay_rate', 'pay_per_meal', 'onfleet_worker_status', 'onfleet_first_name', 'onfleet_last_name'
    ]);

    var checkRequest = function(cb) {
        if (!req.body.params.email || !validator.isEmail(req.body.params.email) || !rawPassword || !validator.isLength(rawPassword, {
                min: 8,
                max: 20
            }) || !req.body.params.first_name) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var uploadImage = function(cb) {
        //Image Uploading starts
        post.image = '';
        if (req.body.params.image !== undefined && !validator.isNull(req.body.params.image)) {
            var uploadAble = new UploadAble({
                name: req.body.params.first_name,
                body: req.body.params.image,
                bucketName: 'foodjets-2-driver-image-dev'
            });
            uploadAble.upload(function(err, data) {
                if (err === false) {
                    post.image = data.key;
                    cb();
                } else {
                    cb(errorCodes['-32029'], null);
                }
            });
        } else {
            cb();
        }
        //Image Uploading ends
    }

    var addDriver = function(cb) {
        driverModel.addDriver(post, cb, market_office_details);
    };

    var addToOnfleet = function(row, cb) {
        var onfleet = new OnFleet;
        var req = {
            name: row.onfleet_first_name + ' ' + row.onfleet_last_name,
            phone: row.country_code + row.phone,
            teams: [env.onfleet.default_team]
        };
        if (!!row.image) {
            req.image = row.image; // need s3 url
        }

        onfleet.createWorker(req, function(err, data) {
            if (err === null && data.id !== undefined) {
                cb(null, { driver_id: row.id, onfleet_id: data.id });
            } else {
                // console.log(data.message.cause);
                cb(data.message.cause, null);
            }
        });
    };

    var updateDriverData = function(data, cb) {
        driverModel.updateDriverData(data, cb);
    }

    async.waterfall([checkRequest, uploadImage, addDriver, addToOnfleet, updateDriverData], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while adding a driver!";
            console.log(e);
        }
        res.send(response);

    });



};

/**
 *URL : http://localhost:3000/api/driver/driver-info/:id
 *This function is for fetching driver details by ID.
 *@params : only id of the driver.
 **/
function getDriverInfo(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var driver_id = req.params.id || null;
    var checkRequest = function(callback) {
        if (!driver_id || driver_id === null) {
            callback(errorCodes['-32014'], null);
        } else {
            callback();
        }
    };

    var getDriver = function(callback) {
        driverModel.getDriver(driver_id, callback);
    };

    async.waterfall([
        checkRequest,
        getDriver
    ], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
                response.id = driver_id;
            }
        } catch (e) {
            response.error = "Just caught an exception while getting information of a driver!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 **URL : http://localhost:3000/api/driver/update/:id
 *This function is for updating detailed information of the driver by ID.
 *@params : all post data within req variables,driver_id, market_office_details
 **/
function updateDriver(req, res) {
    var response = {
        "jsonrpc": "2.0"
    };


    //Arranging request
    var driver_id = req.params.id || null;

    req.body.params.active = (req.body.params.deactivated === 'true') ? 'false' : 'true';
    var post = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'country_code', 'phone', 'address', 'state_code', 'zipcode', 'contractor', 'driver_license', 'social_security_number',
        'driver_note', 'insurance_company_name', 'insurance_company_policy_number', 'insurance_policy_exp_date', 'dmv_license_last_check_date', 'dmv_license_next_check_date', 'foodjet_car', 'active', 'base_pay_rate', 'pay_per_meal', 'onfleet_worker_status', 'onfleet_first_name', 'onfleet_last_name'
    ]);
    var password = (req.body.params.password) ? req.body.params.password.trim() : '';
    if (password !== '') {
        req.body.params.password = crypto.createHmac("sha1", env.secret_key).update(password).digest('hex');
        post = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'password', 'country_code', 'phone', 'address', 'state_code', 'zipcode', 'contractor', 'driver_license', 'social_security_number',
            'driver_note', 'insurance_company_name', 'insurance_company_policy_number', 'insurance_policy_exp_date', 'dmv_license_last_check_date', 'dmv_license_next_check_date', 'foodjet_car', 'active', 'base_pay_rate', 'pay_per_meal', 'onfleet_worker_status', 'onfleet_first_name', 'onfleet_last_name'
        ]);
    }


    var market_office_details = {
        market_office_id: req.body.params.market_office_id,
        state_code: req.body.params.market_office_state_code
    };


    var checkRequest = function(cb) {
        if (!driver_id || driver_id == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var uploadImage = function(cb) {
        //Image Uploading starts
        if (req.body.params.image.indexOf("base64") !== -1 && req.body.params.image !== undefined && !validator.isNull(req.body.params.image)) {
            var uploadAble = new UploadAble({
                name: req.body.params.first_name,
                body: req.body.params.image,
                bucketName: 'foodjets-2-driver-image-dev'
            });
            uploadAble.upload(function(err, data) {
                // console.log(data.Location);
                if (err === false) {
                    post.image = data.key;
                    cb();
                } else {
                    cb(errorCodes['-32029'], null);
                }
            });
        } else {
            if (req.body.params.image == '' && req.body.params.imagePath == '') {
                post.image = '';
            }
            cb();
        }
        //Image Uploading ends
    }

    var updateOnFleet = function(cb) {

        if (req.body.params.onfleet_id === undefined || req.body.params.onfleet_id === null || req.body.params.onfleet_id == '') {
            cb();
        } else {
            var onfleet = new OnFleet;
            var request = {
                id: req.body.params.onfleet_id,
                name: req.body.params.onfleet_first_name + ' ' + req.body.params.onfleet_last_name,
                phone: req.body.params.country_code + req.body.params.phone,
                teams: [env.onfleet.default_team]
            };
            if (!!req.body.image) {
                request.image = req.body.params.image; // need s3 url
            }
            // console.log(req.body.params.onfleet_first_name);
            // console.log(req.body.params.onfleet_last_name);
            // console.log(req.body.params.onfleet_id);
            onfleet.updateWorker(request, function(err, data) {
                // console.log(err);
                // console.log(data);
            });
            cb();
        }


    };

    var updateDriver = function(cb) {
        driverModel.updateDriver(post, cb, driver_id, market_office_details);
    };


    async.waterfall([checkRequest, uploadImage, updateOnFleet, updateDriver], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
                response.id = driver_id;

            }
        } catch (e) {
            response.error = "Just caught an exception while updating a driver!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 *URL : http://localhost:3000/api/driver/delete/:id
 *This function is for deleting a driver.
 *@params : only id of the driver
 **/
function deleteDriver(req, res) {
    var driver_id = req.params.id || null;
    var response = {
        "jsonrpc": "2.0"
    };
    var checkRequest = function(cb) {
        if (!driver_id || driver_id == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb(null, driver_id);
        }
    };

    var fetchOnFleet = function(driver_id, cb) {
        driverModel.getDriver(driver_id, cb);
    };

    var deleteFromOnFleet = function(row, cb) {

        if (row.onfleet_id !== undefined && row.onfleet_id !== null) {
            var onfleet = new OnFleet;
            var req = {
                id: row.onfleet_id
            };
            onfleet.deleteWorker(req, function(err, data) {

                // console.log('Here we are!');
                // console.log(err);
                // console.log(data);
                // cb(null,row.id);
                // if (err===true) {
                //     cb(data.message.message, null);
                // } else {
                //     cb(null,row.id);
                // }
            });
            cb(null, row.id);
        } else {
            cb(null, row.id);
        }
    };

    var deleteDriver = function(driverID, cb) {
        driverModel.deleteDriverByID(driverID, cb);
    };

    async.waterfall([checkRequest, fetchOnFleet, deleteFromOnFleet, deleteDriver], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
                response.id = driver_id;
            }
        } catch (e) {
            response.error = "Just caught an exception while deleting a driver!";
            console.log(e);
        }
        res.send(response);

    });
};

/**
 **URL : http://localhost:3000/api/driver/send-message/:id
 *This function is for sending sms to the driver's phone'.
 *@params : message,driver_id
 **/
function sendMessageToDriver(req, res) {
    var response = {
        "jsonrpc": "2.0"
    };
    var checkRequest = function(cb) {
        //Arranging request
        var driver_id = req.params.id || null;
        var textMessage = req.body.params.message || null;
        if (!driver_id || driver_id == null || !textMessage || textMessage == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb(null, driver_id, textMessage);
        }
    };

    var sendMessage = function(driver_id, textMessage, cb) {
        driverModel.sendMessage(driver_id, textMessage, cb);
    }

    async.waterfall([checkRequest, sendMessage], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;

            }
        } catch (e) {
            response.error = "Just caught an exception while sending message to a driver!";
            console.log(e);
        }
        res.send(response);
    });
};

//Calling related methods as per routing
module.exports = {
    listOfDrivers: listOfDrivers,
    driverCount: driverCount,
    addDriver: addDriver,
    updateDriver: updateDriver,
    getDriverInfo: getDriverInfo,
    deleteDriver: deleteDriver,
    sendMessageToDriver: sendMessageToDriver
};
