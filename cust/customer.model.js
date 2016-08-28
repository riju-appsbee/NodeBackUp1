'use strict';

var errorCodes = require(__base + 'server/config/error');
var models = require(__base + 'server/config/sequelize');
var env = require(__base + 'server/config/env');
var underscore = require('underscore');

var moment = require('moment-timezone');


//Load libraries
var dynamoDb = require(__base + 'server/app/libraries/dynamo.lib');

// Count total number of customers
function getCustomerListCount(searchQ, callback) {
    var whereCond = {};

    if (searchQ) {
        whereCond['where'] = [
            "first_name like ? or last_name like ? or email like ? or phone like ?",
            searchQ + '%', searchQ + '%', searchQ + '%', searchQ + '%',
        ];
    }

    // whereCond['where'] = [
    //     "first_name like ? or last_name like ? or email like ? or phone like ? or state like ? or city like ?",
    //     searchQ + '%', searchQ + '%', searchQ + '%', searchQ + '%', state + '%', marketOffice + '%'
    // ];
    // console.log(whereCond);
    models.main.customer.count(whereCond).then(function(cnt) {
        callback(null, cnt);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

// List of customers
function getCustomerList(searchQ, offset, limit, callback) {

    var whereCond = {
        order: 'id DESC',
        offset: offset,
        limit: limit
    };

    // if (searchQ) {
    //     whereCond['where'] = [
    //         "first_name like ? or last_name like ? or email like ? or phone like ?",
    //         searchQ + '%', searchQ + '%', searchQ + '%', searchQ + '%'
    //     ];
    // }


    if (searchQ) {
        whereCond['where'] = [
            "first_name like ? or last_name like ? or email like ? or phone like ?",
            searchQ + '%', searchQ + '%', searchQ + '%', searchQ + '%',
        ];
    }



    models.main.customer.findAll(whereCond).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}
// List of states
function getListOfAllstates(callback) {
    // callback('testing', null);
    models.main.states.findAll({
        attributes: ['State'],
        group: ['State']
    }).then(function(rows) {
        return callback(null, rows);
    }, function(err) {
        return callback(errorCodes["-32011"], null);
    });
}
// List of cities
function getListOfAllCities(callback) {
    // callback('testing', null);
    models.main.states.findAll({
        attributes: ['City'],
        group: ['City']
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}
// List of cities by state code
function getListOfAllCitiesByStateCode(state, callback) {
    // callback('testing', null);
    models.main.states.findAll({
        where: ["State = ?", state],
        attributes: ['City'],
        group: ['City']
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getDeliveryAddressesInfo(id, callback) {
    models.main.customer_delivery_address.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }).catch(function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function deliveryAddressMarketOfficeInfo(state_code, zone_id, cb) {

    if (!!state_code && !!zone_id) {
        var con = models[state_code];

        var query = 'SELECT mc.market_office_id, mo.timezone, mcz.market_office_city_id, mcz.max_dist_srt FROM market_office AS mo LEFT JOIN market_office_city AS mc ON(mc.market_office_id = mo.id) LEFT JOIN market_office_city_delivery_zone AS mcz ON(mcz.market_office_city_id = mc.id) WHERE mcz.id=' + zone_id;

        con.sequelize.query(query, {
            type: con.sequelize.QueryTypes.SELECT
        }).then(function(rows) {
            if (rows && rows.length > 0 && rows[0]['market_office_id'] !== undefined) {
                cb(null, rows[0]);
            } else {
                cb(null, 0);
            }
        }, function(err) {
            cb(errorCodes['-32011'], null);
        });

    } else {
        cb('Required parameters missing.', null);
    }
}

function dzIsOpen(args, cb) {
    if (!!args.state_code && !!args.zone_id && !!args.timezone) {
        var con = models[args.state_code];
        var offset = moment().tz(args.timezone).format('Z');
        var day = moment().tz(args.timezone).format('ddd').toLowerCase();

        var query = 'SELECT shift, is_open FROM v2_foodjets_state_ca_dev.delivery_zone_operation_hour WHERE market_office_city_delivery_zone_id = ' + args.zone_id + ' AND day=\'' + day + '\' AND (CONVERT_TZ(now(),@@session.time_zone,\'' + offset + '\') BETWEEN start_time AND end_time)';

        con.sequelize.query(query, {
            type: con.sequelize.QueryTypes.SELECT
        }).then(function(rows) {
            if (rows && rows.length > 0 && rows[0]['is_open'] !== undefined) {
                args.shift = rows[0]['shift'];
                args.is_open = rows[0]['is_open'];
                cb(null, args);
            } else {
                args.shift = 0;
                args.is_open = 'false';
                cb(null, args);
            }
        }, function(err) {
            cb(errorCodes['-32011'], null);
        });

    } else {
        cb('Required parameters missing.', null);
    }
}

function getCreditCardInfo(id, callback) {
    models.main.customer_credit_card.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getOrderHistory(id, callback) {
    models.main.order.findAll({
        attributes: ['id', 'order_number', 'market_office_name', 'total_amount', 'created_at'],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getReferredHistory(id, callback) {
    models.main.customer_credit_card.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getCreditLog(id, callback) {
    models.main.customer_credit_card.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getItemFeedback(id, callback) {
    models.main.customer_credit_card.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function getGeneralFeedback(id, callback) {
    models.main.customer_credit_card.findAll({
        where: ["customer_id = ?", id],
        order: 'id DESC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function addCustomer(req, callback) {
    models.main.customer.count({
        where: ["email = ?", req.email]
    }).then(function(c) {
        if (c > 0) {
            callback(errorCodes['-32015'], null);
        } else {
            models.main.customer.create(req).then(function(rows) {
                if (rows.id) {
                    callback(null, rows.id);
                } else {
                    callback(errorCodes['-32011'], null);
                }
            }).catch(function(err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(errorCodes["-32011"], null);
                }
            });
        }
    }).catch(function(err) {
        if (err) {
            callback(err, null);
        } else {
            callback(errorCodes["-32011"], null);
        }
    });
}

function addCustomerInDynamo(req, callback) {
    var dynamo = new dynamoDb();
    var params = {};
    params.TableName = env.dynamo.tbl_prefix + 'customer';
    params.Item = req;
    dynamo.putItem(params, function(err, data) {
        if (err !== null) {
            callback(err, null);
        } else {
            callback(null, 'Customer added successfully.');
        }
    });
}

function updateCustomerOnfleetId(data, callback) {
    var customer_id = data.customer_id;
    delete data.customer_id;
    models.main.customer.update(data, {
        where: {
            id: customer_id
        }
    }).then(function(result) {
        if (result > 0) {
            callback(null, customer_id);
        } else {
            callback(errorCodes['-32005'], null);
        }
    }, function(err) {
        if (err.name = 'SequelizeUniqueConstraintError') {
            callback(errorCodes['-32016'], null);
        } else {
            callback(errorCodes['-32011'], null);
        }

    });

}

function getCustomer(id, callback) {
    models.main.customer.findById(id).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function fetchCustomerOnfleetId(id, callback) {
    models.main.customer.findById(id, {
        attributes: ['onfleet_id', 'phone']
    }).then(function(rows) {
        callback(null, rows, id);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function updateCustomer(customer_id, req, callback) {
    models.main.customer.count({
            where: {
                email: req.email,
                id: {
                    $ne: customer_id
                }
            }
        }).then(function(c) {
            if (c > 0) {
                return callback(errorCodes['-32015'], null);
            } else {
                return models.main.customer.update(req, {
                    where: {
                        id: customer_id
                    }
                });
            }
        })
        .then(function(rows) {
            console.log(rows);
            if (rows > 0) {
                return callback(null, customer_id);
            } else {
                return callback(errorCodes['-32005'], null);
            }
        })
        .catch(function(err) {
            // console.log(err);
            if (err) {
                return callback(err, null);
            } else {
                return callback(errorCodes["-32011"], null);
            }
        });
}


function updateCustomerInDynamo(req, customer_id, callback) {
    var dynamo = new dynamoDb();
    var params = {};

    var updateExpression = 'set ';
    var expressionAttributeNames = {};
    var expressionAttributeValues = {};
    if (customer_id) {
        params.TableName = env.dynamo.tbl_prefix + 'customer';
        params.ReturnValues = "ALL_NEW";
        params.Key = {
            'id': {
                'N': customer_id.toString()
            }
        };

        var i = 0;
        Object.keys(req).forEach(function(row) {
            expressionAttributeNames['#' + row] = row;
            expressionAttributeValues[':val' + i] = {
                S: req[row].toString()
            };
            updateExpression += '#' + row + '= :val' + i + ',';
            i++;
        });

        params.ExpressionAttributeNames = expressionAttributeNames;
        params.ExpressionAttributeValues = expressionAttributeValues;
        params.UpdateExpression = updateExpression.replace(/^,|,$/g, '');
        //console.log(params); return false;

        dynamo.updateItem(params, function(err, data) {
            if (err !== null) {
                callback(err, null);
            } else {
                callback(null, 'Customer updated successfully.');
            }
        });
    }
}

function deleteCustomer(id, callback) {
    models.main.customer.count({
        where: ["id = ?", id]
    }).then(function(c) {
        if (c === 0) {
            callback(errorCodes['-32013'], null);
        } else {
            models.main.customer.destroy({
                where: {
                    id: id
                }
            }).then(function(rows) {
                if (rows > 0) {
                    callback(null, id);
                } else {
                    callback(errorCodes['-32006'], null);
                }
            }, function(err) {
                callback(errorCodes['-32011'], null);
            });
        }
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function deleteCustomerFromDynamo(customer_id, callback) {
    var dynamo = new dynamoDb();
    var params = {};
    if (customer_id) {
        params.TableName = env.dynamo.tbl_prefix + 'customer';
        params.Key = {
            'id': {
                'N': customer_id.toString()
            }
        };
    }

    dynamo.deleteItem(params, function(err, data) {
        if (err !== null) {
            callback(err, null);
        } else {
            callback(null, "Customer deleted successfully.");
        }
    });
}

function delCustDelvAddress(id, callback) {
    models.main.customer_delivery_address.count({
        where: ["id = ?", id]
    }).then(function(c) {
        if (c === 0) {
            callback(errorCodes['-32013'], null);
        } else {
            models.main.customer_delivery_address.destroy({
                where: {
                    id: id
                }
            }).then(function(rows) {
                if (rows > 0) {
                    callback(null, "Delivery address deleted successfully.");
                } else {
                    callback(errorCodes['-32006'], null);
                }
            }, function(err) {
                callback(errorCodes['-32011'], null);
            });
        }
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function delCard(id, callback) {
    models.main.customer_credit_card.count({
        where: ["id = ?", id]
    }).then(function(c) {
        if (c === 0) {
            callback(errorCodes['-32013'], null);
        } else {
            models.main.customer_credit_card.destroy({
                where: {
                    id: id
                }
            }).then(function(rows) {
                if (rows > 0) {
                    callback(null, "Card deleted successfully.");
                } else {
                    callback(errorCodes['-32006'], null);
                }
            }, function(err) {
                callback(errorCodes['-32011'], null);
            });
        }
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function overwrite(id, callback) {
    models.main.customer.count({
        where: {
            id: id,
            verified_phone: 'true'
        }
    }).then(function(c) {
        if (c === 1) {
            callback(errorCodes['-32800'], null);
        } else {
            models.main.customer.update({
                verified_phone: 'true'
            }, {
                where: {
                    id: id
                }
            }).then(function(rows) {
                if (rows > 0) {
                    callback(null, id);
                } else {
                    callback(errorCodes['-32005'], null);
                }
            }).catch(function(err) {
                if (err) {
                    callback(err, null);
                } else if (err.name = 'SequelizeUniqueConstraintError') {
                    callback(errorCodes['-32015'], null);
                } else {
                    callback(errorCodes['-32011'], null);
                }
            });
        }
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });
}

function overwriteInDynamo(customer_id, callback) {
    var dynamo = new dynamoDb();
    var params = {};

    var updateExpression = 'set ';
    var expressionAttributeNames = {};
    var expressionAttributeValues = {};
    if (customer_id) {
        params.TableName = env.dynamo.tbl_prefix + 'customer';
        params.ReturnValues = "ALL_NEW";
        params.Key = {
            'id': {
                'N': customer_id.toString()
            }
        };

        expressionAttributeNames['#vyph'] = 'vyph';
        expressionAttributeValues[':val0'] = {
            S: 'true'.toString()
        };
        updateExpression += '#vyph = :val0';

        params.ExpressionAttributeNames = expressionAttributeNames;
        params.ExpressionAttributeValues = expressionAttributeValues;
        params.UpdateExpression = updateExpression;

        dynamo.updateItem(params, function(err, data) {
            if (err !== null) {
                callback(err, null);
            } else {
                callback(null, 'You have successfully overwritten verification of this user.');
            }
        });
    }
}

function saveCustomerAddress(post, callback) {
    models.main.customer_delivery_address.count({
        where: {
            address: post.address,
            customer_id: post.customer_id
        }
    }).then(function(ctn) {
        if (ctn > 0) {
            callback(errorCodes['-32046'], null);
        } else {
            models.main.customer_delivery_address.create(post).then(function(rows) {
                if (rows.id) {
                    callback(null, rows);
                } else {
                    callback(errorCodes['-32011'], null);
                }
            }).catch(function(err) {
                if (err) {
                    callback(err, null);
                } else {
                    callback(errorCodes["-32011"], null);
                }
            });
        }
    });
}

//# calling the functions
module.exports = {
    getCustomerListCount: getCustomerListCount,
    getCustomerList: getCustomerList,
    addCustomer: addCustomer,
    addCustomerInDynamo: addCustomerInDynamo,
    getCustomer: getCustomer,
    updateCustomer: updateCustomer,
    updateCustomerInDynamo: updateCustomerInDynamo,
    deleteCustomer: deleteCustomer,
    deleteCustomerFromDynamo: deleteCustomerFromDynamo,
    getDeliveryAddressesInfo: getDeliveryAddressesInfo,
    getCreditCardInfo: getCreditCardInfo,
    getOrderHistory: getOrderHistory,
    getReferredHistory: getReferredHistory,
    getCreditLog: getCreditLog,
    getItemFeedback: getItemFeedback,
    getGeneralFeedback: getGeneralFeedback,
    delCustDelvAddress: delCustDelvAddress,
    delCard: delCard,
    overwrite: overwrite,
    overwriteInDynamo: overwriteInDynamo,
    updateCustomerOnfleetId: updateCustomerOnfleetId,
    fetchCustomerOnfleetId: fetchCustomerOnfleetId,
    saveCustomerAddress: saveCustomerAddress,
    deliveryAddressMarketOfficeInfo: deliveryAddressMarketOfficeInfo,
    getListOfAllstates: getListOfAllstates,
    getListOfAllCitiesByStateCode: getListOfAllCitiesByStateCode,
    getListOfAllCities: getListOfAllCities,
    dzIsOpen: dzIsOpen
};
