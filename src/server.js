// internal dependencies
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

// external dependencies
var multiparty  = require( 'multiparty'    );
var express     = require( 'express'       );
var favicon     = require( 'serve-favicon' );
var bodyParser  = require( 'body-parser'   );

// local dependencies
var mime = require('./mime');
var database   = require('./database');
var posters   = require('./imdb_poster');

// application variables
var app = express();
var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');
var preloaded_lists = {};
var doneloading = false;

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
String.prototype.filterFormat = function(){
    var s = this;
    s = s.toLowerCase();
    s = s.replaceAll('-', '');
    s = s.replaceAll('/', '');
    s = s.replaceAll('_', '');
    s = s.replaceAll(' ', '');
    return s;
};



function initServer(){
    database.init(path.join(__dirname, '..', 'imdb.sqlite3'));
    
    loadProfessionList(() =>{
        if(preloaded_lists.genres !== undefined && preloaded_lists.professions !== undefined && preloaded_lists.types !== undefined){
            console.log('Now listening on port: ' + port);
            app.listen(port);
        }
    });
    loadGenreList(() => {
        if(preloaded_lists.genres !== undefined && preloaded_lists.professions !== undefined && preloaded_lists.types !== undefined){
            console.log('Now listening on port: ' + port);
            app.listen(port);
        }
    });
    loadTypeList(() =>{
        if(preloaded_lists.genres !== undefined && preloaded_lists.professions !== undefined && preloaded_lists.types !== undefined){
            console.log('Now listening on port: ' + port);
            app.listen(port);
        }
    });
}

