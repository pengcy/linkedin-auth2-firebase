'use strict';
const express = require('express');
const cookieParser = require('cookie-parser');

// express.js
const app = express();
app.enable('trust proxy');
app.use(express.static('public'));
app.use(cookieParser());


var login = require('./login');
login.setApp(app);


// Start the server
var server = app.listen('3030', function () {
  console.log('Available at localhost:%s', server.address().port);
  console.log('Press Ctrl+C to quit.');
});
module.exports = app;



// Start the app
// npm run start
// https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77d8rury4b90lu&redirect_uri=https%3A%2F%2Flocalhost%3A3000%2Fredirect%2Flinkedin&state=987ga12glEp31A4321&scope=r_basicprofile
// https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=77d8rury4b90lu&redirect_uri=http://localhost:3000/user&state=987ga12glEp31A4321&scope=r_basicprofile

