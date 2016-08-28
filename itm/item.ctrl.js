'use strict';
//Arranging modules
var async = require("async");
var validator = require('validator');
var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');
var UploadAble = require(__base + 'server/app/libraries/uploadable.lib');

//Load Item model
var itemModel = require('./item.model');

//Add item image in aws and return file name in result
function addItem(req, res) {
    
    var response = { "jsonrpc": "2.0" };
    

    var checkRequest = function(cb) {
        if (!req.body.params.name) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var uploadImage = function(cb){
        //Image Uploading starts
        if(req.body.params.image !== undefined && !validator.isNull(req.body.params.image)){
          var uploadAble = new UploadAble({
            name:req.body.params.name,
            body:req.body.params.image,
            bucketName:'foodjets-2-driver-image-dev'
          });
          uploadAble.upload(function(err, data){
              if(err===false){
                cb(null,data.key);
              }else{
                cb(errorCodes['-32029'], null);
              }
          });
        }
        //Image Uploading ends    
    }

    

    async.waterfall([checkRequest, uploadImage], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while adding an item!";
            console.log(e);
        }
        res.send(response);
    });
    

};

/**
 *URL : http://localhost:3000/api/item/count/:id
 *This function is to fetch total number of items by menu id.
 *@params : id of the parent menu
 **/
function itemCount(req, res) {
    var response = {
        "jsonrpc": "2.0",
        'method': 'itemCount'
    };
    var menu_id = req.params.id || null;
    var countItemList = function(callback) {
        // calling model for get data
        itemModel.getItemListCount(menu_id, callback);
    };

    async.series([countItemList], function(err, result) {
        try {
            //Final Result After Executing Tasks
            if (err !== null) {
                response.error = err;
            } else {
                response.result = {
                    numPerPage: env.pagination.numPerPage,
                    count: result[0]
                };
            }
        } catch (e) {
            response.error = "Just caught an exception while counting the list of items!";
            console.log(e);
        }
        res.send(response);
    });


}

/**
 *URL : http://localhost:3000/api/item/list/:id
 *This function is for fetching list of items by menu page-wise.
 *@params : page number within req variables,id of the parent menu
 **/
function listOfItems(req, res) {

    var response = { "jsonrpc": "2.0" };
    var menu_id = req.params.id || null;
    //First task
    var fetchItemList = function(cb) {
        var offset = req.query.p || 1;
        offset = (parseInt(offset) - 1) * env.pagination.numPerPage;
        itemModel.getListOfItems(offset, env.pagination.numPerPage, menu_id, cb);
    };
    async.waterfall([fetchItemList], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while fetching the list of items!";
            console.log(e);
        }
        res.send(response);

    });

};

/**
 *URL : http://localhost:3000/api/item/add/:id
 *This function is for adding a new item under its parent menu.
 *@params : all post data within req variables,parent menu id
 **/
 /*
function addItem(req, res) {
    
    var response = { "jsonrpc": "2.0" };
    var menu_id = req.params.id || null;
    var post = {
        name: req.body.params.name,
        wholesale_price: req.body.params.wholesale_price,
        retail_price: req.body.params.retail_price,
        commission: req.body.params.commission,
        menu_category: req.body.params.menu_category,
        meal_period: req.body.params.meal_period,
        description: req.body.params.description,
        choices: req.body.params.choices,
        active: req.body.params.active,
        created_date: new Date().toISOString().split('T')[0]
    };

    var checkRequest = function(cb) {
        if (!menu_id || !req.body.params.name || !req.body.params.wholesale_price || !req.body.params.retail_price || !req.body.params.commission) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var uploadImage = function(cb){
        //Image Uploading starts
        post.image = '';
        if(req.body.params.image !== undefined && !validator.isNull(req.body.params.image)){
          var uploadAble = new UploadAble({
            name:req.body.params.name,
            body:req.body.params.image,
            bucketName:'foodjets-2-driver-image-dev'
          });
          uploadAble.upload(function(err, data){
              // console.log(data.Location);
              if(err===false){
                post.image = data.key;
                cb();
              }else{
                cb(errorCodes['-32029'], null);
              }
          });
        }
        //Image Uploading ends    
    }

    var addItem = function(cb) {
        
        itemModel.addItem(post, menu_id, cb);
    };

    async.waterfall([checkRequest, uploadImage, addItem], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while adding an item!";
            console.log(e);
        }
        res.send(response);
    });
    

};
*/

