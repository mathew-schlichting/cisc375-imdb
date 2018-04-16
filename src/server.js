// internal dependencies
var express = require('express');
var sqlite3 = require('sqlite3');
var fs   = require( 'fs'   );

// external dependencies
var multiparty = require('multiparty');

// local dependencies
var mime = require('./mime');

// application variables
var app = express();
var db = new sqlite3.Database('todo');
var port = 8018;


// home page
app.get('/v1/', (req, res) =>{

});

// search
app.post('/v1/search', (req, res) =>{


});

app.get('/v1/person/:nconst', (req, res) => {

});

app.get('/v1/movie/:tcont', (req, res) =>{

});


console.log('Now listening on port: ' + port);
app.listen(port);