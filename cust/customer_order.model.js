'use strict';
var async = require("async");
var errorCodes = require(__base + 'server/config/error');
var models = require(__base + 'server/config/sequelize');
var env = require(__base + 'server/config/env');
var underscore = require('underscore');

//Load libraries
var HeartLand = require(__base + 'server/app/libraries/heartland.lib');
var dynamoDb = require(__base + 'server/app/libraries/dynamo.lib');
var firebase = require(__base + 'server/app/libraries/firebase');
var random = require(__base + 'server/app/libraries/random.lib');

//Load helper
var objHelper = require(__base + 'server/app/helpers/object.helper');
var validate = require(__base + 'server/app/helpers/validation');

function getCustomerData(req, callback) {
    try {
        var customer_data = {};
        //fetch customer record
        models.main.customer.findOne({
            attributes: ['country_code', 'phone', 'verified_phone', 'first_name', 'last_name', 'email', 'credit'],
            where: ["id = ?", req.customer_id]
        }).then(function(rows) {
            if(rows){
                if(rows.verified_phone === 'false') {
                    callback(errorCodes["-32707"], null);
                } else {
                    customer_data["customer_data"] = {
                        "customer_id": req.customer_id,
                        "name": rows.first_name + ' ' + rows.last_name,
                        "email": rows.email,
                        "phone": rows.phone,
                        "credit": rows.credit,
                        "country_code": rows.country_code,
                        "verified_phone": rows.verified_phone
                    };
                    callback(null, customer_data);
                }
            } else {
               callback(errorCodes["-30026"], null);
            }
        }, function(err) {
            callback(errorCodes["-32011"], null);
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getCardData(req, data, callback) {
    try {
        var card_data = {};
        var card_id = req.card_info.id;
        if(card_id){
            models.main.customer_credit_card.findOne({
                attributes: ['card_number','heartland_mu_token','heartland_avs_data'],
                where: { id: card_id }
            }).then(function(rows) {
                if(rows){
                    card_data = data;
                    card_data["card_details"] = {
                        "card_number": rows.card_number,
                        "heartland_mu_token": rows.heartland_mu_token,
                        "heartland_avs_data": rows.heartland_avs_data
                    };
                    callback(null, card_data);
                } else {
                   callback(errorCodes["-30029"], null);
                }
            }, function(err) {
                callback(errorCodes["-32011"], null);
            });
        } else {
            models.main.customer_credit_card.findOne({
                attributes: ['card_number','heartland_mu_token','heartland_avs_data'],
                where: { customer_id: data.customer_data.customer_id, is_default: "true" }
            }).then(function(rows) {
                if(rows){
                    card_data = data;
                    card_data["card_details"] = {
                        "card_number": rows.card_number,
                        "heartland_mu_token": rows.heartland_mu_token,
                        "heartland_avs_data": rows.heartland_avs_data
                    };
                    callback(null, card_data);
                } else {
                   callback(errorCodes["-30029"], null);
                }
            }, function(err) {
                callback(errorCodes["-32011"], null);
            });            
        }
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getDeliveryAddressData(req, data, callback) {
    try {
        var delivery_address_data = {};
        var silverware = false;
        if(!validate.isEmpty(req.silverware) ){
            silverware = req.silverware;
        }
        models.main.customer_delivery_address.findOne({
            where: { id: req.delivery_address.id, customer_id: data.customer_data.customer_id}
        }).then(function(rows) {
            if(rows){
                delivery_address_data = data;
                delivery_address_data["delivery_address"] = {
                    "id": rows.id,
                    "state_code": rows.state_code,
                    "timezone": rows.timezone,
                    "zone_id": rows.market_office_city_delivery_zone_id,
                    "address": rows.address,
                    "note": req.delivery_address.note,
                    "market_office_city_id": req.delivery_address.market_office_city_id,
                    "market_office_id": req.delivery_address.market_office_id,
                    "zipcode": req.delivery_address.zipcode,
                    "phone": req.delivery_address.phone,
                    "silverware": silverware,
                    "latitude": rows.latitude,
                    "longitude": rows.longitude
                };
                return !!callback(null, delivery_address_data);
            } else {
               callback(errorCodes["-32706"], null);
            }
        }).catch(function(err) {
            if(err) {
                console.log(err);
                callback({ "code": "-00000", "message": err.message }, null);
            } else {
               callback(errorCodes["-32000"], null);
            }
        });
    } catch (e) {
       if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function updateDeliveryNotes(req, callback){
    try {
        var delivery_notes = (req.delivery_address.note)?req.delivery_address.note:'';
        if(delivery_notes){
            models.main.customer_delivery_address.update({ "note": delivery_notes }, {
                where: ["id = ?", req.delivery_address.id]
            }).then(function(result) {
                if (result > 0) {
                    callback(null, req);
                } else {
                    callback(errorCodes['-32000'], null);
                }
            }).catch(function(err) {
                if(err) {
                    console.log(err);
                    callback({ "code": "-00000", "message": err.message }, null);
                } else {
                   callback(errorCodes["-32000"], null);
                }
            });
        } else {
           callback(null, req);
        }
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getRestaurentData(req, data, callback) {
    try {
        var restaurent_data = {};
        var restaurant_id = req.restaurant_id;
        var ref = firebase.db.ref("restaurant/" + restaurant_id);
        ref.once("value", function(snapshot) {
            var response = snapshot.val();
            restaurent_data = data;
            if (response) {
                restaurent_data["restaurent_data"] = {
                    "restaurant_id": req.restaurant_id,
                    "current_menu_id": req.menu_id,
                    "restaurant_name": response.name
                };
            }
            callback(null, restaurent_data);
        }, function(errorObject) {
            console.log("The read failed: " + errorObject.code);
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getFoodChoicePrice(req, callback) {
    var ref = firebase.db.ref(req);
    ref.once("value", function(snapshot) {
        var result = snapshot.val();
        callback(null, result);
    }, function(errorObject) {
        callback(errorObject, null);
    });
}

function getRestaurentMenuData(req, current_menu_id, food_id, food_qty, choiceDetails, callback) {
    try {
        var menu_data = {};
        var choice_url = [];
        var asyncTasks = [];
        var ref = firebase.db.ref("menu_item/" + current_menu_id + '/' + food_id);
        ref.once("value", function(snapshot) {
            var response = snapshot.val();
            if (response) {
                menu_data.food_id = food_id;
                menu_data.image = response.image;
                menu_data.name = response.name;
                menu_data.note = "Please don't cut in half.";
                menu_data.description = response.description;
                menu_data.retail_price = response.retail_price;
                menu_data.food_qty = food_qty.toString();
                menu_data.wholesale_price = response.wholesale_price;
                menu_data.choiceDetails = choiceDetails;
                Object.keys(choiceDetails).forEach(function(cval) {
                    Object.keys(choiceDetails[cval].options).forEach(function(oval) {
                        choice_url.push("menu_item/" + current_menu_id + '/' + food_id + '/choices/' + cval + '/options/' + oval + '/retail_price');
                    });
                });

                choice_url.forEach(function(choiceval) {
                    asyncTasks.push(function(callback) {
                        getFoodChoicePrice(choiceval, callback);
                    });
                });

                async.parallel(asyncTasks, function(err, results) {
                    try {
                        if (err) {
                            callback(err, null);
                        } else {
                            menu_data.choice_date_url = results;
                            callback(null, menu_data);
                        }
                    } catch (e) {
                        console.log(e);
                        callback(e, null);
                    }
                });
            }
        }, function(errorObject) {
            callback(errorObject, null);
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getMarketOfficeData(req, callback) { /*promise error*/
    try {
        var mkt_office_data = {};
        //fetch market_office record
        models[req.delivery_address.state_code].market_office.findOne({
            attributes: ['id', 'office_name', 'tax_percentage'],
            where: ["id = ?", req.delivery_address.market_office_id]
        }).then(function(rows) {
            if(!validate.isEmpty(req.delivery_address.zipcode)){
                //checking has tax with this zip code
                models[req.delivery_address.state_code].tax_table.findOne({
                    attributes: ['combined_rate'],
                    where: ["zip_code = ?", req.delivery_address.zipcode]
                }).then(function(val) {
                    if(val.combined_rate){
                        mkt_office_data = req;
                        mkt_office_data["mkt_office_data"] = {
                            "from": "combined_rate_tax",
                            "market_office_id": rows.id,
                            "market_office_name": rows.office_name,
                            "tax_percentage": val.combined_rate
                        };
                        callback(null, mkt_office_data);
                    } else {
                        mkt_office_data = req;
                        mkt_office_data["mkt_office_data"] = {
                            "from": "market_office_tax",
                            "market_office_id": rows.id,
                            "market_office_name": rows.office_name,
                            "tax_percentage": rows.tax_percentage
                        };
                        callback(null, mkt_office_data);
                    }
                }, function(err) {
                    callback(errorCodes["-32011"], null);
                });
            } else {
                mkt_office_data = req;
                mkt_office_data["mkt_office_data"] = {
                    "from": "market_office_tax",
                    "market_office_id": rows.id,
                    "market_office_name": rows.office_name,
                    "tax_percentage": rows.tax_percentage
                };
                callback(null, mkt_office_data);
            }
        }, function(err) {
            callback(errorCodes["-32011"], null);
        });
    } catch (e) {
       if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getMarketOfficeCityData(req, callback) {
    try {
        var mkt_office_city_data = {};
        //fetch market_office_city record
        models[req.delivery_address.state_code].market_office_city.findOne({
            attributes: ['id', 'city_name'],
            where: ["id = ?", req.delivery_address.market_office_city_id]
        }).then(function(rows) {
            if(rows){
                mkt_office_city_data = req;
                mkt_office_city_data["mkt_office_city_data"] = {
                    "market_office_city_id": rows.id,
                    "market_office_city_name": rows.city_name
                };
                callback(null, mkt_office_city_data);
            } else {
                callback(errorCodes["-30027"], null);
            }
        }, function(err) {
            callback(errorCodes["-32011"], null);
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getMarketOfficeCityDeliveryZoneData(req, callback) {
    try {
        var mkt_office_city_dz_data = {};

        //fetch market_office_city_delivery_zone record
        models[req.delivery_address.state_code].market_office_city_delivery_zone.findOne({
            attributes: ['id', 'delivery_zone_name'],
            where: ["id = ?", req.delivery_address.zone_id]
        }).then(function(rows) {
            mkt_office_city_dz_data = req;
            if(rows){
                mkt_office_city_dz_data["mkt_office_city_delivery_zone_data"] = {
                    "market_office_city_delivery_zone_id": rows.id,
                    "market_office_city_delivery_zone_name": rows.delivery_zone_name
                };
            }
            callback(null, mkt_office_city_dz_data);
        }, function(err) {
            callback(errorCodes["-32011"], null);
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function calculateChoicePrice(req, callback){
    var choice_amount = 0;
    req.forEach(function(val) {
        if(val !== null){
            choice_amount += parseFloat(val);
        }
    });
    return choice_amount;
}

function calculateOrderAmount(req, tips_amount, tips_percentage, promo_code, callback) {
    try {
        var order_data = {};
        var total_food_cost = 0;
        var tax = 0;
        var itemCounts = 0;

        req.food_data.forEach(function(val) {
            itemCounts += parseFloat(val.food_qty);

            var choicePrice = calculateChoicePrice(val.choice_date_url,callback);
            var per_food_cost = parseFloat(val.retail_price);
            var per_food_choice_cost = parseFloat(choicePrice);
            var per_food_qty = parseFloat(val.food_qty);

            var food_cost = (per_food_cost + per_food_choice_cost);
            total_food_cost += food_cost * per_food_qty;
        });

        tax = (req.mkt_office_data.tax_percentage * 100);

        order_data = req;
        order_data["order_data"] = {
            "total_food_cost": total_food_cost,
            "promo_code": promo_code,
            "tips_amount": tips_amount,
            "tips_percentage": tips_percentage,
            "tax": tax,
            "item_count": itemCounts,
        };
        callback(null, order_data);
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function hasOrder(customer_id,order_status, callback){
    try{
        models.main.order.count({
            where: { customer_id: customer_id,order_status: order_status }
        }).then(function(c) {
            callback(null, c);
        }).catch(function(err) {
            if(err) {
                console.log(err);
                callback({ "code": "-00000", "message": err.message }, null);
            } else {
               callback(errorCodes["-32000"], null);
            }
        });
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function chkredeemed(coupon_code_id, customer_data, callback){
    models.main.foodjets_promo_code_redeemed.count({
        where: {
            foodjets_coupon_code_id: coupon_code_id,
            $or: [
                {
                    customer_id:
                    {
                        $eq: customer_data.customer_id
                    }
                },
                {
                    email:
                    {
                        $eq: customer_data.email
                    }
                },
                {
                    phone:
                    {
                        $eq: customer_data.country_code+customer_data.phone
                    }
                }
            ]
        }
    }).then(function(c) {
        callback(null, c);
    }).catch(function(err) {
        if(err) {
            console.log(err);
            callback({ "code": "-00000", "message": err.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    });
}

function checkPromoAbility(req, callback) { /*promise error*/
    try {
        var promocode_data = {};
        var order_amount = req.order_data.total_food_cost;
        var promo_code = (req.order_data.promo_code)?req.order_data.promo_code:null;
        var state_code =  (req.delivery_address.state_code)?req.delivery_address.state_code:null;
        if(promo_code) {
            models.main.foodjets_promo_code.findOne({
                where: { code: promo_code, state_code: state_code },
                attributes: ['id','market_office_id','market_office_city_delivery_zone_id','new_customer_only','use_once_per_customer','min_order_amount','max_uses','amount','type','start_date','end_date','active']
            }).then(function(rows) {
                if (rows) {
                    //check exist is zone
                    if(rows.market_office_city_delivery_zone_id !== req.delivery_address.zone_id.toString()) callback(errorCodes['-32051'], null);

                    //check status
                    if(rows.active === 'false') callback(errorCodes['-32050'], null);

                    //check expiry
                    var isPcodeExpire = objHelper.checkPromoExpiry(rows.start_date,rows.end_date);
                    if(isPcodeExpire) callback(errorCodes['-32052'], null);

                    //checking new customer
                    if(rows.new_customer_only === 'true'){
                        hasOrder(req.customer_data.customer_id,"Processing", function(err, data){
                            if(err){
                                console.log(err);
                                callback(err, null);
                            } else {
                                if(data > 0) callback(errorCodes['-32053'], null);
                            }
                        });
                    } else {
                        if (rows.use_once_per_customer === 'true') { // when use_once_per_customer =true
                            if (rows.min_order_amount > 0) { // when coupon's min_order_amount is > than 0
                                if (order_amount >= rows.min_order_amount) { // when coupon's min_order_amount is < than order amount
                                    chkredeemed(rows.id, req.customer_data, function(err, data){
                                        if(err){
                                            console.log(err);
                                            callback(err, null);
                                        } else {
                                            if(data > 0) {
                                                callback(errorCodes['-32054'], null);
                                            } else {
                                                promocode_data = req;
                                                promocode_data["promocode_data"] = {
                                                    "id": rows.id,
                                                    "amount": rows.amount,
                                                    "type": rows.type
                                                };
                                                callback(null, promocode_data);
                                            }
                                        }
                                    });
                                } else {
                                    callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"'+ rows.min_order_amount+'" dollars before tax"}', null);
                                }
                            } else {
                                promocode_data = req;
                                promocode_data["promocode_data"] = {
                                    "id": rows.id,
                                    "amount": rows.amount,
                                    "type": rows.type
                                };
                                callback(null, promocode_data);
                            }
                        } else { // when use_once_per_customer =false
                            if (rows.max_uses > 0) {
                                models.main.foodjets_promo_code_redeemed.count({
                                    where: { foodjets_coupon_code_id: rows.id }
                                }).then(function(utime) {
                                    if (utime < rows.max_uses) { // when coupon's max_uses less than redeemed table's count
                                        if (rows.min_order_amount > 0) { // when coupon's min_order_amount is > than 0
                                            if (order_amount >= rows.min_order_amount) { // when coupon's min_order_amount is < than order amount
                                                promocode_data = req;
                                                promocode_data["promocode_data"] = {
                                                    "id": rows.id,
                                                    "amount": rows.amount,
                                                    "type": rows.type
                                                };
                                                callback(null, promocode_data);
                                            } else {
                                                callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"'+ rows.min_order_amount+'" dollars before tax"}', null);
                                            }
                                        } else {
                                            promocode_data = req;
                                            promocode_data["promocode_data"] = {
                                                "id": rows.id,
                                                "amount": rows.amount,
                                                "type": rows.type
                                            };
                                            callback(null, promocode_data);
                                        }
                                    } else {
                                        callback(errorCodes['-32057'], null);
                                    }
                                }).catch(function(err) {
                                    console.log(err);
                                    callback(err, null);
                                });
                            } else {
                                if (rows.min_order_amount > 0) {
                                    if (order_amount >= rows.min_order_amount) {
                                        promocode_data = req;
                                        promocode_data["promocode_data"] = {
                                            "id": rows.id,
                                            "amount": rows.amount,
                                            "type": rows.type
                                        };
                                        callback(null, promocode_data);
                                    } else {
                                        callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"'+ rows.min_order_amount+'" dollars before tax"}', null);
                                    }
                                } else {
                                    promocode_data = req;
                                    promocode_data["promocode_data"] = {
                                        "id": rows.id,
                                        "amount": rows.amount,
                                        "type": rows.type
                                    };
                                    callback(null, promocode_data);
                                }
                            }
                        }
                    }
                } else {
                    callback(errorCodes['-32050'], null);
                }
            }).catch(function(err) {
                if(err) {
                    console.log(err);
                    callback({ "code": "-00000", "message": err.message }, null);
                } else {
                   callback(errorCodes["-32000"], null);
                }
            });
        } else {
            promocode_data = req;
            promocode_data["promocode_data"] = {
                "id": null,
                "amount": null,
                "type": null
            };
            callback(null, promocode_data);
        }
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function doOrder(req, jsone_total_amount, credit_amount, callback) {
    try {

        var response = {};
        var food_details = [];
        var isAdjusted = 'false';

        var credit_amount = (credit_amount > 0)?credit_amount:0;
        var tax_amount = 0;
        var remain_credits = 0;
        var gross_amount = 0;
        var total_amount = 0;
        var sub_total_amount = 0;
        var maneged_coupon_amount = 0;

        var food_cost = (req.order_data.total_food_cost)?req.order_data.total_food_cost:0;
        var total_food_cost =  objHelper.round(food_cost);
        var selling_amount = total_food_cost;
        var tax = (req.order_data.tax)?req.order_data.tax:0;

        console.log("total_food_cost", total_food_cost);
        
        var tips_percentage = (req.order_data.tips_percentage)?req.order_data.tips_percentage:0;
        var tips_amount = (req.order_data.tips_amount)?req.order_data.tips_amount:0;

        //manageing coupon
        var coupon_type = (req.promocode_data.type)?req.promocode_data.type:null;
        if (coupon_type === 'Percentage') {
            var coupon_amount =  objHelper.round(parseFloat((total_food_cost * req.promocode_data.amount) / 100));
        } else {
            var coupon_amount = (req.promocode_data.amount)?objHelper.round(req.promocode_data.amount):0;
        } 
        
        if(selling_amount !== coupon_amount && selling_amount > coupon_amount) {
            gross_amount = parseFloat(selling_amount - coupon_amount);
        } else if (selling_amount !== coupon_amount && selling_amount < coupon_amount) {
            isAdjusted = 'true';
            maneged_coupon_amount = total_food_cost;
        } else if (selling_amount === coupon_amount) {
            isAdjusted = 'true';
            gross_amount = 0;
            maneged_coupon_amount = total_food_cost;
        } else {
            gross_amount = selling_amount;
            maneged_coupon_amount = total_food_cost;
        }
        console.log("coupon_amount : ",coupon_amount,"gross_amount : ",gross_amount,"isAdjusted : ", isAdjusted, "maneged_coupon_amount : ",maneged_coupon_amount);
        //end 

        //manageing credit
        if(gross_amount > 0) {
            if (gross_amount > credit_amount) {
                gross_amount = parseFloat(gross_amount - credit_amount);
                remain_credits = parseFloat(req.customer_data.credit - credit_amount);
            } else if (gross_amount === credit_amount) {
                isAdjusted = 'true';
                gross_amount = 0;
                remain_credits = parseFloat(req.customer_data.credit - credit_amount);
            } else {
                isAdjusted = 'true';
                gross_amount = 0;
                remain_credits = parseFloat(req.customer_data.credit - credit_amount);
            }
        }
        console.log("remain_credits :: ", remain_credits, "gross_amount :: ",gross_amount ,"isAdjusted : ", isAdjusted);
        //end

        //calculating tax
        tax_amount = objHelper.round(parseFloat((gross_amount * tax) / 100));
        console.log("tax_amount :: ",tax_amount );

        gross_amount = objHelper.round(gross_amount);
        sub_total_amount = objHelper.round(gross_amount + tax_amount);
        console.log("gross_amount :: ", gross_amount, "sub_total_amount + tax_amount :: ",sub_total_amount );

        //manageing tips
        if(tips_percentage == 0 && tips_amount > 0) {
            tips_amount = objHelper.round(parseFloat(req.order_data.tips_amount));
        } else {
            tips_amount = objHelper.round(parseFloat(((sub_total_amount * tips_percentage) / 100)));
        }        

        //this amount need to pay
        total_amount = objHelper.round(sub_total_amount + tips_amount); 
        if(total_amount > 0) { 
            isAdjusted = 'false';
        }          
        //end
        console.log("total_amount=(sub_total_amount + tips_amount) :: ", total_amount, "tips_amount :: ",tips_amount,"tips_percentage :: ",tips_percentage, "isAdjusted :: ",isAdjusted );

        var order_req = {
            order_number: random.hat(5),
            state_code: req.delivery_address.state_code,
            market_office_id: req.delivery_address.market_office_id,
            market_office_name: req.mkt_office_data.market_office_name,
            market_office_city_id: req.mkt_office_city_data.market_office_city_id,
            market_office_city_name: req.mkt_office_city_data.market_office_city_name,
            market_office_city_delivery_zone_id: req.mkt_office_city_delivery_zone_data.market_office_city_delivery_zone_id,
            market_office_city_delivery_zone_name: req.mkt_office_city_delivery_zone_data.market_office_city_delivery_zone_name,
            restaurant_id: req.restaurent_data.restaurant_id,
            restaurant_name: req.restaurent_data.restaurant_name,
            customer_delivery_address: req.delivery_address.address,
            tax_percentage: tax,
            tax_amount: tax_amount.toString(),
            gross_amount: gross_amount,
            total_amount: total_amount,
            tips_amount: tips_amount,
            tips_percentage: tips_percentage,
            coupon_id: req. promocode_data.id,
            coupon_code: req.order_data.promo_code,
            coupon_amount: coupon_amount,
            credit: credit_amount,
            note: req.delivery_address.note,
            country_code: req.customer_data.country_code,
            phone: req.customer_data.phone,
            name: req.customer_data.name,
            email: req.customer_data.email,
            silverware: req.delivery_address.silverware,           
            created_at: objHelper.now(),
            updated_at: objHelper.now(true),
            order_platform: env.order_platform,
            customer_id: req.customer_data.customer_id
        };

        req.food_data.forEach(function(val) {
            food_details.push({
                "food_id": val.food_id,
                "image": val.image,
                "name": val.name,
                "note": val.note,
                "description": val.description,
                "retail_price": val.retail_price,
                "food_qty": val.food_qty,
                "wholesale_price": val.wholesale_price,
                "choices": val.choiceDetails
            })
        });

        var order_details_req = {
            total_items: req.order_data.item_count.toString(),
            pickup_time: objHelper.now(),
            avg_delivery_time: "11",
            tax_amount: order_req.tax_amount.toString(),
            total_food_cost: total_food_cost.toString(),
            total_amount: order_req.total_amount.toString(),
            gross_amount: order_req.gross_amount.toString(),
            order_status: "ord_proc_rstrnt",
            driver_status: "drv_strt_rstrnt_tsk",
            items: food_details
        };

        console.log("jsone_total_amount :: ",jsone_total_amount +'==' +"total_amount :: ",total_amount);
        if (jsone_total_amount == total_amount) {
            var heartland_card_number = (req.card_details.card_number)?new Buffer(req.card_details.card_number, 'base64').toString():'';
            var heartland_mu_token = (req.card_details.heartland_mu_token)?req.card_details.heartland_mu_token:null;
            var heartland_avs_data = (req.card_details.heartland_avs_data)?req.card_details.heartland_avs_data:null;
            var payable_amount = total_amount;
            if (total_amount > 0 && isAdjusted === 'false') {   //need to pay charged amount
                if(heartland_mu_token) {
                    //add data to order table
                    models.main.order.create(order_req).then(function(rows) {
                        if (rows.id) {
                            var order_id = rows.id;
                            var order_number = (order_req.state_code +'00'+ rows.id).toUpperCase();
                            var firebase_order_id = (order_req.state_code + rows.id).toUpperCase();

                            //adding data in order details table
                            order_details_req.order_number = order_number;
                            var ref = firebase.db.ref("order_details/" + order_req.restaurant_id + '/' + firebase_order_id);
                            ref.set(order_details_req).then(function(res) {
                                //making hartland payment
                                var heartland = new HeartLand;
                                var cardHolder = {
                                    address: {
                                        zip: heartland_avs_data,
                                    }
                                };

                                heartland.authorize(payable_amount, "usd", heartland_mu_token, cardHolder, false, null, function(err, data) {
                                    if(err) {
                                        console.log(err);
                                        callback(errorCodes["-35000"], null);
                                    } else { 
                                        if(!validate.isEmpty(data.responseText) && data.responseText === "APPROVAL"){
                                            var transactionId = data.transactionId;
                                            var authorizationCode = data.authorizationCode;
                                            var referenceNumber = data.referenceNumber;
                                            var cardType = data.cardType;
                                            var updated_order_data = {
                                                "order_number": order_number,
                                                "transaction_id": transactionId,
                                                "authorization_code": authorizationCode,
                                                "reference_number": referenceNumber,
                                                "card_type": cardType,
                                                "card_number": heartland_card_number,
                                                "heartland_avs_data": heartland_avs_data,
                                                "payment_status": "Charged",
                                                "updated_at": objHelper.now(true)
                                            };

                                            response = req;
                                            response["remain_credit"] = remain_credits;
                                            response["order_id"] = order_id;
                                            response["order_number"] = order_number;
                                            response["transaction_details"] = updated_order_data;
                                            callback(null, response);
                                        } else {
                                           callback(errorCodes["-35000"], null); 
                                        }
                                    }
                                });                            
                            }).catch(function(error) {
                                callback(error, null);
                            });
                        } else {
                            console.log('here else');
                            callback(errorCodes['-32011'], null);
                        }
                    }, function(err) {
                        callback(err, null);
                    });
                } else {
                    callback(errorCodes['-30029'], null);
                }
            } else { //no need to pay 
                //add data to order table
                models.main.order.create(order_req).then(function(rows) {
                    if (rows.id) {
                        var order_id = rows.id;
                        var order_number = (order_req.state_code +'00'+ rows.id).toUpperCase();
                        var firebase_order_id = (order_req.state_code + rows.id).toUpperCase();

                        //adding data in order details table
                        order_details_req.order_number = order_number;
                        var ref = firebase.db.ref("order_details/" + order_req.restaurant_id + '/' + firebase_order_id);
                        ref.set(order_details_req).then(function(res) {                            
                            var updated_order_data = {
                                "order_number": order_number,
                                "transaction_id": 0,
                                "card_type": null,
                                "card_number": null,
                                "heartland_avs_data": null,
                                "payment_status": "Credited",
                                "updated_at": objHelper.now(true)
                            };

                            response = req;
                            response["remain_credit"] = remain_credits;
                            response["order_id"] = order_id;
                            response["order_number"] = order_number;
                            response["transaction_details"] = updated_order_data;
                            callback(null, response);
                        }).catch(function(error) {
                            callback(error, null);
                        });
                    } else {
                        console.log('here else');
                        callback(errorCodes['-32011'], null);
                    }
                }, function(err) {
                    callback(err, null);
                });
            } 
        } else {
            callback(errorCodes['-32049'], null);
        }
    } catch (e) {
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function updateOrderStatus(data, callback){
    try {
        models.main.order.update(data.transaction_details, {
            where: ["id = ?", data.order_id]
        }).then(function(result) {
            if (result > 0) {
                callback(null, data);
            } else {
                callback(errorCodes['-32000'], null);
            }
        }).catch(function(err) {
            console.log(err);
            callback(err, null);
        });
    } catch(e){
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function redeemePromoCode(data, callback){
    try { 
        if(!validate.isEmpty(data.order_data.promo_code)){
            //console.log(data); return false;
            var coupondata = {
                "foodjets_coupon_code_id" : data.promocode_data.id,
                "customer_id": data.customer_data.customer_id,
                "email" :  data.customer_data.email,
                "phone": data.customer_data.country_code + data.customer_data.phone,
                "order_number": data.order_number,
                "time_stamp": objHelper.now()
            }; 

            models.main.foodjets_promo_code_redeemed.create(coupondata).then(function(rows) {
                if (rows.foodjets_coupon_code_id) {
                    callback(null, data);
                } else {
                    callback(errorCodes['-32011'], null);
                }
            }).catch(function(err) {
                if(err) {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            callback(null, data);
        }
    } catch(e){
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function updateCustomerCredit(data, callback){
    try { 
        var customerdata = {
            "credit": data.remain_credit
        };

        models.main.customer.update(customerdata, {
            where: ["id = ?", data.customer_data.customer_id]
        }).then(function(result) {
            if (result > 0) {
                callback(null, data); 
            } else {
                callback(errorCodes['-32000'], null);
            }
        }).catch(function(err) {
            if(err) {
                console.log(err);
                callback({ "code": "-00000", "message": err.message }, null);
            } else {
               callback(errorCodes["-32000"], null);
            }
        });
    } catch(e){
        if(e) {
            console.log(e);
            callback({ "code": "-00000", "message": e.message }, null);
        } else {
           callback(errorCodes["-32000"], null);
        }
    }
}

function getZoneList(req, args, cb) {
    var con = models[req.state];

    var query = 'SELECT mcz.id, mcz.delivery_zone_name, mcz.selected_area, mcz.max_dist_srt, mo.timezone, mcz.market_office_city_id, mc.market_office_id, dzo.is_open, dzo.shift FROM market_office_city_delivery_zone AS mcz LEFT JOIN market_office_city AS mc ON(mcz.market_office_city_id = mc.id) LEFT JOIN market_office AS mo ON(mc.market_office_id = mo.id) LEFT JOIN delivery_zone_operation_hour AS dzo ON ( dzo.market_office_city_delivery_zone_id = mcz.id AND dzo.`day` = LEFT(LOWER(DAYNAME(CONVERT_TZ(now(),@@session.time_zone, mo.timezone))) , 3) AND (CONVERT_TZ(now(),@@session.time_zone, mo.timezone) BETWEEN dzo.start_time AND dzo.end_time)) WHERE mc.city_name LIKE \'' + req.city + '\' GROUP BY mcz.id';

    con.sequelize.query(query, {
        type: con.sequelize.QueryTypes.SELECT
    }).then(function(rows) {
        if (rows.length > 0) {
            underscore.reduce(rows, function(o, n) {
                try {
                    n.selected_area = JSON.parse(new Buffer(n.selected_area, 'base64').toString())
                    n.FOODJETS_CAR_SPEED = args.FOODJETS_CAR_SPEED;
                    n.RESTAURANTS_BUFFER_TIME = args.RESTAURANTS_BUFFER_TIME;
                } catch (e) {
                    console.log(e);
                    n.selected_area = null;
                }
                o.push(n);
                return o;
            }, [])
        }
        cb(null, rows);
    }, function(err) {
      console.log(err);
        cb(errorCodes['-32000'], null);
    });
}

function checkAbility(req, customer_id, callback) {
    try {
        var response = {};
        models.main.foodjets_promo_code.findOne({
            where: {
                code: req.promo_code,
                state_code: req.state_code
            },
            attributes: ['id', 'market_office_id', 'market_office_city_delivery_zone_id', 'new_customer_only', 'use_once_per_customer', 'min_order_amount', 'max_uses', 'amount', 'type', 'start_date', 'end_date', 'active']
        }).then(function(rows) {
            //console.log(rows);
            if (rows) {
                //console.log(rows.market_office_city_delivery_zone_id);
                req.zone_id = req.zone_id + ''; // number to string conversion
                //check exist is zone
                if (rows.market_office_city_delivery_zone_id !== req.zone_id) {
                    callback(errorCodes['-32051'], null);
                }

                //check status
                if (rows.active === 'false') callback(errorCodes['-32050'], null);

                //check expiry
                var isPcodeExpire = objHelper.checkPromoExpiry(rows.start_date, rows.end_date);
                if (isPcodeExpire) callback(errorCodes['-32052'], null);

                //checking new customer
                if (rows.new_customer_only === 'true') {
                    hasOrder(customer_id, "Processing", function(err, data) {
                        if (err) {
                            console.log(err);
                            callback(err, null);
                        } else {
                            if (data > 0) callback(errorCodes['-32053'], null);
                        }
                    });
                } else {
                    models.main.customer.findOne({
                        where: {
                            id: customer_id
                        },
                        attributes: ['id', 'email', 'country_code', 'phone']
                    }).then(function(crows) {
                        if (rows.use_once_per_customer === 'true') { // when use_once_per_customer =true
                            if (rows.min_order_amount > 0) { // when coupon's min_order_amount is > than 0
                                if (req.order_amount >= rows.min_order_amount) { // when coupon's min_order_amount is < than order amount
                                    chkredeemedById(rows.id, crows.id, function(err, data) {
                                        if (err) {
                                            console.log(err);
                                            callback(err, null);
                                        } else {
                                            if (data > 0) {
                                                callback(errorCodes['-32054'], null);
                                            } else {
                                                response.id = rows.id;
                                                response.amount = rows.amount;
                                                response.type = rows.type;
                                                callback(null, response);
                                            }
                                        }
                                    });

                                    chkredeemedByEmail(rows.id, crows.email, function(err, data) {
                                        if (err) {
                                            console.log(err);
                                            callback(err, null);
                                        } else {
                                            if (data > 0) {
                                                callback(errorCodes['-32055'], null);
                                            } else {
                                                response.id = rows.id;
                                                response.amount = rows.amount;
                                                response.type = rows.type;
                                                callback(null, response);
                                            }
                                        }
                                    });

                                    chkredeemedByPhone(rows.id, crows.country_code + crows.phone, function(err, data) {
                                        if (err) {
                                            console.log(err);
                                            callback(err, null);
                                        } else {
                                            if (data > 0) {
                                                callback(errorCodes['-32056'], null);
                                            } else {
                                                response.id = rows.id;
                                                response.amount = rows.amount;
                                                response.type = rows.type;
                                                callback(null, response);
                                            }
                                        }
                                    });
                                } else {
                                    callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"' + rows.min_order_amount + '" dollars before tax"}', null);
                                }
                            } else {
                                response.id = rows.id;
                                response.amount = rows.amount;
                                response.type = rows.type;
                                callback(null, response);
                            }
                        } else { // when use_once_per_customer =false
                            if (rows.max_uses > 0) {
                                models.main.foodjets_promo_code_redeemed.count({
                                    where: {
                                        foodjets_coupon_code_id: rows.id
                                    }
                                }).then(function(utime) {
                                    if (utime < rows.max_uses) { // when coupon's max_uses less than redeemed table's count
                                        if (rows.min_order_amount > 0) { // when coupon's min_order_amount is > than 0
                                            if (req.order_amount >= rows.min_order_amount) { // when coupon's min_order_amount is < than order amount
                                                response.id = rows.id;
                                                response.amount = rows.amount;
                                                response.type = rows.type;
                                                callback(null, response);
                                            } else {
                                                callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"' + rows.min_order_amount + '" dollars before tax"}', null);
                                            }
                                        } else {
                                            response.id = rows.id;
                                            response.amount = rows.amount;
                                            response.type = rows.type;
                                            callback(null, response);
                                        }
                                    } else {
                                        callback(errorCodes['-32057'], null);
                                    }
                                }).catch(function(err) {
                                    console.log(err);
                                    callback(err, null);
                                });
                            } else {
                                if (rows.min_order_amount > 0) {
                                    if (req.order_amount >= rows.min_order_amount) {
                                        response.id = rows.id;
                                        response.amount = rows.amount;
                                        response.type = rows.type;
                                        callback(null, response);
                                    } else {
                                        callback('{"code":-32057,"message":"This coupon is valid for orders greater or equal to $"' + rows.min_order_amount + '" dollars before tax"}', null);
                                    }
                                } else {
                                    response.id = rows.id;
                                    response.amount = rows.amount;
                                    response.type = rows.type;
                                    callback(null, response);
                                }
                            }
                        }
                    }).catch(function(err) {
                        console.log(err);
                        callback(err, null);
                    });
                }
            } else {
                callback(errorCodes['-32050'], null);
            }
        }).catch(function(err) {
            //console.log('Here : ',err);
            callback(err, null);
        });
    } catch (err) {
        //console.log(err);
        callback(err, null);
    }
}

function chkredeemedById(coupon_code_id, customer_id, callback) {
    models.main.foodjets_promo_code_redeemed.count({
        where: {
            foodjets_coupon_code_id: coupon_code_id,
            customer_id: customer_id
        }
    }).then(function(c) {
        callback(null, c);
    }).catch(function(err) {
        callback(err, null);
    });
}

function chkredeemedByEmail(coupon_code_id, email, callback) {
    models.main.foodjets_promo_code_redeemed.count({
        where: {
            foodjets_coupon_code_id: coupon_code_id,
            email: email
        }
    }).then(function(c) {
        callback(null, c);
    }).catch(function(err) {
        callback(err, null);
    });
}

function chkredeemedByPhone(coupon_code_id, phone, callback) {
    models.main.foodjets_promo_code_redeemed.count({
        where: {
            foodjets_coupon_code_id: coupon_code_id,
            phone: phone
        }
    }).then(function(c) {
        callback(null, c);
    }).catch(function(err) {
        callback(err, null);
    });
}

function getTaxPercentage(params, callback) {
    models[params.state_code].tax_table.findOne({
        where: {
            state: params.state_code,
            zip_code: params.zipcode
        },
        attributes: ['combined_rate']
    }).then(function(rows) {
        callback(null, rows);
        /*if (rows.combined_rate) {
            callback(null, rows);
        } else {
            callback(errorCodes['-32011'], null);
        }*/

    }).catch(function(err) {
        callback(err, null);
    });
}

function getMktOfcTaxPercentage(params, callback) {
    models[params.state_code].market_office.findOne({
        where: {
            id: params.marketOffice
        },
        attributes: ['tax_percentage']
    }).then(function(rows) {
        callback(null, rows);
        /*if(rows.tax_percentage) {
            callback(null, rows);
        } else {
            callback(errorCodes['-32011'], null);
        }*/
    });
}

function fetchCustomerDetails(id, callback) {
    models.main.customer.findOne({
        where : {id : id},
        attributes: ['country_code', 'phone', 'first_name', 'last_name', 'skip_sms_notifications' , 'internal_note' , 'onfleet_id' , 'phone_verification_code' , 'verified_phone' , 'credit']
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes['-32011'], null);
    });
}

function updateCustomerData(id , newdata , callback) {
    models.main.customer.update(newdata , {
        where : {id : id}
    }).then(function(rows) {
        if (rows > 0) {
            callback(null, 'Verification code successfully sent.');
        } else {
            callback(errorCodes['-35005'], null);
        }
    }, function(err) {
        callback(errorCodes['-32011'], null);
    });
}

function updateCustomerDetails(data , callback) {
    var newdata = {
        onfleet_id : data.onfleet_id,
        phone : data.phone,
        phone_verification_code : 0,
        verified_phone : 'true'
    };
    models.main.customer.update(newdata , {
        where : {id : data.id}
    }).then(function(rows) {
        if (rows > 0) {
            callback(null, 'Phone number successfully updated.');
        } else {
            callback(errorCodes['-35005'], null);
        }
    }, function(err) {
        callback(errorCodes['-32011'], null);
    });
}

function createCustomerAddress(newdata , callback) {
    newdata.created_at = objHelper.now();
    models.main.customer_delivery_address.create(newdata).then(function(rows) {
        if (rows.id > 0) {
            callback(null, newdata , rows.id);
        } else {
            callback(errorCodes['-35005'], null);
        }
    }, function(err) {
        callback(errorCodes['-32011'], null);
    });
}

function createDynamoCustomerAddress(newdata , newInsertId , callback) {

    newdata.created_at = objHelper.now();
    newdata.id = newInsertId;
    newdata.customer_id = Number(newdata.customer_id);
    var dynamo = new dynamoDb();
    var params = {};

    var res_dynamo = objHelper.reqParamIntersec(newdata, ['id', 'customer_id', 'state_code', 'market_office_city_delivery_zone_id', 'address', 'latitude','longitude']);
    var res_dynamo_post = objHelper.mapShortCoulumnName(res_dynamo);

    params.TableName = env.dynamo.tbl_prefix + 'customer_delivery_address';
    params.Item = res_dynamo_post;
    dynamo.putItem(params, function(err, data) {
        if (err !== null) {
            callback(err, null);
        } else {
            callback(null, 'Customer delivery address successfully added.');
        }
    });
}

function checkCreditAmount(id , data , callback) {
    //console.log(data.order_amount.toFixed(2));
    //console.log(data.credit_amount);
    models.main.customer.findOne({
        where : {id : id},
        attributes: ['credit']
    }).then(function(rows) {
        //console.log(rows);
        if(data.order_amount < 5.00) {
            callback('Order amount should be greater than $5.00', null);
        } else if(parseInt(data.credit_amount) > rows.credit) {
            callback('Credit amount is greater than credit limit', null);
        } else if(data.order_amount < data.credit_amount) {
            //console.log('type' , typeof data.order_amount , 'val' , data.order_amount);
            //console.log('type' , typeof rows.credit , 'val' , rows.credit);
            //callback('Credit amount is greater than total order amount', null);
            var credit_to_apply = {'value' : parseFloat(data.order_amount)};
            callback(null , credit_to_apply);
        } else if(data.order_amount === data.credit_amount){
            var credit_to_apply = {'value' : parseFloat(data.credit_amount)};
            callback(null , credit_to_apply);
        } else {
            var credit_to_apply = {'value' : parseFloat(data.credit_amount)};
            callback(null , credit_to_apply);
        }
    }, function(err) {
        callback(errorCodes['-32011'], null);
    });
}




/*################################  Credit card add section starts ####################################*/
//Count card against customer
function cardLimit(customer_id, callback){
    models.main.customer_credit_card.count({
        where: ["customer_id = ?", customer_id]
    }).then(function(c) {
        if (c >= 5) { // fjconfig.max_card_limit
            callback(errorCodes['-35003'], null);
        } else {
            callback(null,c);
        }
    }).catch(function(err) {
        console.log(err);
        callback(err, null);
    });
}

//verifing Hartland Token
function verifyToken(total_card, req_params, callback){ /*promise error*/
    var heartland = new HeartLand;
    var cardHolder = {
        address: {
            zip: req_params.zip,
        }
    };
    var requestMultiUseToken = true;

    heartland.verify(req_params.hartland_token, cardHolder, requestMultiUseToken, function(err, data) {
        if(err) {
            console.log(err);
            callback(errorCodes["-35000"], null);
        } else {
            var token = (data.tokenData !== null && data.tokenData['tokenValue'][0] !== undefined)?data.tokenData.tokenValue[0]:null;
            console.log(token);
            var responseText = (data.responseText)?data.responseText:null;
            var cardType = (data.cardType)?data.cardType:null;
            if (responseText === 'CARD OK' || responseText === 'APPROVAL') {
                if (token) {
                    //check card allready exist
                    models.main.customer_credit_card.count({
                        where: { heartland_mu_token: token, customer_id: req_params.customer_id }
                    }).then(function(c) {
                        if(c > 0){
                            callback(errorCodes["-35004"], null);
                        } else {
                            if(total_card > 0 && req_params.is_default === "true") {
                                models.main.customer_credit_card.update({ is_default: "false"}, {
                                    where: ["customer_id = ?", req_params.customer_id]
                                }).then(function(row) {
                                    var card_params = {
                                        customer_id:parseInt(req_params.customer_id),
                                        card_number: new Buffer(req_params.card_number).toString('base64'),
                                        expiry_month: parseInt(req_params.expiry_month),
                                        expiry_year: parseInt(req_params.expiry_year),
                                        card_type: cardType,
                                        heartland_mu_token: token,
                                        heartland_avs_data: req_params.zip,
                                        card_use_type: req_params.card_use_type,
                                        is_default: req_params.is_default,
                                        created_at: objHelper.now()
                                    };
                                    callback(null,card_params);
                                }).catch(function(err) {
                                    console.log(err);
                                    callback(err, null);
                                });
                            } else{
                                var card_params = {
                                    customer_id:parseInt(req_params.customer_id),
                                    card_number: new Buffer(req_params.card_number).toString('base64'),
                                    expiry_month: parseInt(req_params.expiry_month),
                                    expiry_year: parseInt(req_params.expiry_year),
                                    card_type: cardType,
                                    heartland_mu_token: token,
                                    heartland_avs_data: req_params.zip,
                                    card_use_type: req_params.card_use_type,
                                    is_default: req_params.is_default,
                                    created_at: objHelper.now()
                                };
                                callback(null,card_params);
                            }
                        }
                    }).catch(function(err) {
                        console.log(err);
                        callback(err, null);
                    });
                } else {
                    callback(errorCodes["-35002"], null);
                }
            } else {
                callback(errorCodes["-35001"], null);
            }
        }
    });
}


//add verified card
function addCard(card_params, callback){
    models.main.customer_credit_card.create(card_params).then(function(rows) {
        console.log('rows', JSON.stringify(rows, null, 2));
        if (rows.id) {
            card_params.id = rows.id;
            //callback(null, card_params);
            callback(null, {id:card_params.id , card_number : 'xxxx xxxx xxxx '+new Buffer(card_params.card_number, 'base64').toString()});
        } else {
            callback(errorCodes['-32011'], null);
        }
    }).catch(function(err) {
        if(err) {
            callback(err, null);
        } else{
            callback(errorCodes["-32011"], null);
        }
    });
}

function getCustomerCreditCardInfo(customerId , callback) {
    models.main.customer_credit_card.findAll({
        where : {customer_id : customerId},
        attributes: ['card_number' , 'id'],
    raw: true}).then(function(rows) {
        //console.log(rows);
        if(rows) {
            //callback(null , rows);

            Object.keys(rows).forEach(function(key) {
                //console.log('Key is: ',key);
                //console.log('Value is: ',rows[key].card_number);
                //if(key === 'card_number') {
                    rows[key].card_number = 'xxxx xxxx xxxx '+new Buffer(rows[key].card_number, 'base64').toString();
                //}
            });
            callback(null , rows);
            //console.log(rows);
        } else {
            return callback(errorCodes['-32011'], null);
        }
    }, function(err) {
        return callback(errorCodes['-32011'], null);
    });
}

//add verified card in dynamo
/*function addCardInDynamo(card_params, callback){
    try{
        var dynamo = new dynamoDb();
        var params = {};
        params.TableName = env.dynamo.tbl_prefix + 'customer_credit_card';
        params.Item = card_params;
        dynamo.putItem(params, function (err, data) {
            if (err !== null) {
                console.log(err);
                callback(err, null);
            } else {
                callback(null, "Card added successfully.");
            }
        });
    } catch (e) {
        console.log(e);
        callback(e, null);
    }
}*/

/*################################  Credit card add section ends ####################################*/


function getMarketOfficeByZoneId(zoneId , callback) {
    params.state_code = 'CA';
    models[params.state_code]
}



//# calling the functions
module.exports = {
    getCustomerData: getCustomerData,
    getCardData: getCardData,
    getDeliveryAddressData: getDeliveryAddressData,
    updateDeliveryNotes: updateDeliveryNotes,
    getRestaurentData: getRestaurentData,
    getRestaurentMenuData: getRestaurentMenuData,
    getMarketOfficeData: getMarketOfficeData,
    getMarketOfficeCityData: getMarketOfficeCityData,
    getMarketOfficeCityDeliveryZoneData: getMarketOfficeCityDeliveryZoneData,
    calculateOrderAmount: calculateOrderAmount,
    checkPromoAbility: checkPromoAbility,
    doOrder: doOrder,
    updateOrderStatus: updateOrderStatus,
    redeemePromoCode: redeemePromoCode,
    updateCustomerCredit: updateCustomerCredit,

    getZoneList: getZoneList,
    checkAbility: checkAbility,
    getTaxPercentage: getTaxPercentage,
    fetchCustomerDetails:fetchCustomerDetails,
    updateCustomerData:updateCustomerData,
    updateCustomerDetails:updateCustomerDetails,
    createCustomerAddress:createCustomerAddress,
    createDynamoCustomerAddress:createDynamoCustomerAddress,
    checkCreditAmount:checkCreditAmount,
    cardLimit:cardLimit,
    verifyToken:verifyToken,
    addCard:addCard,
    getCustomerCreditCardInfo:getCustomerCreditCardInfo,
    getMktOfcTaxPercentage:getMktOfcTaxPercentage,
    getMarketOfficeByZoneId:getMarketOfficeByZoneId,
    //addCardInDynamo:addCardInDynamo,
};
