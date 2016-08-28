'use strict';
var async = require("async");
var shortid = require('shortid');
var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');

var OnFleet = require(__base + 'server/app/libraries/onfleet.lib');
var redis = require(__base + 'server/app/libraries/redis.lib');

//Load model
var customerOrderModel = require('./customer_order.model');

//Load helper
var checkoutHelper = require(__base + 'server/app/helpers/checkout');
var validate = require(__base + 'server/app/helpers/validation');

/**
 * URL : create-order
 * Details : creating order
**/
function createOrder(req, res) {
    try {
        var response = { "jsonrpc": '2.0' };

        //initalize
        var asyncTasks = [];
        req.body.params = req.body.params || {};
        var food_data = (req.body.params.food.length > 0) ? req.body.params.food : {};
        var current_menu_id = (req.body.params.menu_id) ? req.body.params.menu_id : null;

        //assign tips details
        var tips_amount = (req.body.params.amount.tips_amount) ? req.body.params.amount.tips_amount : 0;
        var tips_percentage = (req.body.params.amount.tips_percentage) ? req.body.params.amount.tips_percentage : 0;
        
        //assign promo and credit details
        var promo_code = (req.body.params.amount.promo_code) ? req.body.params.amount.promo_code : null;
        var credit_amount = (req.body.params.amount.credit_amount)?req.body.params.amount.credit_amount:0;

        //address lat & lng
        var latitude = (req.body.params.delivery_address.latitude)?req.body.params.delivery_address.latitude:'';
        var longitude = (req.body.params.delivery_address.longitude)?req.body.params.delivery_address.longitude:'';

        //total amount from json
        var jsone_total_amount = (req.body.params.amount.total_amount) ? req.body.params.amount.total_amount.toFixed(2) : 0;        

        var checkRequest = function(callback) {
            var validateInput = checkoutHelper.validateInput(req.body.params); 
            if(validateInput) {
                callback(errorCodes['-30000'], null);
            } else {
                callback(null);
            }
        };

        var getCustomerData = function(callback) {            
            customerOrderModel.getCustomerData(req.body.params, callback);
        };

        var getCardData = function(data, callback) {            
            customerOrderModel.getCardData(req.body.params, data, callback);
        };

        var getDeliveryAddressData = function(data, callback) {
            customerOrderModel.getDeliveryAddressData(req.body.params, data, callback);
        };

        var updateDeliveryNotes = function(data, callback) {
            customerOrderModel.updateDeliveryNotes(data, callback);
        };

        var getRestaurentData = function(data, callback) {
            customerOrderModel.getRestaurentData(req.body.params, data, callback);
        };

        var getRestaurentMenuData = function(data, callback) {
            var res_menu_data = {};
            food_data.forEach(function(eachVal) {
                asyncTasks.push(function(callback) {
                    var food_id = eachVal.id;
                    var food_qty = eachVal.qty;
                    var choices = eachVal.choices || {};
                    customerOrderModel.getRestaurentMenuData(data, current_menu_id, food_id, food_qty, choices, callback); 
                });
            });
            async.parallel(asyncTasks, function(err, results) {
                try {
                    if (err) {
                        callback(err, null);
                    } else {
                        res_menu_data = data;
                        res_menu_data.food_data = results;
                        callback(null, res_menu_data);
                    }
                } catch (e) {
                    console.log(e);
                    callback(e, null);
                }
            });
        };

        var getMarketOfficeData = function(data, callback) {
            customerOrderModel.getMarketOfficeData(data, callback);
        };

        var getMarketOfficeCityData = function(data, callback) {
            customerOrderModel.getMarketOfficeCityData(data, callback);
        };

        var getMarketOfficeCityDeliveryZoneData = function(data, callback) {
            customerOrderModel.getMarketOfficeCityDeliveryZoneData(data, callback);
        };

        var calculateOrderAmount = function(data, callback) {
            customerOrderModel.calculateOrderAmount(data, tips_amount, tips_percentage, promo_code, callback);
        };

        var checkPromoAbility = function(data, callback) {
            customerOrderModel.checkPromoAbility(data, callback);
        };

        var createOrder = function(data, callback) {
            if(credit_amount <= data.customer_data.credit){
                customerOrderModel.doOrder(data, jsone_total_amount, credit_amount, callback);
            } else {
                callback(errorCodes['-32705'], null);
            }
        };

        var updateOrderStatus = function(data, callback) {
            customerOrderModel.updateOrderStatus(data, callback);
        };

        var redeemePromoCode = function(data, callback) {
            customerOrderModel.redeemePromoCode(data, callback);
        };

        var updateCustomerCredit = function(data, callback) {
            customerOrderModel.updateCustomerCredit(data, callback);
        };

        async.waterfall([
            checkRequest, 
            getCustomerData, 
            getCardData,
            getDeliveryAddressData, 
            updateDeliveryNotes,
            getRestaurentData, 
            getRestaurentMenuData, 
            getMarketOfficeData, 
            getMarketOfficeCityData, 
            getMarketOfficeCityDeliveryZoneData,
            calculateOrderAmount,
            checkPromoAbility,
            createOrder,
            updateOrderStatus,
            redeemePromoCode,
            updateCustomerCredit
        ], function(err, result) {
            try {
                if (err !== null) {
                    response.error = err;
                } else {
                    response.result = result;
                }
            } catch (e) {
                console.log(e);
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        });
    } catch (e) {
        response.error = { "code": "-00000", "message": e.message };
        res.send(response);
    }
}

function getDeliveryZones(req, res) {
    var response = { 'ver': '1.0', 'jsonrpc': '2.0' };

    //initalize
    var state_code = (req.body.params.state) ? req.body.params.state : '';
    var city = (req.body.params.city) ? req.body.params.city : '';

    var checkRequest = function(callback) {
        try {
            if (!state_code || state_code === null) {
                callback(errorCodes["-32014"], null);
            } else if (!(state_code in env.mysql.dbcon_state)) {
                callback(errorCodes["-32008"], null);
            } else if (!city || city === null) {
                callback(errorCodes["-32015"], null);
            } else {
                callback(null, true);
            }
        } catch (e) {
            //Log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var GlobalConfig = function(args, callback) {
      var args = {};
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

    var getZoneList = function(args, callback) {
        customerOrderModel.getZoneList(req.body.params, args, callback);
    };

    async.waterfall([checkRequest, GlobalConfig, getZoneList], function(err, result) {
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
    * API : redeem
    * DETAILS : redeem coupon code
    * VERSION : 1.0
    * REQ : {"ver": "1.0", "jsonrpc": "2.0", "params":{ "promo_code": "","order_amount":"","state_code":"","zone_id":"" }}
    * RES : {}
**/
function promoRedeem(req, res){
    var response = {'ver': '1.0', 'jsonrpc': '2.0'};
    //console.log(req.body.params);
    //initalize
    var customer_id = (req.body.params.customer_id)?req.body.params.customer_id:'';
    var promo_code = (req.body.params.promo_code)?req.body.params.promo_code:'';
    var order_amount = (req.body.params.order_amount)?req.body.params.order_amount:'';
    var state_code = (req.body.params.state_code)?req.body.params.state_code:'';
    var zone_id = (req.body.params.zone_id)?req.body.params.zone_id:'';
    //String(promo_code);
    //if(typeof promo_code === 'number') {
    //zone_id =  zone_id+'';
    //}

    console.log(typeof zone_id);

    var checkRequest = function(callback) {
        try {
            if(!customer_id || !promo_code || !order_amount || !state_code || !zone_id){
                callback(errorCodes['-32014'], null);
            } else {
                callback(null);
            }
        } catch (e) {
            console.log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var checkAbility = function(callback) {
        customerOrderModel.checkAbility(req.body.params, customer_id, callback);
    };

    async.waterfall([ checkRequest,checkAbility ], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            console.log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

function getTaxPercentage(req , res) {
    var response = {'ver': '1.0', 'jsonrpc': '2.0'};
    async.waterfall([
        function(callback) {
            if(req.body.params.state_code!== undefined) { // && req.body.params.zipcode!== undefined
                callback();
            } else {
                callback(errorCodes["-32014"], null);
            }
        },
        function(callback) {
            if(req.body.params.state_code!== undefined && req.body.params.zipcode!== null) {
                console.log('rtrt');
                customerOrderModel.getTaxPercentage(req.body.params , callback);
            } else {
                console.log('mnmn');
                customerOrderModel.getMktOfcTaxPercentage(req.body.params , callback);
            }
        }
    ],
    function(error , result) {
        try{
            if(error) {
                response.error = error;
            } else {
                /*if(result.combined_rate && result.combined_rate !== undefined) {
                    result.taxP = result.combined_rate * 100;
                } else {
                    result.taxP = result.tax_percentage * 100;
                }*/
                response.result = result;
                //console.log(response.result);
            }
        } catch(e){
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

function changeCustomerPhone(req , res) {
    var response = {'ver': '1.0', 'jsonrpc': '2.0'};
    var customer_id = req.body.params.id;
    var phone = req.body.params.phone;
    var vrcode = req.body.params.vrcode;
    async.waterfall([
        function(callback) {
            try
            {
                if (!customer_id && !phone && !vrcode) {
                    callback(errorCodes['-32014'], null);
                } else {
                    callback();
                }
            } catch (e) {
                callback(errorCodes['-32000'], null);
            }
        },
        function(callback) {
            customerOrderModel.fetchCustomerDetails(customer_id, callback);
        },
        function(cusDet , callback) {

            if(cusDet.verified_phone === 'true') {
                callback(errorCodes['-32048'], null);
            } else {
                cusDet.phone_verification_code = cusDet.phone_verification_code + ''; // number to string conversion
                if(cusDet.phone_verification_code === vrcode) {
                    var onfleet = new OnFleet;
                    var recipients = {
                        name: cusDet.first_name + ' ' + cusDet.last_name,
                        phone: cusDet.country_code + phone,
                        notes: cusDet.internal_note,
                        skipSMSNotifications: cusDet.skip_sms_notifications
                    };
                    if (cusDet.onfleet_id === '0' || cusDet.onfleet_id === null) {
                        onfleet.createRecipients(recipients, function(err, data) {
                            if (err) {
                                callback(err, null);
                            }

                            if (err === null && data.id !== undefined) {
                                res_post.onfleet_id = data.id;
                                callback(null , {
                                    id : customer_id,
                                    onfleet_id : data.id,
                                    phone : phone
                                });
                            } else {
                                callback(data.message.cause, null);
                            }
                        });
                    } else {
                        /*var recipients = {
                            id: cusDet.onfleet_id,
                            name: cusDet.first_name + ' ' + cusDet.last_name,
                            phone: cusDet.country_code + phone,
                            notes: cusDet.internal_note,
                            skipSMSNotifications: cusDet.skip_sms_notifications
                        };*/
                        recipients.id = cusDet.onfleet_id;
                        onfleet.updateRecipients(recipients, function(err, data) {
                            if (err === null && data.id !== undefined) {
                                callback(null , {
                                    id : customer_id,
                                    onfleet_id : cusDet.onfleet_id,
                                    phone : phone
                                });
                            } else {
                                callback(data.message.cause, null);
                            }
                        });
                    }
                } else {
                    callback(errorCodes['-32047'], null);
                }
            }

        },
        function(data , callback) {
            customerOrderModel.updateCustomerDetails(data, callback);
        }
    ],function(err , result) {
        try {
            if(err) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch(e){
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

function changeCustomerAddress(req , res) {
    var response = {'ver': '1.0', 'jsonrpc': '2.0'};
    var customerId = req.body.params.customer_id;
    var address = req.body.params.address;
    async.waterfall([
        function(callback) {
            try
            {
                if (!customerId && !address) {
                    callback(errorCodes['-32014'], null);
                } else {
                    callback();
                }
            } catch (e) {
                callback(errorCodes['-32000'], null);
            }
        },
        function(callback) {
            customerOrderModel.createCustomerAddress(req.body.params , callback);
        },
        function(data , newInsertId , callback) {
            customerOrderModel.createDynamoCustomerAddress(data , newInsertId , callback);
        }
    ],function(err , result) {
        try {
            if(err) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch(e){
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

function sendVerificationCode(req , res) {
    var response = {'jsonrpc': '2.0'};
    var customer_id = req.body.params.id;
    async.waterfall([
        function(callback) {
            try
            {
                if (!customer_id) {
                    callback(errorCodes['-32014'], null);
                } else {
                    callback();
                }
            } catch (e) {
                callback(errorCodes['-32000'], null);
            }
        },
        function(callback) {
            var randV = Math.floor((Math.random() * 100000) + 1);
            var newdata = {
                verified_phone : 'false',
                phone_verification_code : randV //shortid.generate()
            };
            customerOrderModel.updateCustomerData(customer_id , newdata , callback);
        },
        /*function(customerId , newData , callback) {
            customerOrderModel.updateCustomerDynamoData(customerId , newData , callback);
        }*/
    ],
        function(err , result) {
            try {
                if(err) {
                    response.error = err;
                } else {
                    response.result = result;
                }
            } catch(e){
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        }

    );
}

function getCustomerCredit(req , res) {
    var customerId = req.params.id;
    var response = {'jsonrpc': '2.0'};
    async.waterfall([
        function(callback) {
            if(!customerId) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        },
        function(callback) {
            customerOrderModel.fetchCustomerDetails(customerId , callback);
        }
    ],
        function(err , result) {
            try{
                if(err){
                    response.error = err;
                } else{
                    response.result = result;
                }
            } catch(e) {
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        }
    );
}

function getCustomerCreditCardInfo(req , res) {
    var customerId = req.params.id;
    var response = {'jsonrpc': '2.0'};
    async.waterfall([
        function(callback) {
            if(!customerId) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        },
        function(callback) {
            customerOrderModel.getCustomerCreditCardInfo(customerId , callback);
        }
    ],
        function(err , result) {
            try{
                if(err){
                    response.error = err;
                } else{
                    response.result = result;
                }
            } catch(e) {
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        }
    );
}

function creditAmountRedeem(req , res) {
    var response = {'jsonrpc': '2.0'};
    var customerId = req.body.params.id;
    async.waterfall([
        function(callback) {
            if(!customerId) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        },
        function(callback) {
            customerOrderModel.checkCreditAmount(customerId , req.body.params , callback);
        }
    ],
        function(err , result) {
            try{
                if(err){
                    response.error = err;
                } else{
                    response.result = result;
                }
            } catch(e) {
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        }
    );
}

/**
    * DETAILS : add credit card
    * REQ : {"jsonrpc": "2.0", "params":{"card_number": "","expiry_month":"", "expiry_year":"", "hartland_token": "", "zip": "", "type":"", "is_default": "" }}
    * RES : {}
**/
function creditCardAdd(req , res) {
    var response = {'jsonrpc': '2.0'};

    //initalize
    var customer_id = req.body.params.id || null;
    var card_number = (req.body.params.card_number)?req.body.params.card_number:'';
    var expiry_month = (req.body.params.expiry_month)?req.body.params.expiry_month:'';
    var expiry_year = (req.body.params.expiry_year)?req.body.params.expiry_year:'';
    var hartland_token = (req.body.params.hartland_token)?req.body.params.hartland_token:'';
    var card_use_type = (req.body.params.type)?req.body.params.type:'';
    var is_default = (req.body.params.is_default)?req.body.params.is_default:'';
    var zip = (req.body.params.zip)?req.body.params.zip:'';

    var req_params = {
        customer_id: customer_id,
        card_number: card_number,
        expiry_month: expiry_month,
        expiry_year: expiry_year,
        hartland_token: hartland_token,
        card_use_type: card_use_type,
        is_default: is_default,
        zip: zip
    };

    var checkRequest = function(callback) {
        try {
            if (!customer_id || card_number === null || !hartland_token || !card_use_type || !is_default || !zip) {
                callback(errorCodes["-30000"], null);
            } else {
                callback(null);
            }
        } catch (e) {
            console.log(e);
            callback(errorCodes['-32000'], null);
        }
    };

    var checkCardLimit = function(callback) {
        customerOrderModel.cardLimit(customer_id, callback);
    };

    var verifyHartlandToken = function(total_card, callback) {
        customerOrderModel.verifyToken(total_card, req_params, callback);
    };

    var addCard = function(card_data, callback) {
        customerOrderModel.addCard(card_data, callback);
    };

    /*var addCardInDynamo = function(dynamo_card_data, callback) {
        var res_dynamo = objHelper.reqParamIntersec(dynamo_card_data, ['id', 'customer_id', 'card_number', 'expiry_month', 'expiry_year', 'card_type', 'card_use_type', 'heartland_mu_token', 'heartland_avs_data','is_default', 'created_at']);
        var res_dynamo_post = objHelper.mapShortCoulumnName(res_dynamo);
        customerOrderModel.addCardInDynamo(res_dynamo_post, callback);
    };*/

    async.waterfall([ checkRequest, checkCardLimit, verifyHartlandToken, addCard ], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            //Log(e);
            console.log(e);
            response.error = errorCodes['-32000'];
        }
        res.send(response);
    });
}

function getMarketOfficeByZoneId (req , res) {
    var response = {'jsonrpc': '2.0'};
    var zoneId = req.body.params.zoneId;
    async.waterfall([
        function(callback) {
            if(!zoneId) {
                callback(errorCodes['-32014'], null);
            } else {
                callback();
            }
        },
        function(callback) {
            customerOrderModel.getMarketOfficeByZoneId(zoneId , callback);
        }
    ],
        function(err , result) {
            try{
                if(err){
                    response.error = err;
                } else{
                    response.result = result;
                }
            } catch(e) {
                response.error = errorCodes['-32000'];
            }
            res.send(response);
        }
    );
}


//# calling the functions
module.exports = {
    createOrder: createOrder,
    getDeliveryZones: getDeliveryZones,
    promoRedeem:promoRedeem,
    getTaxPercentage:getTaxPercentage,
    changeCustomerPhone:changeCustomerPhone,
    sendVerificationCode:sendVerificationCode,
    changeCustomerAddress:changeCustomerAddress,
    getCustomerCredit:getCustomerCredit,
    creditAmountRedeem:creditAmountRedeem,
    creditCardAdd:creditCardAdd,
    getCustomerCreditCardInfo:getCustomerCreditCardInfo,
    getMarketOfficeByZoneId:getMarketOfficeByZoneId,
};
