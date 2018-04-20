// internal dependencies
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

// external dependencies
var multiparty  = require(  'multiparty');
var express     = require(  'express'   );
var favicon = require('serve-favicon');


// local dependencies
var mime = require('./mime');
var database   = require('./database');
var posters   = require('./imdb_poster');

// application variables
var app = express();
var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');


// simple replace all function to add simplicity
// https://stackoverflow.com/questions/1144783/how-to-replace-all-occurrences-of-a-string-in-javascript
String.prototype.replaceAll = function(search, replacement) {
    return this.replace(new RegExp(search, 'g'), replacement);
};
String.prototype.nameNotation = function(){
    var s = this;
    s = s.toLowerCase();
    s = s.charAt(0).toUpperCase() + s.substr(1);
    return s;
};



function initServer(){
    database.init(path.join(__dirname, '..', 'imdb.sqlite3'));
    
    console.log('Now listening on port: ' + port);
    app.listen(port);
}



// static files
app.use('/js',express.static(path.join(public_dir, 'js')));
app.use('/css', express.static(path.join(public_dir, 'css')));
app.use('/images', express.static(path.join(public_dir, 'images')));

//favicon
app.use(favicon(path.join(public_dir, 'images', 'favicon.ico')));


// home page should be static

app.get('/', (req, res) => {
    console.log('Req: /');
    res.sendFile(path.join(public_dir, 'index.html'));
});



// search
app.post('/search', (req, res) =>{
    console.log('Req: /search');

    var form;
    var i;
    var html;
    var template;

    form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if(err){returnErrorMessage(res, 500, 'Internal Server Error!');}
        else{
            // successfully obtained search params from browser
			search = fields.search[0];
			search = search.replace(/\;/g,'');
			search = search.replace(/\(/g,'');
			search = search.replace(/\)/g,'');
			database.select('select_' + fields.type[0], search, (err, results) => {
                if(err){returnErrorMessage(res, 500, err);}
                else {
                    // successfully obtained data from database

                    readyTemplate('results_template.html', 'Results', (err, page) => {
                        if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                        else{
                            // successfully created template
                            page = page.replaceAll('{{SEARCH}}', search);

                            var keys;
                            
                            if (fields.type[0] === 'Names') {
                                keys = ['primary_name', 'primary_profession', 'death_year', 'birth_year'];
                            }
                            else if (fields.type[0] === 'Titles') {
                                keys = ['primary_title', 'start_year', 'title_type', 'end_year'];
                            }

                            fs.readFile(path.join(public_dir, 'html', fields.type[0] + '_item.html'), (err, data) =>{
                                if(err){returnErrorMessage(res, 404, 'Cannot load template')}
                                else{

                                    html = '';
                                    for(i=0; i<results.length; i++){
                                        template = '' + data;

                                        if (fields.type[0] === 'Names') {
                                            template = template.replaceAll('{{NAME}}', results[i].primary_name);
                                            template = template.replaceAll('{{YEAR}}', '(' + results[i].birth_year + '-' + (results[i].death_year === null ? 'Present' : results[i].death_year) + ')');
                                            template = template.replaceAll('{{PROFESSION}}', results[i].primary_profession !== null ? formatProfessions(results[i].primary_profession) : 'Unknown');
                                        }
                                        else if (fields.type[0] === 'Titles') {
                                            template = template.replaceAll('{{TITLE}}', results[i].primary_title);
                                            template = template.replaceAll('{{YEAR}}', '(' + results[i].start_year + (results[i].end_year === null ? '' : '-' + results[i].end_year) + ')');
                                            template = template.replaceAll('{{TYPE}}', results[i].title_type !== null ? results[i].title_type.nameNotation() : 'Unknown');
                                        }

                                        template = template.replaceAll('{{LINK}}', '/' + fields.type[0] + '/' + results[i].id);


                                        html += template;
                                    }

                                        page = page.replaceAll('{{RESULTS}}', html);

                                    //respond to request
                                    res.writeHead(200, {'Content-Type': 'text/html'});
                                    res.write(page);
                                    res.end();
                                }
                            });


                        }
                    });
                }
            });
        }
    });
});


// people
app.get('/Names/:nconst', (req, res) => {
    console.log('Req: /Names/:nconst');

    database.select('select_person_by_id', req.params.nconst, (err, results) => {
        if(err){returnErrorMessage(res, 500, err);}
        else if(results.length === 1){
            // successfully obtained data from database

            readyTemplate('person_template.html', results[0].primary_name, (err, page) => {
                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                else {
                    // successfully created template
                    page = page.replaceAll('{{NAME}}', results[0].primary_name);
                    page = page.replaceAll('{{YEAR}}', results[0].birth_year + '-' + (results[0].death_year === null ? 'Present' : results[0].death_year));
                    page = page.replaceAll('{{PROFESSION}}', formatProfessions(results[0].primary_profession));
                    page = page.replaceAll('{{KNOWN_FOR_TITLES}}', results[0].known_for_titles);
                    page = page.replaceAll('{{POSTER_ID}}', req.params.nconst);

                    //respond to request
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(page);
                    res.end();

                }
            });
        }
        else{returnErrorMessage(res, 404, 'Person not found');}
    });
});


