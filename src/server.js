// internal dependencies
var fs   = require( 'fs'   );
var path = require( 'path' );
var http = require( 'http' );
var url  = require( 'url'  );

// external dependencies
var multiparty = require('multiparty');

// local dependencies
var mime = require('./mime');



var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');

var server = http.createServer((req, res) => {
    var req_url = url.parse(req.url);
    var filename = req_url.pathname.substring(1);

    console.log('Recieved a ' + req.method + ' request');

    if(req.method === 'GET'){
        if(filename === '') filename = 'index.html';

		fs.readFile(path.join(public_dir, filename), (err, data) => {
			if(err){
				res.writeHead(404, {'Content-Type': 'text/plain'});
				res.write('I\'m sad, I couldn\'t find it :(');
				res.end();
			} else{
				var ext = path.extname(filename).substring(1);

				res.writeHead(200, {'Content-Type': mime.mime_types[ext] || 'text/plain'});
				res.write(data);
				res.end();
			}
		});
    } else if(req.method === 'POST'){
		if(filename === 'subscribe'){
            var form = new multiparty.Form();
            form.parse(req, (err, fields, files) => {
                if(err){
                    res.writeHead(500, {'Content-Type': 'text/plain'});
                    res.write('Internal Server Error!');
                    res.end();
                }
                else{
                    console.log(fields);
                    res.writeHead(200, {'Content-Type': 'text/plain'});
                    res.write('Successfully subscribed!');
                    res.end();
                }
            });
		}
	}
});

console.log('Now listening on port: ' + port);
server.listen(port, '0.0.0.0');
