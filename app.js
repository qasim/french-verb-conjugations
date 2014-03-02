
/**
 * Module dependencies.
 */

var express = require('express');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var sqlite = require('sqlite3');
var tools = require('./tools');
var request = require('request');
var fs = require('fs');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(express.cookieParser('your secret here'));
app.use(express.session());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

app.get('/', routes.index);

var server = http.createServer(app);

server.listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

//Get the database
var db = new sqlite.Database("verbs.db");

//Start listening for clients
var io = require('socket.io').listen(server);

//When a client connects
io.sockets.on('connection', function(socket) {

	//When a client makes a search request
	socket.on('search', function(data) {

		//Only do this if query is longer than 2 characters:
		if(data.query.length > 2) {
		  query = decodeURIComponent(data.query);
      query = tools.removeDiacritics(query);
			query = query.replace(/''/g, '%27');
			query = query.replace(/%/g, '%27');

			//Huge ass query. My "algorithm" for finding wanted verb.
			db.each("SELECT * FROM (\
        SELECT _id, name, meaning, desc, data, '1' as ord FROM verbs\
        WHERE name_unaccented LIKE '" + query + "' ESCAPE '\\'\
			  UNION\
        SELECT _id, name, meaning, desc, data, '2' as ord FROM verbs\
        WHERE name_unaccented LIKE '%" + query + "%' ESCAPE '\\'\
        UNION\
        SELECT _id, name, meaning, desc, data, '3' as ord FROM verbs\
        WHERE data_unaccented LIKE '%\"" + query + "\"]%' ESCAPE '\\'\
        UNION\
        SELECT _id, name, meaning, desc, data, '4' as ord FROM verbs\
        WHERE meaning LIKE '%\"" + query + "\"%' ESCAPE '\\'\
        UNION\
        SELECT _id, name, meaning, desc, data, '5' as ord FROM verbs\
        WHERE meaning LIKE '%" + query + "%' ESCAPE '\\'\
			) ORDER BY ord ASC LIMIT 8", function(err, row) {
				//The beautiful ID.
				var _id = row._id;

				//Get verb, put it in the right format
				var verb = decodeURIComponent(row.name);

				//Get the nature from JSON obj
				var desc = JSON.parse(row.desc);
				var nature = desc.nature;
				nature = decodeURIComponent(nature);
        var meaning = JSON.parse(row.meaning);

				//Send to client
				io.sockets.emit('result', {
					'_id': _id,
					'verb': verb,
          'meaning': meaning,
					'nature': nature
				});
			}, function(err, rows) {
				if(rows == 0) {
					io.sockets.emit('no-results', {});
				}
			});
		} else {
			io.sockets.emit('no-results', {});
		}
	});

});
