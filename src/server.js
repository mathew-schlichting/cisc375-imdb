// internal dependencies
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

// external dependencies
var multiparty  = require(  'multiparty');
var express     = require(  'express'   );
var sqlite3     = require(  'sqlite3'   );

// local dependencies
var mime = require('./mime');

// application variables
var app = express();
var db = new sqlite3.Database('todo');
var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');




// home page
app.get('/', (req, res) => {
    res.sendFile(path.join(public_dir, 'index.html'));
});

app.get('/css/styles.css', (req, res) => {
    var req_url = url.parse(req.url);
    var filename = req_url.pathname.substring(1);


    console.log(filename);

    res.contentType('text/stylesheet');
    res.sendFile(path.join(public_dir, filename));
});






// search
app.post('/v1/search', (req, res) =>{


});

// people
app.get('/v1/person/:nconst', (req, res) => {
    var html = '';

    html += '<!DOCTYPE html>';
    html += '<html>';
    html +=     '<head>';
    html +=         '<title>Movies</title>';
    html +=     '</head>';
    html +=     '<body>';
    html +=         '<h1>Hello World</h1>';
    html +=     '</body>';
    html += '</html>';


    res.contentType('text/html');
    res.send(html);
});


// movie titles
app.get('/v1/movie/:tcont', (req, res) =>{

});


console.log('Now listening on port: ' + port);
app.listen(port);