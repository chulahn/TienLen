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


var cg = exports.currentGame;
var players = exports.players = [];

function emitEach(eventName, data) {
	for (var j=0; j<4; j++) {
		var currentPlayer = io.sockets.sockets[j];

		if (eventName === 'setUpPlayer') {
			data = cg.players[j];
			console.log('emitting setup player ' + currentPlayer.id)
			io.to(currentPlayer.id).emit(eventName, {playerData: data , updatedGame: cg});
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
		cg.findStartingPlayer();
		emitEach('setUpPlayer');
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

	socket.on('getLastPlayedHand', function() {
		socket.emit('sendLastPlayedHand', cg.lastPlayedHand);
	});

	socket.on('updatePlayer', function(updatedPlayer) {
		console.log('updating player')
		var i = cg.findPlayerIndex(updatedPlayer);
		console.log(cg.players[i].hand.cards.length)
		cg.players[i] = updatedPlayer;
		cg.players[i].__proto__ = Player.prototype;
		console.log(cg.players[i].hand.cards.length)
	});

	socket.on('updateLastPlayedHand', function(lastPlayedHand) {
		console.log('on updating last played')
		cg.lastPlayedHand = lastPlayedHand;
		cg.lastPlayedHand.__proto__ = Hand.prototype;
	});

	socket.on('sendLastPlayedHTML', function(html) {
		console.log('received lastplayed, emitting')
		socket.broadcast.emit('displayLastPlayed', html);
	});

	socket.on('sendCurrentRuleHTML', function(html) {
		console.log('recive currentRuleHTML')
		socket.broadcast.emit('displayCurrentRule', html);

	})
});



server.listen(3000, function() {
	console.log('listening on :3000');
});