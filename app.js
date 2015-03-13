//var express = require('express'), app = express();
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var fileRouter = require('./scripts/fileRouter.js');
app.use('/', fileRouter);

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

io.on('connection', function(socket) {

	var connectedUsers = io.sockets.sockets.length;
	console.log(connectedUsers + ' users');
	console.log(socket.id  + ' has connected');

	socket.on('disconnect', function() {
		console.log(socket.id + ' has disconnected');
	});
});



http.listen(3000, function() {
	console.log('listening on :3000');
});