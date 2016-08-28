'use strict';


var router = require('express').Router(),
    itemCtrl = require('./item.ctrl');

//Get
router.get('/count/:id', itemCtrl.itemCount);
router.get('/list/:id', itemCtrl.listOfItems);
router.get('/item-info/:id/:menu_id', itemCtrl.getItemInfo);

//Post
router.post('/add/:id', itemCtrl.addItem);
router.post('/update/:id/:menu_id', itemCtrl.updateItem);

// //Delete
router.delete('/delete/:id/:menu_id', itemCtrl.deleteItem);


module.exports = router;
