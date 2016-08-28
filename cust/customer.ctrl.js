'use strict';
var async = require("async");
var crypto = require('crypto');
var validator = require('validator');

var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');
var random = require(__base + 'server/app/libraries/random.lib');
var OnFleet = require(__base + 'server/app/libraries/onfleet.lib');
var redis = require(__base + 'server/app/libraries/redis.lib');
//Load model
var customerModel = require('./customer.model');

//Load helper
var objHelper = require(__base + 'server/app/helpers/object.helper');



/**
 * URL : http://localhost:3000/api/customer/count
 * Count Number of customer
 **/

function customerCount(req, res) {

    var response = {
        "jsonrpc": '2.0'
    };
    var fetchCustomerList = function(callback) {
        var searchQ = req.query.q || false;
        // var state = req.query.ms || false;
        // var marketOffice = req.query.mo || false;
        // calling model for get data
        customerModel.getCustomerListCount(searchQ, callback);
    };

    async.series([fetchCustomerList], function(err, result) {
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
            //Log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

/**
 * URL : http://localhost:3000/api/customer/list
 * DETAILS : getting customer listing from customer table by model.
 **/
function customerList(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var fetchCustomerList = function(callback) {
        var offset = req.query.p || 1;
        offset = (parseInt(offset) - 1) * env.pagination.numPerPage;
        var searchQ = req.query.q || false;
        // var state = req.query.ms || false;
        // var marketOffice = req.query.mo || false;
        // calling model for get data
        customerModel.getCustomerList(searchQ, offset, env.pagination.numPerPage, callback);
    };

    async.series([fetchCustomerList], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting customer address listing from customer_delivery_address table by model.
 **/
function getDeliveryAddressesInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchCustomerDeliveryAddressList = function(callback) {
        //calling model for get data
        customerModel.getDeliveryAddressesInfo(customer_id, callback);
    };

    async.series([checkRequest, fetchCustomerDeliveryAddressList], function(err, result) {
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


function getAddressZoneInfo(req, res) {

    var response = {
        "jsonrpc": '2.0'
    };

    var state_code = req.query.state_code || null;
    var zone_id = req.query.zone_id || null;

    var checkRequest = function(callback) {
        try {
            if (state_code === null || zone_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback(null, null);
            }
        } catch (e) {
            callback(errorCodes['-32000'], null);
        }
    };

    var deliveryAddressMarketOfficeInfo = function(args, callback) {
        customerModel.deliveryAddressMarketOfficeInfo(state_code, zone_id, callback);
    };

    var zoneIsOpen = function(args, callback) {
        args.state_code = state_code;
        args.zone_id = zone_id;
        customerModel.dzIsOpen(args, callback);
    };

    var GlobalConfig = function(args, callback) {
        // call redis
        redis.hmget("GLOBAL_SETTINGS", "FOODJETS_CAR_SPEED", "RESTAURANTS_BUFFER_TIME", function(err, obj) {
            if (!!err) {
                callback('Redis `GLOBAL_SETTINGS` error.')
            } else {
                args.FOODJETS_CAR_SPEED = obj[0] || 0;
                args.RESTAURANTS_BUFFER_TIME = obj[1] || 0;
                callback(null, args);
            }
        });
    };

    async.waterfall([checkRequest, deliveryAddressMarketOfficeInfo, zoneIsOpen, GlobalConfig], function(err, result) {
        console.log(result);

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
 * URL : (null)
 * DETAILS : getting customer credit card listing from customer_credit_card table by model.
 **/
function getCreditCardsInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchCustomerCreditCardList = function(callback) {
        //calling model for get data
        customerModel.getCreditCardInfo(customer_id, callback);
    };
    async.series([checkRequest, fetchCustomerCreditCardList], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting customer order history from order table by model.
 **/
function getOrderHistoryInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchOrderHistory = function(callback) {
        //calling model for get data
        customerModel.getOrderHistory(customer_id, callback);
    };
    async.series([checkRequest, fetchOrderHistory], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting customer referred history from customer table by model.
 **/
function getReferredHistoryInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchReferredHistory = function(callback) {
        //calling model for get data
        customerModel.getReferredHistory(customer_id, callback);
    };
    async.series([checkRequest, fetchReferredHistory], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting customer given credit log from log.customer_credit_log table by model.
 **/
function getCreditLogInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchCreditLog = function(callback) {
        //calling model for get data
        customerModel.getCreditLog(customer_id, callback);
    };
    async.series([checkRequest, fetchCreditLog], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting item feedback from log.order_items_review and order_review table by model.
 **/
function getItemFeedbackInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchItemFeedback = function(callback) {
        //calling model for get data
        customerModel.getItemFeedback(customer_id, callback);
    };
    async.series([checkRequest, fetchItemFeedback], function(err, result) {
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
 * URL : (null)
 * DETAILS : getting item feedback from log.order_items_review and order_review table by model.
 **/
function getGeneralFeedbackInfo(req, res) {
    var response = {
        "jsonrpc": '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchGeneralFeedback = function(callback) {
        //calling model for get data
        customerModel.getGeneralFeedback(customer_id, callback);
    };
    async.series([checkRequest, fetchGeneralFeedback], function(err, result) {
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
 * URL : http://localhost:3000/api/customer/add
 * DETAILS : adding customer record to customer table by model.
 **/
function addCustomer(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };

    req.body.params.short_id = random.hat(30);
    req.body.params.onfleet_id = 0;
    req.body.params.password = crypto.createHmac("sha1", env.secret_key).update(req.body.params.password).digest('hex');
    req.body.params.receive_daily_email = (req.body.params.daily_email) ? "true" : "false";
    req.body.params.receive_phone_call = (req.body.params.receive_phone_call) ? "true" : "false";
    req.body.params.skip_sms_notifications = (req.body.params.skip_sms_notifications) ? "true" : "false";
    req.body.params.active = (req.body.params.active) ? "true" : "false";
    req.body.params.created_at = objHelper.now();
    req.body.params.updated_at = objHelper.now();
    var res_post = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'onfleet_id', 'password', 'short_id', 'country_code', 'phone', 'address', 'city', 'state', 'zip_code', 'credit',
        'receive_daily_email', 'receive_phone_call', 'skip_sms_notifications', 'onfleet_note', 'internal_note', 'active', 'created_at', 'updated_at'
    ]);

    var addCustomerRecord = function(callback) {
        customerModel.addCustomer(res_post, callback);
    };

    var addCustomerToOnfleet = function(custometId, callback) {

        var onfleet = new OnFleet;
        var recipients = {
            name: req.body.params.first_name + ' ' + req.body.params.last_name,
            phone: req.body.params.country_code + req.body.params.phone,
            notes: req.body.params.internal_note,
            skipSMSNotifications: req.body.params.skip_sms_notifications
        };


        onfleet.createRecipients(recipients, function(err, data) {
            // console.log(err);
            // console.log(data);
            //If data exists(previously added) check by phone
            if (err === true && data.message.cause.type === 'duplicateKey') {
                var input = {
                    phone: req.body.params.country_code + req.body.params.phone
                };
                //fetch details by phone number
                onfleet.findRecipientsByPhone(input, function(error, dataReceived) {
                    // console.log(error);
                    // console.log(dataReceived);
                    if (dataReceived.id !== undefined) {
                        var recipients = {
                            id: dataReceived.id,
                            name: req.body.params.first_name + ' ' + req.body.params.last_name,
                            notes: req.body.params.internal_note,
                            skipSMSNotifications: req.body.params.skip_sms_notifications
                        };
                        //update recepients
                        onfleet.updateRecipients(recipients, function(errors, onfleetData) {
                            // console.log(errors);console.log(onfleetData);
                            if (onfleetData.id !== undefined) {
                                callback(null, {
                                    customer_id: custometId,
                                    onfleet_id: onfleetData.id
                                });
                            } else {
                                callback(onfleetData.message.cause, null);
                            }
                        });
                    }
                });
            }

            if (err === true && data.code === 'InvalidContent') {
                callback('Onfleet error : ' + data.message.cause, null);
            }

            if (err === null && data.id !== undefined) {
                callback(null, {
                    customer_id: custometId,
                    onfleet_id: data.id
                });
            }
        });

    };

    var updateCustomerWithOnfleetId = function(data, callback) {
        customerModel.updateCustomerOnfleetId(data, callback);
    };

    var addCustomerRecordInDynamo = function(customer_id, callback) {
        req.body.params.id = customer_id;
        var res_dynamo = objHelper.reqParamIntersec(req.body.params, ['id', 'first_name', 'last_name', 'email', 'password', 'active']);
        var res_dynamo_post = objHelper.mapShortCoulumnName(res_dynamo);
        customerModel.addCustomerInDynamo(res_dynamo_post, callback);
    };

    async.waterfall([addCustomerRecord, addCustomerToOnfleet,
        updateCustomerWithOnfleetId, addCustomerRecordInDynamo
    ], function(err, result) {
        try {
            if (err !== null) {
                // console.log(err);
                response.error.message = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

//# getting customer record by id from customer table by model.
function getCustomerInfo(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var getCustomer = function(callback) {
        customerModel.getCustomer(customer_id, callback);
    };

    async.waterfall([checkRequest, getCustomer], function(err, result) {
        try {
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
//# getting state list.
function getListOfAllstates(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };


    var getListOfAllstates = function(callback) {
        customerModel.getListOfAllstates(callback);
    };

    async.waterfall([getListOfAllstates], function(err, result) {
        try {
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
//# getting city list.
function getListOfAllCities(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };



    var getListOfAllCities = function(callback) {
        customerModel.getListOfAllCities(callback);
    };

    async.waterfall([getListOfAllCities], function(err, result) {
        try {
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
//# getting city list by state.
function getListOfAllCitiesByStateCode(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var state_code = req.params.id || null;


    var getListOfAllCities = function(callback) {
        customerModel.getListOfAllCitiesByStateCode(state_code, callback);
    };

    async.waterfall([getListOfAllCities], function(err, result) {
        try {
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
 * URL : http://localhost:3000/api/customer/update
 * DETAILS : updating customer record to customer table by model.
 **/

function updateCustomer(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var res_post = {};

    var customer_id = req.body.params.id;

    req.body.params.receive_daily_email = (req.body.params.daily_email) ? "true" : "false";
    req.body.params.receive_phone_call = (req.body.params.receive_phone_call) ? "true" : "false";
    req.body.params.skip_sms_notifications = (req.body.params.skip_sms_notifications) ? "true" : "false";
    req.body.params.active = (req.body.params.active) ? "true" : "false";

    req.body.params.updated_at = objHelper.now();
    var res_post = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'onfleet_id', 'country_code', 'phone', 'state_code', 'address', 'credit',
        'receive_daily_email', 'receive_phone_call', 'skip_sms_notifications', 'onfleet_note', 'internal_note', 'active', 'updated_at'
    ]);

    var res_dynamo = objHelper.reqParamIntersec(req.body.params, ['first_name', 'last_name', 'email', 'active']);
    var res_dynamo_post = objHelper.mapShortCoulumnNameForUpdate(res_dynamo);

    if (req.body.params.password && req.body.params.password !== '') {
        res_post.password = crypto.createHmac("sha1", env.secret_key).update(req.body.params.password).digest('hex');
        res_dynamo_post.pwd = crypto.createHmac("sha1", env.secret_key).update(req.body.params.password).digest('hex');
    }

    var checkRequest = function(callback) {
        try {
            if (!customer_id) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchCustomerOnfleetId = function(callback) {
        customerModel.fetchCustomerOnfleetId(customer_id, callback);
    };

    var updateCustomerToOnfleet = function(rows, custometId, callback) {

        var onfleet = new OnFleet();
        if (!rows.onfleet_id || rows.onfleet_id === '0') {
            var recipients = {
                name: req.body.params.first_name + ' ' + req.body.params.last_name,
                phone: req.body.params.country_code + req.body.params.phone,
                notes: req.body.params.internal_note,
                skipSMSNotifications: req.body.params.skip_sms_notifications
            };
            onfleet.createRecipients(recipients, function(err, data) {
                if (err === null && data.id !== undefined) {
                    res_post.onfleet_id = data.id;
                    callback(null, data.id);
                } else {
                    callback(data.message.cause, null);
                }
            });
        } else if (rows.phone !== req.body.params.phone) {
            var recipients = {
                id: req.body.params.onfleet_id,
                name: req.body.params.first_name + ' ' + req.body.params.last_name,
                notes: req.body.params.internal_note,
                skipSMSNotifications: req.body.params.skip_sms_notifications
            };

            onfleet.updateRecipients(recipients, function(err, data) {
                if (err === null && data.id !== undefined) {
                    callback(null, data.id);
                } else {
                    callback(data.message.cause, null);
                }
            });
        } else {
            callback(null, true);
        }
    };

    var updateCustomer = function(args, callback) {
        customerModel.updateCustomer(customer_id, res_post, callback);
    };

    var updateCustomerRecordInDynamo = function(customer_id, callback) {
        customerModel.updateCustomerInDynamo(res_dynamo_post, customer_id, callback);
    };
    async.waterfall([
        checkRequest,
        fetchCustomerOnfleetId,
        updateCustomerToOnfleet,
        updateCustomer,
        updateCustomerRecordInDynamo
    ], function(err, result) {
        try {
            if (err !== null) {
                response.error.message = err;
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
 * URL : http://localhost:3000/api/customer/delete:id
 * DETAILS : deleting customer record from customer table by model
 **/
function deleteCustomer(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var customer_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var fetchCustomerOnfleetId = function(callback) {
        customerModel.fetchCustomerOnfleetId(customer_id, callback);
    };

    var deleteCustomerFromOnfleet = function(onfleetId, customerId, callback) {
        if (onfleetId !== undefined && onfleetId !== null) {
            var onfleet = new OnFleet;
            var req = {
                id: onfleetId
            };
            onfleet.deleteRecipients(req, function(err, data) {


            });
            callback(null, customer_id);
        } else {
            callback(errorCodes['-32703'], null);
        }
    };

    var deleteCustomer = function(customer_id, callback) {
        customerModel.deleteCustomer(customer_id, callback);
    };

    var deleteCustomerFromDynamo = function(customer_id, callback) {
        customerModel.deleteCustomerFromDynamo(customer_id, callback);
    };



    async.waterfall([checkRequest, fetchCustomerOnfleetId, deleteCustomerFromOnfleet, deleteCustomer, deleteCustomerFromDynamo], function(err, result) {
        try {
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
 * URL : http://localhost:3000/api/customer/delete_delivery_addresses:id
 * DETAILS : deleting customer delivery address from customer_delivery_addresses table by model
 **/
function deleteDeliveryAddresses(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var delv_add_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!delv_add_id || delv_add_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var deleteCustDelevAdd = function(callback) {
        customerModel.delCustDelvAddress(delv_add_id, callback);
    };

    async.waterfall([
        checkRequest,
        deleteCustDelevAdd
    ], function(err, result) {
        try {
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
 * URL : http://localhost:3000/api/customer/delete_credit_card:id
 * DETAILS : deleting customer card details from customer_credit_card table by model
 **/
function deleteCreditCard(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var card_id = req.params.id || null;
    var checkRequest = function(callback) {
        try {
            if (!card_id || card_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var deleteCustCreditCard = function(callback) {
        customerModel.delCard(card_id, callback);
    };

    async.waterfall([
        checkRequest,
        deleteCustCreditCard
    ], function(err, result) {
        try {
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
 * URL : http://localhost:3000/api/customer/overwrite-phone-verification:id
 * DETAILS : overwrite-phone-verification
 **/
function overwritePhoneVerification(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };

    var customer_id = req.body.params.id;
    var checkRequest = function(callback) {
        try {
            if (!customer_id || customer_id === null) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        } catch (e) {
            callback(errorCodes['-32000'], null);
        }
    };

    var overwritePhVerification = function(callback) {
        customerModel.overwrite(customer_id, callback);
    };

    var overwritePhVerificationInDynamo = function(customer_id, callback) {
        customerModel.overwriteInDynamo(customer_id, callback);
    };

    async.waterfall([checkRequest, overwritePhVerification, overwritePhVerificationInDynamo], function(err, result) {
        try {
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

function saveCustomerAddress(req, res) {
    var response = {
        'jsonrpc': '2.0'
    };
    var address = req.body.params.address;
    //console.log(address);
    req.body.params.created_at = objHelper.now();
    async.waterfall([
        function(callback) {
            try {
                if (!address || address === null) {
                    callback(errorCodes['-32014'], null);
                } else {
                    callback();
                }
            } catch (e) {
                callback(errorCodes['-32000'], null);
            }
        },
        function(callback) {
            customerModel.saveCustomerAddress(req.body.params, callback);
        }
    ], function(err, result) {
        try {
            if (err) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });

}

//# calling the functions
module.exports = {
    customerCount: customerCount,
    customerList: customerList,
    addCustomer: addCustomer,
    getCustomerInfo: getCustomerInfo,
    updateCustomer: updateCustomer,
    deleteCustomer: deleteCustomer,
    deleteDeliveryAddresses: deleteDeliveryAddresses,
    getDeliveryAddressesInfo: getDeliveryAddressesInfo,
    getCreditCardsInfo: getCreditCardsInfo,
    getOrderHistoryInfo: getOrderHistoryInfo,
    getReferredHistoryInfo: getReferredHistoryInfo,
    getCreditLogInfo: getCreditLogInfo,
    getItemFeedbackInfo: getItemFeedbackInfo,
    getGeneralFeedbackInfo: getGeneralFeedbackInfo,
    deleteCreditCard: deleteCreditCard,
    overwritePhoneVerification: overwritePhoneVerification,
    saveCustomerAddress: saveCustomerAddress,
    getListOfAllstates: getListOfAllstates,
    getListOfAllCities: getListOfAllCities,
    getListOfAllCitiesByStateCode: getListOfAllCitiesByStateCode,
    getAddressZoneInfo: getAddressZoneInfo
        //fetchCustomerOnfleetId:fetchCustomerOnfleetId
};
