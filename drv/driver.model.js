'use strict';
//Arranging modules
var async = require('async');
var crypto = require('crypto');
var errorCodes = require(__base + 'server/config/error');
var env = require(__base + 'server/config/env');
var models = require(__base + 'server/config/sequelize');
var smsClient = require('twilio')(env.twilio.account_sid, env.twilio.auth_token);
var objHelper = require(__base + 'server/app/helpers/object.helper');

// Count total number of drivers
function getDriverListCount(state, marketOffice, searchQ, cb) {

    var query = 'SELECT COUNT(driver.id) AS driver_count FROM driver INNER JOIN driver_market_office ON(driver_market_office.driver_id = driver.id)';

    if (state) {
        query += ' WHERE driver_market_office.state_code=\'' + state + '\'';
        if (marketOffice) {
            query += ' AND driver_market_office.market_office_id=' + marketOffice;
        }
        if (searchQ) {
            query += ' AND (driver.first_name LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.last_name  LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.email  LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.phone  LIKE \'' + objHelper.escapeString(searchQ) + '%\')';
        }
    }

    models.main.sequelize.query(query, {
        type: models.main.sequelize.QueryTypes.SELECT
    }).then(function(rows) {
        if (rows && rows.length > 0 && rows[0]['driver_count'] !== undefined) {
            cb(null, rows[0]['driver_count']);
        } else {
            cb(null, 0);
        }
    }, function(err) {
        cb(errorCodes['-32011'], null);
    });

}

//Fetch list of all drivers
function getListOfDrivers(state, marketOffice, searchQ, offset, limit, cb) {

    var query = 'SELECT driver.id, driver.first_name, driver.last_name, driver.email,  driver.phone,  driver.address, driver_market_office.state_code, driver_market_office.market_office_id FROM driver INNER JOIN driver_market_office ON(driver_market_office.driver_id = driver.id)';

    if (state) {
        query += ' WHERE driver_market_office.state_code=\'' + state + '\'';
        if (marketOffice) {
            query += ' AND driver_market_office.market_office_id=' + marketOffice;
        }
        if (searchQ) {
            query += ' AND (driver.first_name LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.last_name  LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.email  LIKE \'' + objHelper.escapeString(searchQ) + '%\'' +
                ' OR driver.phone  LIKE \'' + objHelper.escapeString(searchQ) + '%\')';
        }
    }
    query += ' ORDER BY driver.id DESC LIMIT ' + offset + ', ' + limit;

    // console.log(query);
    models.main.sequelize.query(query, {
        type: models.main.sequelize.QueryTypes.SELECT
    }).then(function(rows) {
        cb(null, rows);
    }, function(err) {
        cb(errorCodes['-32011'], null);
    });

}

//Delete a driver by ID
function deleteDriverByID(id, cb) {

    models.main.driver_market_office.destroy({ where: { driver_id: id } }).then(function(result) {
        if (result > 0) {
            models.main.driver.destroy({ where: { id: id } }).then(function(rows) {
                if (result > 0) {
                    cb(null, "Successfully deleted");
                } else {
                    cb(errorCodes['-32006'], null);
                }
            }, function(err) {
                cb(errorCodes['-32011'], null);
            });

        } else {
            cb(errorCodes['-32006'], null);
        }
    }).catch(function(error) {
        cb(errorCodes['-32011'], null);
    });
}

//Add a new driver
function addDriver(req, cb, market_office_details) {

    models.main.driver.create(req).then(function(result) {

        if (result.id > 0) {

            var data = { 'driver_id': result.id, 'state_code': market_office_details.state_code, 'market_office_id': market_office_details.market_office_id };
            models.main.driver_market_office.create(data).then(function(row) {
                cb(null, result);
            }, function(err) {
                cb(errorCodes['-32011'], null);
            });

        } else {
            cb(errorCodes['-32004'], null);
        }
    }, function(err) {
        console.log(err);
        if (err.name = 'SequelizeUniqueConstraintError') {
            cb(errorCodes['-32016'], null);
        } else {
            cb(errorCodes['-32011'], null);
        }
    });
}

//Fetch driver details by ID.
function getDriver(id, callback) {
    models.main.driver.hasOne(models.main.driver_market_office, { foreignKey: 'driver_id' });
    models.main.driver_market_office.belongsTo(models.main.driver, { foreignKey: 'id' });
    models.main.driver.find({ where: { id: id }, include: [models.main.driver_market_office] }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        callback(errorCodes["-32011"], null);
    });

}

function updateDriver(req, cb, driver_id, market_office_details) { // Need to update the code

    models.main.driver.update(req, { where: { id: driver_id } }).then(function(result) {
        if (result > 0) {
            var data = { 'state_code': market_office_details.state_code, 'market_office_id': market_office_details.market_office_id };
            models.main.driver_market_office.update(data, { where: { driver_id: driver_id } }).then(function(row) {
                cb(null, 'Successfully updated the information.');
            }, function(err) {
                cb(errorCodes['-32011'], null);
            });
        } else {
            cb(errorCodes['-32005'], null);
        }
    }, function(err) {
        if (err.name = 'SequelizeUniqueConstraintError') {
            cb(errorCodes['-32016'], null);
        } else {
            cb(errorCodes['-32011'], null);
        }

    });

}

function updateDriverData(data, cb) {
    var driver_id = data.driver_id;
    delete data.driver_id;
    models.main.driver.update(data, { where: { id: driver_id } }).then(function(result) {
        if (result > 0) {
            cb(null, { id: driver_id });
        } else {
            cb(errorCodes['-32005'], null);
        }
    }, function(err) {
        if (err.name = 'SequelizeUniqueConstraintError') {
            cb(errorCodes['-32016'], null);
        } else {
            cb(errorCodes['-32011'], null);
        }

    });

}

//Send a message to driver's phone
function sendMessage(id, textMessage, cb) {
    models.main.driver.findById(id).then(function(row) {
        var to = row.country_code + row.phone;
        //Send an SMS text message
        smsClient.sendMessage({
            to: to,
            from: env.twilio.from,
            body: textMessage
        }, function(err, responseData) {

            if (!err) {
                // console.log(responseData);
                cb(null, 'Message has ben successfully sent!');
            } else {
                console.log(err);
                cb(errorCodes["-32045"], null);
            }
        });
    }, function(err) {
        cb(errorCodes["-32011"], null);
    });

}

//Calling related methods as per routing
module.exports = {
    getListOfDrivers: getListOfDrivers,
    getDriverListCount: getDriverListCount,
    deleteDriverByID: deleteDriverByID,
    addDriver: addDriver,
    getDriver: getDriver,
    updateDriver: updateDriver,
    updateDriverData: updateDriverData,
    sendMessage: sendMessage
};