/**
 *URL : http://localhost:3000/api/item/item-info/:id
 *This function is for fetching item details by ID.
 *@params : only id of the item.   
 **/
function getItemInfo(req, res) {
    var response = { 'jsonrpc': '2.0' };
    var item_id = req.params.id || null;
    var menu_id = req.params.menu_id || null;
    var checkRequest = function(callback) {
        if (!item_id || item_id === null || !menu_id || menu_id === null) {
            callback(errorCodes['-32014'], null);
        } else {
            callback();
        }
    };

    var getItem = function(callback) {
        itemModel.getItem(item_id, menu_id, callback);
    };

    async.waterfall([
        checkRequest,
        getItem
    ], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while getting information of an item!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 **URL : http://localhost:3000/api/item/update/:id
 *This function is for updating detailed information of the item by ID.
 *@params : all post data within req variables,id of the item 
 **/
function updateItem(req, res) {
    var response = { "jsonrpc": "2.0" };
    //Arranging request
    var item_id = req.params.id || null;
    var menu_id = req.params.menu_id || null;

    var post = {
        'menu_items.$.name': req.body.params.name,
        'menu_items.$.wholesale_price': req.body.params.wholesale_price,
        'menu_items.$.retail_price': req.body.params.retail_price,
        'menu_items.$.commission': req.body.params.commission,
        'menu_items.$.menu_category': req.body.params.menu_category,
        'menu_items.$.meal_period': req.body.params.meal_period,
        'menu_items.$.description': req.body.params.description,
        'menu_items.$.choices': req.body.params.choices,
        'menu_items.$.active': req.body.params.active,
        'menu_items.$.modified_date': new Date().toISOString().split('T')[0]
    };



    var checkRequest = function(cb) {
        if (!item_id || item_id == null || !menu_id || menu_id === null || !req.body.params.name || !req.body.params.wholesale_price || !req.body.params.retail_price || !req.body.params.commission) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var uploadImage = function(cb){
        //Image Uploading starts
        if(req.body.params.image.indexOf("base64")!==-1 && req.body.params.image !== undefined && !validator.isNull(req.body.params.image)){
          var uploadAble = new UploadAble({
            name:req.body.params.name,
            body:req.body.params.image,
            bucketName:'foodjets-2-driver-image-dev'
          });
          uploadAble.upload(function(err, data){
              if(err===false){
                post['menu_items.$.image'] = data.key;
                cb();
              }else{
                cb(errorCodes['-32029'], null);
              }
          });
        }else{
            if(req.body.params.image=='' && req.body.params.imagePath==''){
                post['menu_items.$.image'] = '';
            }
            cb();
        }
        //Image Uploading ends    
    }

    var updateItem = function(cb) {
        itemModel.updateItem(post, item_id, menu_id, cb);
    };

    async.waterfall([checkRequest, uploadImage, updateItem], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while updating an item!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 *URL : http://localhost:3000/api/item/delete/:id
 *This function is for deleting an item by its ID
 *@params : only id of the item
 **/
function deleteItem(req, res) {
    var item_id = req.params.id || null;
    var menu_id = req.params.menu_id || null;
    var response = { "jsonrpc": "2.0" };
    var checkRequest = function(cb) {
        if (!item_id || item_id == null || !menu_id || menu_id == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };
    var deleteItem = function(cb) {
        itemModel.deleteItemByID(item_id, menu_id, cb);
    };
    async.waterfall([checkRequest, deleteItem], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while deleting an item!";
            console.log(e);
        }
        res.send(response);

    });
};

//Calling related methods as per routing
module.exports = {
    listOfItems: listOfItems,
    itemCount: itemCount,
    addItem: addItem,
    updateItem: updateItem,
    getItemInfo: getItemInfo,
    deleteItem: deleteItem
};
