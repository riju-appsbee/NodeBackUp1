'use strict';

var router = require('express').Router(),
restaurantCtrl = require('./restaurant.ctrl');

//Get
router.get('/market-office-list', restaurantCtrl.getMarketOfficeList); // get market office list;
router.get('/market-office-city-list', restaurantCtrl.getMarketOfficeCityList); // get market office city list;
router.get('/zone-list', restaurantCtrl.getZoneList); // get zone list;
router.get('/market-office-cities', restaurantCtrl.getMarketOfficeCitiesByState); // get market office city list by state code;

//Post
router.post('/upload', restaurantCtrl.uploadFeaturedIcon); // Upload Restaurant Featured Icon


//Delete

module.exports = router;
