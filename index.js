'use strict';

var router = require('express').Router(),
    auth = require('./auth'),
    employee = require('./employee'),
    order = require('./order'),
    customer = require('./customer'),
    driver = require('./driver'),
    menu = require('./menu'),
    item = require('./item'),
    promotion = require('./promotion'),
    restaurant = require('./restaurant'),
    market_office = require('./market_office'),
    market_office_city = require('./market_office_city'),
    settings = require('./settings'),
    tax = require('./tax'),
    delivery_zone = require('./delivery_zone'),
    dynamo = require('./dynamo'),
    today_drivers = require('./today_drivers'),
    jwt = require(__base + 'server/config/jwt'),
    errorCodes = require(__base + 'server/config/error'),
    query = require('./query'),
    market_items = require('./market_items'),
    market_store = require('./market_store'),
    alcohol_store = require('./alcohol_store'),
    alcohol_items = require('./alcohol_items'),
    test = require('./test');



router.use('/test', test);

router.use(jwt.unless({path: ['/api/auth/login','/api/customer/create-order']}));
router.use(function (err, req, res, next) {
  if (err.name === 'UnauthorizedError') {
    var response =  {'jsonrpc':'2.0'};
    response.error = errorCodes['-32013'];
    res.status(401).send(response);
  }
});

// Routing
router.use('/auth', auth);
router.use('/order', order);
router.use('/customer', customer);
router.use('/driver', driver);
router.use('/menu', menu);
router.use('/item', item);
router.use('/employee', employee);
router.use('/market-office-city', market_office_city);
router.use('/market-office', market_office);
router.use('/delivery-zone', delivery_zone);
router.use('/promotion', promotion);
router.use('/restaurant', restaurant);
router.use('/settings', settings);
router.use('/tax', tax);
router.use('/dynamo', dynamo);
router.use('/today-drivers', today_drivers);
router.use('/query', query);
router.use('/market-items', market_items);
router.use('/market-store', market_store);
router.use('/alcohol-store', alcohol_store);
router.use('/alcohol-items', alcohol_items);
//router.use('/test', test);




module.exports = router;
