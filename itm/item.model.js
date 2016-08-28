'use strict';
//Arranging modules
var uscore = require('underscore');

var errorCodes = require(__base + 'server/config/error');
var Menu = require(__base + 'server/config/mongoose/menu');

// Count total number of items
function getItemListCount(id, cb) {
    Menu.findById(id, function(err, row) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            cb(null, row.menu_items.length);
        }
    });

}

//Fetch list of all items
function getListOfItems(offset, limit, id, cb) {
    Menu.findById(id, function(err, row) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            // cb(null, row.menu_items);
            var items = uscore.sortBy( row.menu_items, 'name' );
            cb(null, items);
        }
    });


};
//Delete an item by ID
function deleteItemByID(id, menu_id, cb) {
    Menu.findByIdAndUpdate(menu_id, { $pull: { 'menu_items': { _id: id } } }, function(err, rows) {
        if (err) {
            callback(errorCodes['-32011'], null);
        } else {
            cb(null, "Successfully deleted the item.");
        }
    });
};
//Add a new item
function addItem(req, menu_id, cb) {
    Menu.findByIdAndUpdate(menu_id, { $push: { 'menu_items': req } }, function(err, rows) {
        if (err) {
            callback(errorCodes["-32004"], null);
        } else {
            cb(null, 'Successfully added the item.');
        }
    });

};

//Fetch Item details by ID.
function getItem(id, menu_id, cb) {
    Menu.findById(menu_id, function(err, row) {
        if (err) {
            cb(errorCodes['-32011'], null);
        } else {
            if (row.menu_items.length > 0) {
                row.menu_items.forEach(function(menu_item) {
                    if (menu_item._id == id) {
                        cb(null, menu_item);
                    }
                });
            } else {
                cb('No menu item was found!', null);
            }

        }
    });
}

//Update detailed information of the item by ID
function updateItem(req, item_id, menu_id, cb) {
    Menu.update({ '_id': menu_id, 'menu_items._id': item_id }, { '$set': req }, function(err, rows) {
        if (err) {
            cb(errorCodes["-32011"], null);
        } else {
            // console.log(rows);
            cb(null, 'Successfully updated the item.');
        }
    });
};

//Calling related methods as per routing
module.exports = {
    getListOfItems: getListOfItems,
    getItemListCount: getItemListCount,
    deleteItemByID: deleteItemByID,
    addItem: addItem,
    getItem: getItem,
    updateItem: updateItem
};
