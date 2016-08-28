'use strict';
//Arranging modules
var async = require('async');
var crypto = require('crypto');

var errorCodes = require(__base + 'server/config/error');
var Menu = require(__base + 'server/config/mongoose/menu');

// Count total number of menus
function getMenuListCount(cb) {
    Menu.count({}, function(err, cnt) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            cb(null, cnt);
        }
    });
}

//Fetch list of all menus
function getListOfMenus(offset, limit, cb) {
    Menu.find({}, null, { skip: offset, limit: limit, sort: { title: 1 } }, function(err, rows) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            cb(null, rows);
        }
    });
};
//Delete a menu by ID
function deleteMenuByID(id, cb) {
    Menu.findByIdAndRemove(id, function(err) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            cb(null, "Successfully deleted");
        }
    });
};
//Add a new menu
function addMenu(req, cb) {
    var newMenu = Menu(req);

    newMenu.save(function(err) {
        if (err) {
            cb(errorCodes['-32004'], null);
        } else {
            cb(null, 'Successfully added the information.');
        }
    });
};

//Fetch Menu details by ID.
function getMenu(id, cb) {
    Menu.findById(id, function(err, row) {
        if (err) {
            cb(errorCodes['-32011'], null);
            // cb(err, null);
        } else {
            cb(null, row);
        }
    });
}

//Update detailed information of the menu by ID
function updateMenu(req, menu_id, cb) {
    // console.log(req);
    Menu.findByIdAndUpdate(menu_id, req, function(err, row) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            cb(null, 'Successfully updated the information.');
        }
    });
};

//Calling related methods as per routing
module.exports = {
    getListOfMenus: getListOfMenus,
    getMenuListCount: getMenuListCount,
    deleteMenuByID: deleteMenuByID,
    addMenu: addMenu,
    getMenu: getMenu,
    updateMenu: updateMenu
};
