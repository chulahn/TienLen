var exports = module.exports;

var Card = require('./game_objects/card.js');
var Player = require('./game_objects/player.js');
var Hand = require('./game_objects/hand.js');
var Game = require('./game_objects/game.js');

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


var cg = exports.currentGame ;
var players = exports.players = [];

function emitEach(eventName, data) {
	for (var j=0; j<4; j++) {
		var currentPlayer = io.sockets.sockets[j];

		if (eventName === 'setUpPlayer') {
			data = cg.players[j];
			console.log('emitting setup player ' + currentPlayer.id)
			io.to(currentPlayer.id).emit(eventName, {playerData: data , lastPlayedHand: cg.lastPlayedHand});
			// return;
		}

		// io.to(currentPlayer.id).emit(eventName, data);
	};
}

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
		cg = new Game(players);
		emitEach('setUpPlayer');
		console.log(cg.players[0])
		cg.findStartingPlayer();
		cg.displayCards();
	}

	socket.on('clickedCard', function(data) {
		if (data !== undefined) {
			cg.players[data.playerNum].selectedCards = data.selectedCards;
			console.log('Player ' + data.playerNum);
			console.log(cg.players[data.playerNum].selectedCards);
		};
	});

	socket.on('disconnect', function() {
		var discPlayer = data.indexOf(socket.id);
		data.splice(discPlayer,1);
		console.log(data.length + '\n' + socket.id + ' has disconnected');
	});

	socket.on('getGameData', function() {
		socket.emit('receiveGameData', cg)
	});
});



server.listen(3000, function() {
	console.log('listening on :3000');
});