// movie titles
app.get('/Titles/:tconst', (req, res) =>{
    console.log('Req: /Titles/:tconst');
	var cast = [];
	database.select('select_cast', req.params.tconst, (err, results) => {
		if(err){returnErrorMessage(res,500,err);}
		cast = results;
	});
	database.select('select_crew', req.params.tconst, (err, results) => {
		if(err){returnErrorMessage(res,500,err);}
		var directors = [];
		var writers = [];
		if(results[0].directors !== null){
			directors = results[0].directors.split(',');
			for(dir in directors){
				var flag = 0;
				for(person in cast){
					if(dir === person.id){
						flag = 1;
					}
				}
				if(flag===0){
					database.select('select_person_by_id', dir, (err, person) => {
						if(err){returnErrorMessage(res,500,err);}
						console.log('person: ' + person[0]);
						console.log('full obj of person: ' + person);
						var add = {id: dir, primary_name: person[0].primary_name, category: "director", characters: null};
						cast.push(add);
					});
				}
			}
		}
		if(results[0].writers !== null){
			writers = results[0].writers.split(',');
			for(wri in writers){
				var flag = 0;				     
				for(person in cast){
					if(wri === person.id){
						flag = 1;
					}
				}
				if(flag===0){
					
					database.select('select_person_by_id',wri,(err, person) => {
						if(err){returnErrorMessage(res,500,err);}
						console.log('person: ' + person[0]);
						console.log('person obj: ' + person);
						var add = {id: wri, primary_name: person[0].primary_name, category: "writer", characters: null};
						cast.push(add);
					});
				}
			}
		}
		console.log(cast);
	});
    database.select('select_movie_by_id', req.params.tconst, (err, results) => {
        if(err){returnErrorMessage(res, 500, err);}
        else if(results.length === 1){
            // successfully obtained data from database

            readyTemplate('movie_template.html', results[0].primary_title, (err, page) => {
                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                else {
                    // successfully created template
                    page = page.replaceAll('{{TITLE}}',        results[0].primary_title);
                    page = page.replaceAll('{{YEAR}}',   results[0].start_year + (results[0].end_year === null ? '' : '-' +results[0].end_year));
                    page = page.replaceAll('{{TYPE}}',         results[0].type || 'Unknown');
                    page = page.replaceAll('{{RUN_TIME}}',     results[0].runtime_minutes);
                    page = page.replaceAll('{{GENRES}}',       results[0].genres.replaceAll(',', ', '));
                    page = page.replaceAll('{{RATING}}',       results[0].average_rating);
                    page = page.replaceAll('{{VOTES}}',        results[0].num_votes);
                    page = page.replaceAll('{{POSTER_ID}}', req.params.tconst);

                    //respond to request
                    res.writeHead(200, {'Content-Type': 'text/html'});
                    res.write(page);
                    res.end();
                }
            });
        }
        else{returnErrorMessage(res, 404, 'Movie not found');}
    });
});

// get poster
app.get('/poster/:type/:tconst', (req, res) => {
    var result = {};
    var getPoster;

    if(req.params.type === 'Names'){
        getPoster = posters.GetPosterFromNameId;
    } else if(req.params.type === 'Titles'){
        getPoster = posters.GetPosterFromTitleId;
    }
    
    getPoster(req.params.tconst, function (data) {
        if(data.host !== null) {
            result.src = 'http://' + data.host + data.path;
        }
        else{
            result.src = '/images/no_poster.png';
        }

        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write(JSON.stringify(result));
        res.end();
    });
});




initServer();

















/********************************   Utility Functions   *****************************/

function getFile(file, callback){
    fs.readFile(file, callback);
}

function returnErrorMessage(res, code, message){
    res.writeHead(code, {'Content-Type': 'text/plain'});
    res.write(message);
    res.end()
}


function readyTemplate(page, title, callback){
    var template_location = path.join(public_dir, 'html');
    var result;


    getFile(path.join(template_location, 'main_template.html'), (err, main_template) => {
        if (err) {callback(err);}
        else {
            getFile(path.join(template_location, page), (err, page_template) => {
                if (err) {callback(err);}
                else {
                    result = '' + main_template;
                    result = result.replaceAll('{{PAGE-TITLE}}', title);
                    result = result.replaceAll('{{BODY}}', page_template + '');
                    callback(undefined, result);
                }
            });
        }
    });
}

function formatProfessions(p){
    var s = p.split(',');
    var result = '';
    for(var i=0; i<s.length; i++){
        if(i !== 0){result += ' / ';}
        result += s[i].nameNotation();
    }
    return result;
}

function yearRange(includePresent, start, end){
    var result = '( ' + start;
    if(includePresent){

    }

    return result + ' )';
}


/********************************************* ****************************************************/
