'use strict';


var router = require('express').Router(),
    driverCtrl = require('./driver.ctrl');

//Get
router.get('/list', driverCtrl.listOfDrivers);
router.get('/count', driverCtrl.driverCount);
router.get('/driver-info/:id', driverCtrl.getDriverInfo);

//Post
router.post('/add', driverCtrl.addDriver);
router.post('/update/:id', driverCtrl.updateDriver);
router.post('/send-message/:id', driverCtrl.sendMessageToDriver);

//Delete
router.delete('/delete/:id', driverCtrl.deleteDriver);


module.exports = router;
