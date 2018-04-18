// internal dependencies
var fs      = require(  'fs'    );
var url     = require(  'url'   );
var path    = require(  'path'  );

// external dependencies
var multiparty  = require(  'multiparty');
var express     = require(  'express'   );

// local dependencies
var mime = require('./mime');
var database   = require('./database');

// application variables
var app = express();
var port = 8018;
var public_dir = path.join(__dirname, '../WebContent/public');


function initServer(){
    database.init(path.join(__dirname, '..', 'imdb.sqlite3'));
    
    console.log('Now listening on port: ' + port);
    app.listen(port);
}



// static files
app.use('/js',express.static(path.join(public_dir, 'js')));
app.use('/css', express.static(path.join(public_dir, 'css')));


// home page should be static

app.get('/', (req, res) => {
    console.log('Req: /');
    res.sendFile(path.join(public_dir, 'index.html'));
});



// search
app.post('/search', (req, res) =>{
    var form;

    console.log('Req: /search');

    form = new multiparty.Form();
    form.parse(req, (err, fields, files) => {
        if(err){returnErrorMessage(res, 500, 'Internal Server Error!');}
        else{
            // successfully obtained search params from browser

			database.select('select_' + fields.type[0], fields.search[0], (err, results) => {
                if(err){returnErrorMessage(res, 500, err);}
                else {
                    // successfully obtained data from database

                    readyTemplate('results_template.html', (err, page) => {
                        if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                        else{
                            // successfully created template
                            page = page.replace('{{SEARCH}}', fields.search[0]);

                            var keys;

                            console.log(results);

                            if (fields.type[0] === 'Names') {
                                keys = ['primary_name', 'primary_profession', 'death_year', 'birth_year']; //todo
                            }
                            else if (fields.type[0] === 'Titles') {
                                keys = ['primary_title', 'start_year', 'title_type', 'end_year'];
                            }


                            page = page.replace('{{RESULTS}}', generateResultsHTML(fields.type[0], results, keys));

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

            readyTemplate('person_template.html', (err, page) => {
                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                else {
                    // successfully created template
                    page = page.replace('{{NAME}}', results[0].primary_name);
                    page = page.replace('{{BIRTH_YEAR}}', results[0].birth_year);
                    page = page.replace('{{DEATH_YEAR}}', results[0].death_year === null ? 'Present' : results[0].death_year);
                    page = page.replace('{{PROFESSION}}', results[0].primary_profession);

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

            readyTemplate('movie_template.html', (err, page) => {
                if(err){returnErrorMessage(res, 404, 'Unable to find file')}
                else {
                    // successfully created template
                    page = page.replace('{{TITLE}}', results[0].primary_title);
                    page = page.replace('{{YEAR}}', results[0].start_year);

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

function readyTemplate(page, callback){
    var template_location = path.join(public_dir, 'html');
    var result;

    fs.readFile(path.join(template_location, 'main_template.html'), (err, main_template) => {
        if (err) {callback(err);}
        else {
            fs.readFile(path.join(template_location, page), (err, page_template) => {
                if (err) {callback(err);}
                else {
                    console.log(typeof(main_template));
                    result = '' + main_template;
                    result = result.replace('{{PAGE-TITLE}}', 'Results');
                    result = result.replace('{{BODY}}', page_template + '');
                    callback(undefined, result);
                }
            });
        }
    });
}
/********************************************* ****************************************************/
