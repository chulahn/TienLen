var exports = module.exports;

//var express = require('express'), app = express();
var app = require('express')();
var server = require('http').Server(app);
var io = exports.io = require('socket.io').listen(server);


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
	

	var newPlayer = {}
	newPlayer.id = socket.id;
	newPlayer.num = players.length;

	data.push(socket.id);
	players.push(newPlayer);

	if (players.length === 4) {
		console.log('ready to start')
		currentGame = new Game(players);
		// currentGame.findStartingPlayer();
		currentGame.displayCards();
	}

	socket.on('disconnect', function() {
		var discPlayer = data.indexOf(socket.id);
		data.splice(discPlayer,1);
		console.log(data.length + '\n' + socket.id + ' has disconnected');
	});

	socket.on('clickedCard', function(data) {
		if (data !== undefined) {
			console.log(data)
		};
	});
});



server.listen(3000, function() {
	console.log('listening on :3000');
});