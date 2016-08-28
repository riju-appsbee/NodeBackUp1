'use strict';
//Arranging modules
var async = require("async");
var validator = require('validator');
var env = require(__base + 'server/config/env');
var errorCodes = require(__base + 'server/config/error');

//Load Menu model
var menuModel = require('./menu.model');

/**
 *URL : http://localhost:3000/api/menu/count
 *This function is to fetch total number of menus.
 *@params : No param needed   
 **/
function menuCount(req, res) {
    var response = {
        "jsonrpc": "2.0",
        'method': 'menuCount'
    };
    var countMenuList = function(callback) {
        menuModel.getMenuListCount(callback);
    };

    async.series([countMenuList], function(err, result) {
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
            response.error = "Just caught an exception while counting the list of menus!";
            console.log(e);
        }
        res.send(response);
    });


}

/**
 *URL : http://localhost:3000/api/menu/list
 *This function is for fetching list of menus page-wise.
 *@params : page number within req variables
 **/
function listOfMenus(req, res) {

    var response = { "jsonrpc": "2.0" };
    //First task
    var fetchMenuList = function(cb) {
        var offset = req.query.p || 1;
        offset = (parseInt(offset) - 1) * env.pagination.numPerPage;
        menuModel.getListOfMenus(offset, env.pagination.numPerPage, cb);
    };
    async.waterfall([fetchMenuList], function(err, result) {
        //Final Result After Executing Tasks
        // console.log('finally');
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while fetching the list of menus!";
            console.log(e);
        }
        res.send(response);

    });

};

/**
 *URL : http://localhost:3000/api/menu/add
 *This function is for a new menu.
 *@params : all post data within req variables
 **/
function addMenu(req, res) {
    var response = { "jsonrpc": "2.0" };
    var post = {
        title: req.body.params.title,
        meal_period: req.body.params.meal_period,
        menu_category: req.body.params.menu_category,
        active: req.body.params.menu_active,
        menu_items: [],
        created_at: new Date().toISOString().split('T')[0]
    };

    var checkRequest = function(cb) {
        if (!req.body.params.title) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };

    var addMenu = function(cb) {
        menuModel.addMenu(post, cb);
    };

    async.waterfall([checkRequest, addMenu], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while adding a driver!";
            console.log(e);
        }
        res.send(response);
    });

};

/**
 *URL : http://localhost:3000/api/menu/menu-info/:id
 *This function is for fetching menu details by ID.
 *@params : only id of the menu.   
 **/
function getMenuInfo(req, res) {
    var response = { 'jsonrpc': '2.0' };
    var menu_id = req.params.id || null;
    var checkRequest = function(callback) {
        if (!menu_id || menu_id === null) {
            callback(errorCodes['-32014'], null);
        } else {
            callback();
        }
    };

    var getMenu = function(callback) {
        menuModel.getMenu(menu_id, callback);
    };

    async.waterfall([
        checkRequest,
        getMenu
    ], function(err, result) {
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while getting information of a menu!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 **URL : http://localhost:3000/api/menu/update/:id
 *This function is for updating detailed information of the menu by ID.
 *@params : all post data within req variables,id of the menu 
 **/
function updateMenu(req, res) {
    var response = { "jsonrpc": "2.0" };
    //Arranging request
    var menu_id = req.params.id || null;
    // var items = req.body.params.menu_items;
    // for(var i=0;i<items.length;i++){
    // 	items[i].modified_date = new Date().toISOString().split('T')[0];
    // }		
    var post = {
        title: req.body.params.title,
        meal_period: req.body.params.meal_period,
        menu_category: req.body.params.menu_category,
        active: req.body.params.menu_active,
        modified_at: new Date().toISOString().split('T')[0]
    };



    var checkRequest = function(cb) {
        if (!menu_id || menu_id == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };
    var updateMenu = function(cb) {
        menuModel.updateMenu(post, menu_id, cb);
    };

    async.waterfall([checkRequest, updateMenu], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while updating a menu!";
            console.log(e);
        }
        res.send(response);
    });
};

/**
 *URL : http://localhost:3000/api/menu/delete/:id
 *This function is for deleting a menu.
 *@params : only id of the menu   
 **/
function deleteMenu(req, res) {
    var menu_id = req.params.id || null;
    var response = { "jsonrpc": "2.0" };
    var checkRequest = function(cb) {
        if (!menu_id || menu_id == null) {
            cb(errorCodes['-32014'], null);
        } else {
            cb();
        }
    };
    var deleteMenu = function(cb) {
        menuModel.deleteMenuByID(menu_id, cb);
    };
    async.waterfall([checkRequest, deleteMenu], function(err, result) {
        //Final Result After Executing Tasks
        try {
            if (err !== null) {
                response.error = err;
            } else {
                response.result = result;
            }
        } catch (e) {
            response.error = "Just caught an exception while deleting a menu!";
            console.log(e);
        }
        res.send(response);

    });
};

//Calling related methods as per routing
module.exports = {
    listOfMenus: listOfMenus,
    menuCount: menuCount,
    addMenu: addMenu,
    updateMenu: updateMenu,
    getMenuInfo: getMenuInfo,
    deleteMenu: deleteMenu
};