//use body parser for put requests
app.use(bodyParser.json());

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
// about the project page should be static
app.get('/about', (req, res) => {
    console.log('Req: /');
    res.sendFile(path.join(public_dir, 'html', 'about-the-project.html'));
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

                            fs.readFile(path.join(public_dir, 'html', fields.type[0] + '_item.html'), (err, data) =>{
                                if(err){returnErrorMessage(res, 404, 'Cannot load template')}
                                else{
                                    html = '';

                                    for(i=0; i<results.length; i++){
                                        //filter
                                        var addToList = false;

                                        if (fields.type[0] === 'Names') {
                                            if(fields.filter[0].filterFormat() === 'all' || results[i].primary_profession.filterFormat().includes(fields.filter[0].filterFormat())){
                                                addToList = true;
                                            }
                                        }
                                        else if (fields.type[0] === 'Titles') {
                                            if(fields.filter[0].filterFormat() === 'all' || results[i].title_type.filterFormat().includes(fields.filter[0].filterFormat())){
                                                addToList = true;
                                            }
                                        }

                                        if(addToList) {


                                            template = '' + data;

                                            if (fields.type[0] === 'Names') {
                                                template = template.replaceAll('{{NAME}}', results[i].primary_name);
                                                template = template.replaceAll('{{YEAR}}', '(' + results[i].birth_year + '-' + (results[i].death_year === null ? 'Present' : results[i].death_year) + ')');
                                                template = template.replaceAll('{{PROFESSION}}', results[i].primary_profession !== null ? formatProfessions(results[i].primary_profession) : 'Unknown');
                                                template = template.replaceAll('{{ID}}', 'Names-' + results[i].id);
                                            }
                                            else if (fields.type[0] === 'Titles') {
                                                template = template.replaceAll('{{TITLE}}', results[i].primary_title);
                                                template = template.replaceAll('{{YEAR}}', '(' + results[i].start_year + (results[i].end_year === null ? '' : '-' + results[i].end_year) + ')');
                                                template = template.replaceAll('{{TYPE}}', results[i].title_type !== null ? results[i].title_type.nameNotation() : 'Unknown');
                                                template = template.replaceAll('{{ID}}', 'Titles-' + results[i].id);
                                            }

                                            template = template.replaceAll('{{ID}}', results[i].id);
                                            template = template.replaceAll('{{LINK}}', '/' + fields.type[0] + '/' + results[i].id);


                                            html += template;
                                        }
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

// names wiki
app.put('/Names/:nconst', (req, res) =>{
    console.log('Req: PUT /Names/:nconst');
	database.update('update_person_by_id',req.params.nconst,req.body,(err,results) => {
		if(err){returnErrorMessage(res,500,err);}
        res.writeHead(200, {'Content-Type': 'text/plain'});
        res.write('success');
        res.end();
	});
    

    //respond to request

});

//titles wiki
app.put('/Titles/:tconst', (req, res) =>{
    console.log('Req: PUT /Titles/:tconst');
	database.update('update_title_by_id',req.params.tconst,req.body, (err, results) => {
		if(err){returnErrorMessage(res,500,err);}
        var data;
        for(var i=0;i<req.body.cast.length;i++){
            data = {};
            data.id = req.body.cast[i];
            data.order = i;
            database.update('update_bill_order', req.params.tconst, data, (err, results) =>{
                if(err){returnErrorMessage(res, 500, err);}
               if(results === req.body.cast.length - 1){
                   //respond to request
                   res.writeHead(200, {'Content-Type': 'text/plain'});
                   res.write('success');
                   res.end();
               }
            });
        }
	});
});

//get a list
app.get('/list/:type', (req, res) => {

    //respond to request
    res.writeHead(200, {'Content-Type': 'text/plain'});
    res.write(JSON.stringify(preloaded_lists[req.params.type]));
    res.end();
});

// people
app.get('/Names/:nconst', (req, res) => {
    console.log('Req: GET /Names/:nconst');
	var html = '';
    var i;

	database.select('select_person_by_id', req.params.nconst, (err, results) => {
		if(err){returnErrorMessage(res,500,err);}
        else {
            var knownTitles = results[0].known_for_titles.split(',');
            var template;
            if (knownTitles !== null) {
                fs.readFile(path.join(public_dir, 'html', 'Titles_item.html'), (err, data) => {
                    if (err) {returnErrorMessage(res, 404, 'Cannot load template')}
                    else {
                        var promise = new Promise((resolve, reject) =>{
                            for (i = 0; i < knownTitles.length; i++) {
                                database.select('select_movie_by_id', knownTitles[i], (err, res) => {
                                    if (err) {returnErrorMessage(res, 500, err);}
                                    else {
                                        if (res[0] !== undefined) {
                                            template = '' + data;
                                            template = template.replaceAll('{{TITLE}}', res[0].primary_title);
                                            template = template.replaceAll('{{YEAR}}', '(' + res[0].start_year + (res[0].end_year === null ? '' : '-' + res[0].end_year) + ')');
                                            template = template.replaceAll('{{TYPE}}', res[0].title_type !== null ? res[0].title_type.nameNotation() : 'Unknown');
                                            template = template.replaceAll('{{LINK}}', '/Titles/' + res[0].id);
                                            template = template.replaceAll('{{ID}}', res[0].id);
                                            html += template;
                                        }
                                    }

                                });
                                if(i+1 === knownTitles.length) {
                                    resolve('success');
                                }
                            }
                        });
                        promise.then((data) => {
                            readyTemplate('person_template.html', results[0].primary_name, (err, page) => {
                                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                                else {
                                    // successfully created template
                                    page = page.replaceAll('{{NAME}}', results[0].primary_name);
                                    page = page.replaceAll('{{YEAR}}', results[0].birth_year + '-' + (results[0].death_year === null ? 'Present' : results[0].death_year));
                                    page = page.replaceAll('{{PROFESSION}}', formatProfessions(results[0].primary_profession));
                                    page = page.replaceAll('{{KNOWN_FOR_TITLES}}', html);

                                    page = page.replaceAll('{{POSTER_ID}}', req.params.nconst);

                                    //respond to request
                                    res.writeHead(200, {'Content-Type': 'text/html'});
                                    res.write(page);
                                    res.end();

                                }
                            });
                        });
                    }
                });
            }
        }
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
			for(var i = 0;i<directors.length;i++){
				var flag = 0;
				var dir = directors[i];
				for(person in cast){
					if(dir === person.id){
						flag = 1;
					}
				}
				if(flag===0){
					database.select('select_person_by_id', dir, (err, per) => {
						if(err){returnErrorMessage(res,500,err);}
						if(per[0] !== undefined){
							var add = {id: dir, primary_name: per[0].primary_name, category: "director", characters: null};
							cast.push(add);
						}
					});
				}
			}
		}
		if(results[0].writers !== null){
			writers = results[0].writers.split(',');
			for(var i = 0;i<writers.length;i++)
				var wri = writers[i];{
				var flag = 0;				     
				for(person in cast){
					if(wri === person.id){
						flag = 1;
					}
				}
				if(flag===0){
					
					database.select('select_person_by_id',wri,(err, per) => {
						if(err){returnErrorMessage(res,500,err);}
						if(per[0]!==undefined){
							var add = {id: wri, primary_name: per[0].primary_name, category: "writer", characters: null};
							cast.push(add);
						}
					});
				}
			}
		}
	});

    database.select('select_movie_by_id', req.params.tconst, (err, results) => {
        if(err){returnErrorMessage(res, 500, err);}
        else if(results.length === 1){
            // successfully obtained data from database
			var html = '';
			var template;
			if(cast!==null){
				fs.readFile(path.join(public_dir, 'html', 'Names_item.html'), (err, data) => {
					if(err){returnErrorMessage(res,404,'Cannot load template')}
					else{
						for(i=0;i<cast.length;i++){
							template = '' + data;
							template = template.replaceAll('{{NAME}}', cast[i].primary_name);
							template = template.replaceAll('{{YEAR}}', cast[i].category);
							template = template.replaceAll('{{PROFESSION}}', cast[i].characters !== null ? formatCharacters(cast[i].characters) : '');
							template = template.replaceAll('{{LINK}}', '/Names/' + cast[i].id);
                            template = template.replaceAll('{{ID}}', cast[i].id);

                            html+=template;
						}
					}
				});
			}    
		readyTemplate('movie_template.html', results[0].primary_title, (err, page) => {
                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                else {
                    // successfully created template
                    page = page.replaceAll('{{TITLE}}',     results[0].primary_title);
                    page = page.replaceAll('{{YEAR}}',      results[0].start_year + (results[0].end_year === null ? '' : '-' +results[0].end_year));
                    page = page.replaceAll('{{TYPE}}',      results[0].title_type !== null ? results[0].title_type.nameNotation() : 'Unknown');
                    page = page.replaceAll('{{RUN_TIME}}',  results[0].runtime_minutes);
                    page = page.replaceAll('{{GENRES}}',    results[0].genres !== null ? results[0].genres.replaceAll(',', ', ') : 'Unknown');
                    page = page.replaceAll('{{RATING}}',    results[0].average_rating);
                    page = page.replaceAll('{{VOTES}}',     results[0].num_votes);
                    page = page.replaceAll('{{POSTER_ID}}', req.params.tconst);
					page = page.replaceAll('{{CAST}}',html);

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
        if(data !== null && data.host !== null && data.path !== null) {
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

function loadProfessionList(callback){
    database.select('select_professions', undefined, (err, results) => {
        var i;
        var j;
        var data = {};
        var temp;
        var list = '';

        for(i=0; i<results.length; i++){
            if(results[i].primary_profession !== null) {
                temp = results[i].primary_profession.split(',');
                for (j = 0; j < temp.length; j++) {
                    if (!list.includes(temp[j])) {
                        list += temp[j] + ',';
                    }
                }
            }
        }

        data.list = list.substring(0, list.length - 1);
        data.list = data.list.replaceAll('_', ' ');
        preloaded_lists.professions = data;
        console.log('Loaded profession list');

        callback();
    });
}

function loadGenreList(callback){
    database.select('select_genres', undefined, (err, results) => {
        var i;
        var j;
        var data = {};
        var temp;
        var list = '';

        for(i=0; i<results.length; i++){
            if(results[i].genres !== null) {
                temp = results[i].genres.split(',');
                for (j = 0; j < temp.length; j++) {
                    if (!list.includes(temp[j])) {
                        list += temp[j] + ',';
                    }
                }
            }
        }

        data.list = list.substring(0, list.length - 1);
        data.list = data.list.replaceAll('_', ' ');
        preloaded_lists.genres = data;
        console.log('Loaded genre list');

        callback();
    });
}

function loadTypeList(callback){
    database.select('select_types', undefined, (err, results) => {
        var i;
        var data = {};
        var temp;
        var list = '';

        for(i=0; i<results.length; i++){
            temp = results[i].title_type;
            if(!list.includes(temp)) {
                list += temp + ',';
            }
        }

        data.list = list.substring(0, list.length - 1);
        data.list = data.list.replaceAll('_', ' ');
        preloaded_lists.types = data;
        console.log('Loaded type list');

        callback();
    });
}

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
    if(p === null){
        p = 'Unknown';
    }
    var s = p.split(',');
    var result = '';
    for(var i=0; i<s.length; i++){
        if(i !== 0){result += ' / ';}
        result += s[i].nameNotation();
    }
    return result;
}

function formatCharacters(c){
    var s = c.split(',');

    var result = '';
    for(var i=0; i<s.length; i++){
        if(i !== 0){result += ' / ';}
        s[i] = s[i].replaceAll('\\[', '').replaceAll('"', '').replaceAll('\\]', '');
        result += '"' + s[i].nameNotation() + '"';
    }
    return 'As: ' + result;
}

function yearRange(includePresent, start, end){
    var result = '( ' + start;
    if(includePresent){

    }

    return result + ' )';
}


/********************************************* ****************************************************/
