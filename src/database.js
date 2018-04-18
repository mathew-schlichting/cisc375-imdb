/**
 * Created by Mathew on 4/17/2018.
 */

var connection = {};

var sqlite3     = require(  'sqlite3'   );

connection.query = {
	// people
	select_Names: 'SELECT nconst AS id, primary_name, birth_year, death_year, primary_profession FROM Names WHERE primary_name = ?',
	select_Names_wild: 'SELECT nconst AS id, primary_name, birth_year, death_year, primary_profession FROM Names WHERE primary_name LIKE ?',
	select_person_by_id: 'SELECT primary_name, birth_year, death_year, primary_profession, known_for_titles FROM Names WHERE nconst = ?',

	// movies
	select_Titles: 'SELECT tconst AS id, primary_title, title_type, start_year, end_year FROM Titles WHERE primary_title = ?',
	select_Titles_wild: 'SELECT tconst AS id, primary_title, title_type, start_year, end_year FROM Titles WHERE primary_title LIKE ?',
	select_movie_by_id: 'SELECT primary_title, original_title, title_type, start_year, runtime_minutes, genres FROM Titles WHERE tconst = ?',


	todo: ''
};


connection.init = function (location){
    connection.db = new sqlite3.Database(location,(err)=>{
		if (err) {
			console.error(err.message);
		}	
	});
};

connection.select = function (id, search, callback){
	var results = [];
	//sanitize
	search = search.replace(/\;/g,'');
	search = search.replace(/\(/g,'');
	search = search.replace(/\)/g,'');
	console.log(search);
	if(search.includes("*")){
		search = search.replace(/\*/g,'%');
		id = id + "_wild";
	}
	
	connection.db.all(connection.query[id],[search],(err, rows) => {
		if (err) {
			console.log(err);
            callback(err, undefined);
		}
		else {
			rows.forEach((row) => {
				results.push(row);
			});

			callback(undefined, results);
		}
	});
};

connection.close = function(){
    connection.db.close();
};


module.exports = connection;
