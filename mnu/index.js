'use strict';


var router = require('express').Router(),
    menuCtrl = require('./menu.ctrl');

//Get
router.get('/list', menuCtrl.listOfMenus);

router.get('/count', menuCtrl.menuCount);
router.get('/menu-info/:id', menuCtrl.getMenuInfo);

//Post
router.post('/add', menuCtrl.addMenu);
router.post('/update/:id', menuCtrl.updateMenu);

// //Delete
router.delete('/delete/:id', menuCtrl.deleteMenu);


module.exports = router;
