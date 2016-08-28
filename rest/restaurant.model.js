'use strict';
var errorCodes = require(__base + 'server/config/error');
var models = require(__base + 'server/config/sequelize');
var search_model = require(__base + 'server/config/sequelize');

// get market office
function getMarketOfficeList(state, callback) {
    models[state].market_office.findAll({
        attributes: ['id', 'office_name'],
        order: 'office_name ASC'
    }).then(function(result) {
        return callback(null, result);
    }).catch(function(error) {
        if (error.name = 'SequelizeUniqueConstraintError') {
            return callback(errorCodes['-32008'], null);
        } else {
            return callback(errorCodes['-32011'], null);
        }
    });
}

// get market office city
function getMarketOfficeCityList(state, marketOfficeId, callback) {
    models[state].market_office_city.findAll({
        attributes: ['id', 'city_name'],
        where: ["market_office_id = ?", marketOfficeId],
        order: 'city_name ASC'
    }).then(function(result) {
        return callback(null, result);
    }).catch(function(error) {
        if (error.name = 'SequelizeUniqueConstraintError') {
            return callback(errorCodes['-32008'], null);
        } else {
            return callback(errorCodes['-32011'], null);
        }
    });
}
// get market office cities by state
function getMarketOfficeCitiesByState(state, callback) {
    models[state].market_office_city.findAll({
        attributes: ['id', 'city_name'],
        order: 'city_name ASC'
    }).then(function(rows) {
        callback(null, rows);
    }, function(err) {
        console.log(err);
        callback(errorCodes['-32011'], null);
    });
}

// get market office city delivery zones
function getMarketOfficeCityDeliveryZoneList(state, marketOfficeCityId, callback) {
  var sequelize = models[state];
    sequelize.market_office_city_delivery_zone.findAll({
        attributes: [[sequelize.sequelize.fn('CONCAT', state, sequelize.sequelize.col('id')), 'shortid'],'delivery_zone_name'],
        where: ["market_office_city_id = ?", marketOfficeCityId],
        order: 'delivery_zone_name ASC'
    }).then(function(result) {
        return callback(null, result);
    }).catch(function(error) {
        if (error.name = 'SequelizeUniqueConstraintError') {
            return callback(errorCodes['-32008'], null);
        } else {
            return callback(errorCodes['-32011'], null);
        }
    });
}

//# calling the functions
module.exports = {
    getMarketOfficeList: getMarketOfficeList,
    getMarketOfficeCityList: getMarketOfficeCityList,
    getMarketOfficeCitiesByState: getMarketOfficeCitiesByState,
    getMarketOfficeCityDeliveryZoneList: getMarketOfficeCityDeliveryZoneList,
};
