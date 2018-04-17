/**
 * Created by Mathew on 4/17/2018.
 */

var databaseConnection = {};

var sqlite3     = require(  'sqlite3'   );

databaseConnection.query = {
	select_person: 'SELECT primary_name,birth_year,death_year,primary_profession FROM Names WHERE primary_name = ?', 
	select_movie: 'SELECT primary_title,title_type,start_year,end_year FROM Titles WHERE primary_title = ?'
};


databaseConnection.init = function (location){
    databaseConnection.db = new sqlite3.Database(location,(err)=>{
		if (err) {
			console.error(err.message);
		}	
	});
};

databaseConnection.select = function (id,search){
	var results = [];
	databaseConnection.db.all(databaseConnection.query[id],[search],(err, rows) => {
		if (err) {
			throw err;
		}
		rows.forEach((row) => {
			results.push(row);
			console.log(row);
		});
	});
	return results;
};

databaseConnection.close = function(){
    databaseConnection.db.close();
};


module.exports = databaseConnection;
