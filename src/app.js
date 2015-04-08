var exports = module.exports;

var Card = require('./game_objects/card.js');
var Player = require('./game_objects/player.js');
var Hand = require('./game_objects/hand.js');
var Game = require('./game_objects/game.js');

//var express = require('express'), app = express();
var app = require('express')();
var server = require('http').Server(app);
var io = exports.io = require('socket.io').listen(server);
var colors = require('colors');

var fileRouter = require('./fileRouter.js');

app.use('/', fileRouter);

app.get('/', function(req, res) {
	res.sendfile('./public/index.html');
});


var cg = exports.currentGame;
var socketIds = [];
var players = exports.players = [];
var missingPlayers = [];
var gameStarted = false;

function emitEach(eventName, data) {
	for (var j=0; j<4; j++) {
		var currentSocket = io.sockets.sockets[j];

		switch(eventName) {
			case 'setUpPlayer':
				io.to(currentSocket.id).emit(eventName, {playerIndex: j , updatedGame: cg});
				break;
			case 'reconnectGame':

				for (var k=0; k<cg.players.length; k++) {
					var currentPlayer = cg.players[k];
					if (currentSocket.id == currentPlayer.id) {
						io.to(currentSocket.id).emit(eventName, {playerIndex: k , updatedGame: cg});
					}
				}
				break;				
		}
		console.log('emitting ' + eventName + ' ' + currentSocket.id);
	}
}

io.on('connection', function(socket) {

	var connectedUsers = io.sockets.sockets.length;
	console.log(connectedUsers + ' users' + '\n' + socket.id  + ' has connected');
	
	if (gameStarted === false) {
		var newPlayer = {};
		newPlayer.id = socket.id;
		newPlayer.num = players.length;

		socketIds.push(socket.id);

		players.push(newPlayer);

		if (socketIds.length === 4) {
			console.log('ready to start');
			gameStarted = true;
			cg = new Game(players);
			cg.findStartingPlayer();
			emitEach('setUpPlayer');
		}		
	} else {
		if (socketIds.length < 4) {
			socketIds.push(socket.id);
			var newConnected = missingPlayers.shift();
			newConnected.id = socket.id;
			players.push(newConnected); //push object containing id and num
			cg.players[newConnected.num].id = newConnected.id; 
			if (socketIds.length === 4) {
				//update everyones game
				console.log('reconnectingGame');
				emitEach("reconnectGame");
			}
		}
	}

	socket.on('disconnect', function() {
		var discPlayer = socketIds.indexOf(socket.id);
		socketIds.splice(discPlayer,1);
		console.log(socketIds.length + 'players. ' + discPlayer + " " + socket.id + ' has disconnected');

		missingPlayers.push(players.splice(discPlayer,1)[0]);
		console.log(missingPlayers);
		console.log('--------');

		if (socketIds.length === 0) {
			console.log('no connections, deleting game');
			missingPlayers = [];
			gameStarted = false;
		}

	});
	

	socket.on('clickedCard', function(data) {
		if (data !== undefined) {
			cg.players[data.playerNum].selectedCards = data.selectedCards;
			console.log('Player ' + (data.playerNum+1));
			console.log(cg.players[data.playerNum].selectedCards);
		}
	});


	socket.on('getGameData', function(action) {
		console.log(socket.id + ' requested gameData action was '.green + action);

		switch (action) {
			case "play":
				socket.emit('readyToPlayCards', cg);
				break;
			// case "skip";
			// 	socket.emit('')

		}
		console.log('sentData'.red);
	});

	socket.on('playCards', function(d) {

		var i = cg.findPlayerIndex(d.updatedPlayer);
		cg.players[i] = d.updatedPlayer;
		cg.players[i].__proto__ = Player.prototype;

		updateGame(d.newGame);

		console.log('----player ' + (i+1) + ' played cards----'.green +  socket.id);
		console.log('Leader is now ', + (cg.leader+1) + " Current player:" + (cg.currentPlayer+1));
		console.log('-----end played cards.  emitting to other players-----'.red);

		socket.broadcast.emit('playedCards', {cg: cg, updatedPlayer: d.updatedPlayer});
	});

	socket.on('skipTurn', function(localGame) {
		console.log('skipped turn'.yellow + socket.id + ' skipped turn'.yellow);	
		cg.currentPlayer = localGame.currentPlayer;
		cg.turnData = localGame.turnData;
		var newTurn = cg.checkTurnData();
		if (newTurn) { console.log('newTurn'.yellow); }
		socket.broadcast.emit('skipTurn', {cg:cg, newTurn:newTurn});
	});
});

server.listen(3000, function() {
	console.log('listening on :3000');
});

function updateGame(clientGame) {

	cg.lastPlayedHand = clientGame.lastPlayedHand;
	cg.lastPlayedHand.__proto__ = Hand.prototype;

	cg.leader = clientGame.leader;
	cg.currentPlayer = clientGame.currentPlayer;
	cg.turnData = clientGame.turnData;
	cg.currentRule = clientGame.currentRule;

}