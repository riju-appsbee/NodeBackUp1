'use strict';

var router = require('express').Router(),
customerCtrl = require('./customer.ctrl'),
customerOrderCtrl = require('./customer_order.ctrl');

//Get
router.get('/list', customerCtrl.customerList); // get customer list;
router.get('/count', customerCtrl.customerCount); // get customer count
router.get('/customer-info/:id', customerCtrl.getCustomerInfo); // get customer info by id
router.get('/delivery-addresses/:id', customerCtrl.getDeliveryAddressesInfo); // get customer delivery address
router.get('/credit-cards/:id', customerCtrl.getCreditCardsInfo); // get customer credit card
router.get('/order-history/:id', customerCtrl.getOrderHistoryInfo); // get customer order history
router.get('/referred-history/:id', customerCtrl.getReferredHistoryInfo); // get customer referred history
router.get('/credit-log/:id', customerCtrl.getCreditLogInfo); // get customer got credit history
router.get('/item-feedback/:id', customerCtrl.getItemFeedbackInfo); // get customer item feedback
router.get('/general-feedback/:id', customerCtrl.getGeneralFeedbackInfo); // get customer general feedback
router.get('/state-list/', customerCtrl.getListOfAllstates); // get all states
router.get('/city-list/', customerCtrl.getListOfAllCities); // get all cities
router.get('/city-list-by-state/:id', customerCtrl.getListOfAllCitiesByStateCode); // get all cities by state
router.get('/zone-info', customerCtrl.getAddressZoneInfo);

//Post
router.post('/add', customerCtrl.addCustomer); // add customer
router.post('/update', customerCtrl.updateCustomer); // update customer
router.post('/overwrite-phone-verification', customerCtrl.overwritePhoneVerification);
router.post('/save-customer-address', customerCtrl.saveCustomerAddress);

//All order related apis
router.post('/create-order', customerOrderCtrl.createOrder);
router.post('/get-delivery-zones', customerOrderCtrl.getDeliveryZones);
router.post('/promo-redeem', customerOrderCtrl.promoRedeem);
router.post('/get-tax-percentage', customerOrderCtrl.getTaxPercentage);
router.post('/change-customer-phone', customerOrderCtrl.changeCustomerPhone);
router.post('/change-customer-address', customerOrderCtrl.changeCustomerAddress);
router.post('/send-verification-code', customerOrderCtrl.sendVerificationCode);
router.post('/credit-amount-redeem', customerOrderCtrl.creditAmountRedeem);
router.post('/credit-card-add', customerOrderCtrl.creditCardAdd);
router.get('/get-customer-credit/:id', customerOrderCtrl.getCustomerCredit);
router.get('/get-customer-credit-card-info/:id', customerOrderCtrl.getCustomerCreditCardInfo);
router.get('/get-moid-by-zoneid/:id', customerOrderCtrl.getMarketOfficeByZoneId);

//Delete
router.delete('/delete/:id', customerCtrl.deleteCustomer); // delete customer by id
router.delete('/delete-delivery-addresses/:id', customerCtrl.deleteDeliveryAddresses); // delete customer delivery address by id
router.delete('/delete-credit-card/:id', customerCtrl.deleteCreditCard); // delete customer credit card by id

module.exports = router;
