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
                                keys = ['primary_name', 'primary_profession', 'death_year', 'birth_year']; //todo
                            }
                            else if (fields.type[0] === 'Titles') {
                                keys = ['primary_title', 'start_year', 'title_type', 'end_year'];
                            }


                            page = page.replaceAll('{{RESULTS}}', generateResultsHTML(fields.type[0], results, keys));

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
                    page = page.replaceAll('{{BIRTH_YEAR}}', results[0].birth_year);
                    page = page.replaceAll('{{DEATH_YEAR}}', results[0].death_year === null ? 'Present' : results[0].death_year);
                    page = page.replaceAll('{{PROFESSION}}', results[0].primary_profession);
                    page = page.replaceAll('{{KNOWN_FOR_TITLES}}', results[0].known_for_titles);

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


app.get('/poster/Titles/:tconst', (req, res) => {
    var result = {};

    posters.GetPosterFromTitleId(req.params.tconst, function (data) {
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

function returnErrorMessage(res, code, message){
    res.writeHead(code, {'Content-Type': 'text/plain'});
    res.write(message);
    res.end()
}

function generateResultsHTML(type, data, keys){
    var i;
    var html = '';

    for(i=0; i<data.length; i++){
        html += '<li class="list-group-item padding-none">';
        html +=     '<div class="btn btn-default full-size" onclick="window.location.href=\'/' + type + '/' + data[i].id + '\'">';
        html +=         '<span class="result-text">' + data[i][keys[0]] +' ' + data[i][keys[1]] + '</span>';
        html +=     '</div>';
        html += '</li>';
    }

    return html;
}

function readyTemplate(page, title, callback){
    var template_location = path.join(public_dir, 'html');
    var result;

    fs.readFile(path.join(template_location, 'main_template.html'), (err, main_template) => {
        if (err) {callback(err);}
        else {
            fs.readFile(path.join(template_location, page), (err, page_template) => {
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
/********************************************* ****************************************************/
