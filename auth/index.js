'use strict';

var router = require('express').Router(),
    authCtrl = require('./auth.ctrl'),
    userCtrl = require('./user.ctrl');

router.post('/login', authCtrl.login);
router.post('/user', userCtrl.isSignedIn);
router.post('/logout', userCtrl.logout);



module.exports = router;
