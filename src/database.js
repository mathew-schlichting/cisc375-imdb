/**
 * Created by Mathew on 4/17/2018.
 */

var databaseConnection = {};

var sqlite3     = require(  'sqlite3'   );

databaseConnection.query = {select_person: '', select_movie: ''};


databaseConnection.init = function (location){
    databaseConnection.db = new sqlite3.Database(location);
};

databaseConnection.select = function (id){

};

databaseConnection.close = function(){
    databaseConnection.db.close();
};


module.exports = database;