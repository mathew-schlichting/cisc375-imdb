// internal dependencies
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

// external dependencies
var multiparty  = require(  'multiparty');
var express     = require(  'express'   );
var sqlite3     = require('sqlite3').verbose();

// local dependencies
var mime = require('./mime');
var database   = require('./database');

// application variables
var app = express();
var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');




// static files
app.use('/js',express.static(path.join(public_dir, 'js')));
app.use('/css', express.static(path.join(public_dir, 'css')));


// home page should be static

app.get('/', (req, res) => {
   // database.init('./../imdb.sqlite3');
    //database.select();


    res.sendFile(path.join(public_dir, 'index.html'));
});








// search
app.post('/search', (req, res) =>{
    var html;
    var form;
    var i;
    var results;

    form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if(err){
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.write('Internal Server Error!');
            res.end();
        }
        else{

            // do search here
            
			// fields.type[0]       =   table name
            // fields.search[0]     =   search value
			var id = '';
			if(fields.type[0]=='Names'){
				id = 'select_person';
			}else if(fields.type[0]=='Titles'){
				id = 'select_movie';
			}
			var title = fields.search[0];
			database.init('../imdb.sqlite3');
			var query = database.select(id,title);
			console.log(query);

            results = [{id:'12345', name:'Brad Pitt the actor'}, {id:'12346', name:'Brad Pitt the non-actor'}];

            res.writeHead(200, {'Content-Type': 'text/html'});
            html = '';
            
            html += '<!DOCTYPE html>';
            html += '<html>';
            html +=     '<head>';
            html +=         '<title>Search Results</title>';
            html +=     '</head>';
            html +=     '<body>';
            html +=         '<h1>Search Results for: ' + fields.search[0] + '</h1>';
            html +=         '<div>We Don\'t have a database connection yet but here is test values</div>';

            html +=         '<ul>';
            for(i=0; i<results.length; i++){
                html +=         '<li>';
                html +=             '<a href="http://localhost:8018/person/' + results[i].id + '">';
                html +=                 results[i].name;
                html +=             '</a>';
                html +=         '</li>';
            }
            html +=         '</ul>';


            html +=     '</body>';
            html += '</html>';


            res.write(html);
            res.end();
        }
    });
});

// people
app.get('/person/:nconst', (req, res) => {
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
app.get('/movie/:tcont', (req, res) =>{

});


console.log('Now listening on port: ' + port);
app.listen(port);
