//var express = require('express'), app = express();
var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var exports = module.exports;

var fileRouter = require('./scripts/fileRouter.js');
app.use('/', fileRouter);

app.get('/', function(req, res) {
	res.sendfile('index.html');
});

var data = [];




var currentGame = exports.currentGame ;
var players = exports.players = [];

var Card = require('./game_objects/card.js');
var Player = require('./game_objects/player.js');
var Hand = require('./game_objects/hand.js');
var Game = require('./game_objects/game.js');


io.on('connection', function(socket) {

	var connectedUsers = io.sockets.sockets.length;
	console.log(connectedUsers + ' users' + '\n' + socket.id  + ' has connected');
	players.push(socket.id);

	if (players.length === 4) {
		console.log('ready to start')
		//new Game(players)
		currentGame = new Game(players);
	}

	socket.on('disconnect', function() {
		var discPlayer = data.indexOf(socket.id)
		data.splice(discPlayer,1);
		console.log(players.length + '\n' + socket.id + ' has disconnected');
	});

	socket.on('clickedCard', function(data) {
		if (data !== undefined) {
			console.log(data)
		};
	})
});



http.listen(3000, function() {
	console.log('listening on :3000');
});