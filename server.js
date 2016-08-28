'use strict';

/**
@ FoodJets Express server
**/

process.env.NODE_ENV = process.env.NODE_ENV || 'development';
global.__base = __dirname + '/';

// Include config
var config = require('./server/config/env'),
app = require('./server/config/express');
// mongo = require('./server/config/mongo')(); // Connect to mongoose

// Create server
app.listen(config.port, function listen() {
  console.log('Server listening on port '+config.port+'!');
});
