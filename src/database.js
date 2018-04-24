/**
 * Created by Mathew on 4/17/2018.
 */

var connection = {};

var sqlite3     = require(  'sqlite3'   );

connection.query = {
	// people
	select_Names: 'SELECT nconst AS id, primary_name, birth_year, death_year, primary_profession FROM Names WHERE primary_name = ? COLLATE NOCASE',
	select_Names_wild: 'SELECT nconst AS id, primary_name, birth_year, death_year, primary_profession FROM Names WHERE primary_name LIKE ? COLLATE NOCASE',
	select_person_by_id: 'SELECT nconst AS id, primary_name, birth_year, death_year, primary_profession, known_for_titles FROM Names WHERE nconst = ?',
	update_person_by_id: 'UPDATE Names SET birth_year = ?, death_year = ?, primary_profession = ? WHERE nconst = ?',
	select_person_filter: 'SELECT primary_name, birth_year, death_year, primary_profession, known_for_titles FROM Names WHERE primary_name LIKE ? AND primary_profession LIKE ? COLLATE NOCASE',

    //lists
    select_professions: 'SELECT primary_profession FROM Names',
    select_genres: 'SELECT genres FROM Titles',
    select_types: 'SELECT title_type FROM Titles',


    // movies
	select_Titles: 'SELECT tconst AS id, primary_title, title_type, start_year, end_year FROM Titles WHERE primary_title = ? COLLATE NOCASE',
	select_Titles_wild: 'SELECT tconst AS id, primary_title, title_type, start_year, end_year FROM Titles WHERE primary_title LIKE ? COLLATE NOCASE',
    select_movie_by_id: 'SELECT Titles.tconst AS id, primary_title, title_type, start_year, end_year, runtime_minutes, genres, average_rating, num_votes FROM Titles LEFT JOIN Ratings ON Ratings.tconst = Titles.tconst WHERE Titles.tconst = ?',
	select_cast: 'SELECT Principals.nconst AS id, primary_name, category, characters FROM Principals INNER JOIN Names ON Principals.nconst = Names.nconst WHERE tconst = ? ORDER BY ordering',
	select_crew: 'SELECT directors,writers FROM Crew WHERE tconst = ?',
	update_title_by_id: 'UPDATE Titles SET genres = ?, title_type = ? WHERE tconst = ?',
	update_bill_order: 'UPDATE Principals SET ordering = ? WHERE tconst = ? AND nconst = ?',
	select_titles_filter: 'SELECT tconst as id, primary_title, title_type, start_year, end_year FROM Titles WHERE primary title LIKE ? AND title_type = ? COLLATE NOCASE',
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


    if(search) {
        //sanitize
        search = search.replace(/\;/g, '');
        search = search.replace(/\(/g, '');
        search = search.replace(/\)/g, '');
        //console.log(search);
        if (search.includes("*")) {
            search = search.replace(/\*/g, '%');
            id = id + "_wild";
        }

        connection.db.all(connection.query[id], [search], (err, rows) => {
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
    }
    else{
        connection.db.all(connection.query[id], (err, rows) => {
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
	}
};

connection.close = function(){
    connection.db.close();
};


module.exports = connection;
