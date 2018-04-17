/**
 * Created by Mathew on 4/17/2018.
 */

var connection = {};

var sqlite3     = require(  'sqlite3'   );

connection.query = {select_person: '', select_movie: ''};


connection.initDatabase = function (location){
    connection.db = new sqlite3.Database(location);
};

connection.select = function (id){
    connection.db.each("SELECT nconst FROM Names", function(err, row) {
        if(err){
            console.log('error');
        }
        else {
            console.log(row.nconst);
        }
    });
};

connection.close = function(){
    connection.db.close();
};


module.exports = connection;