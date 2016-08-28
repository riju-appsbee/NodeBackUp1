'use strict';
var async = require("async");
var validator = require('validator');
var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');
var underscore = require('underscore');

//Load model
var restaurantModel = require('./restaurant.model');

//Load library
var UploadAble = require(__base + 'server/app/libraries/uploadable.lib');

/**
 * URL : http://localhost:3000/api/restaurant/market-office-list
 * DETAILS : getting market office list from state market_office table by model.
 **/
function getMarketOfficeList(req, res) {
    //state for database
    var state = req.query.state || env.state;
    var response = {
        "jsonrpc": '2.0'
    };
    var fetchMarketOfficeList = function(callback) {
        // calling model for get data
        restaurantModel.getMarketOfficeList(state, callback);
    };

    async.series([fetchMarketOfficeList], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            //Log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

/**
 * URL : http://localhost:3000/api/restaurant/market-office-city-list
 * DETAILS : getting market office city list from state market_office_city table by model.
 **/
function getMarketOfficeCityList(req, res) {
    //state for database
    var state = req.query.state || env.state;
    var marketOfficeId = req.query.marketOfficeId || '';
    var response = {
        "jsonrpc": '2.0'
    };
    var fetchMarketOfficeCityList = function(callback) {
        // calling model for get data
        restaurantModel.getMarketOfficeCityList(state, marketOfficeId, callback);
    };

    async.series([fetchMarketOfficeCityList], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            //Log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}
/**
 * URL : http://localhost:3000/api/restaurant/market-office-cities
 * DETAILS : getting market office city list by state code.
 **/
function getMarketOfficeCitiesByState(req, res) {
    //state for database
    var state = req.query.state || env.state;

    var response = {
        "jsonrpc": '2.0'
    };
    var getMarketOfficeCitiesByState = function(callback) {
        // calling model for get data
        restaurantModel.getMarketOfficeCitiesByState(state, callback);
    };

    async.series([getMarketOfficeCitiesByState], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result[0];
            }
        } catch (e) {
            //Log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

/**
 * URL : http://localhost:3000/api/restaurant/zone-list
 * DETAILS : getting zone list from state market_office_city_delivery_zone table by model.
 **/
function getZoneList(req, res) {
    //state for database
    var state = req.query.state || env.state;
    var marketOfficeCityId = req.query.marketOfficeCityId || '';
    var response = {
        "jsonrpc": '2.0'
    };
    var fetchMarketOfficeCityDeliveryZoneList = function(callback) {
        // calling model for get data
        restaurantModel.getMarketOfficeCityDeliveryZoneList(state, marketOfficeCityId, callback);
    };

    async.series([fetchMarketOfficeCityDeliveryZoneList], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            //Log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

/**
 * URL : http://localhost:3000/api/restaurant/upload
 * DETAILS : Upload Restaurant Featured Icon
 **/
function uploadFeaturedIcon(req, res) {
    var response = {
            "jsonrpc": "2.0"
        },
        banner = !!req.body.params && !!req.body.params.banner ? req.body.params.banner : null,
        image = !!req.body.params && !!req.body.params.image ? req.body.params.image : null,
        tasks = [];

    var upBanner = function(callback) {
        var uploadAble = new UploadAble({
            name: req.body.params.name || '',
            body: req.body.params.banner,
            bucketName: 'foodjets-2-driver-image-dev'
        });

        uploadAble.upload(function(err, data) {
            // console.log(err, data);
            if (err === false) {
                callback(null, ['banner', data.key]);
            } else {
                callback(errorCodes['-32029'], null);
            }
        });
    };

    var upImage = function(callback) {
        var uploadAble = new UploadAble({
            name: req.body.params.name || '',
            body: req.body.params.image,
            bucketName: 'foodjets-2-driver-image-dev'
        });

        uploadAble.upload(function(err, data) {
            // console.log(err, data);
            if (err === false) {
                callback(null, ['image', data.key]);
            } else {
                callback(errorCodes['-32029'], null);
            }
        });
    };

    if (!!banner) {
        tasks.push(upBanner);
    }
    if (!!image) {
        tasks.push(upImage);
    }

    async.series(tasks, function(err, result) {
        console.log(err, result);
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = underscore.object(result);
            }
        } catch (e) {
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

//# calling the functions
module.exports = {
    getMarketOfficeList: getMarketOfficeList,
    getMarketOfficeCityList: getMarketOfficeCityList,
    getMarketOfficeCitiesByState: getMarketOfficeCitiesByState,
    getZoneList: getZoneList,
    uploadFeaturedIcon: uploadFeaturedIcon
};
