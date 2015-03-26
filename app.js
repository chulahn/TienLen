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




var cg = exports.currentGame;
var socketIds = [];
var players = exports.players = [];
var missingPlayers = [];
var gameStarted = false;

function emitEach(eventName, data) {
	for (var j=0; j<4; j++) {

		switch(eventName) {
			case 'setUpPlayer':
			case 'reconnectGame':
				var currentPlayer = io.sockets.sockets[j];
				console.log('emitting ' + eventName + ' ' + currentPlayer.id)
				io.to(currentPlayer.id).emit(eventName, {playerData: j , updatedGame: cg});
				break;				
		}

		// if (eventName === ('setUpPlayer' || 'reconnectGame')) {
			// return;
		// }

		// switch (eventName) {


		// 	case "reconnectedGame" :
		// 		io.
		// }
		// io.to(currentPlayer.id).emit(eventName, data);
	};
}

io.on('connection', function(socket) {

	var connectedUsers = io.sockets.sockets.length;
	console.log(connectedUsers + ' users' + '\n' + socket.id  + ' has connected');
	
	if (gameStarted === false) {
		var newPlayer = {}
		newPlayer.id = socket.id;
		newPlayer.num = players.length;

		socketIds.push(socket.id);

		players.push(newPlayer);

		if (socketIds.length === 4) {
			console.log('ready to start')
			gameStarted = true;
			cg = new Game(players);
			cg.findStartingPlayer();
			emitEach('setUpPlayer');
			// cg.displayCards();
		}		
	}
	else {
		if (socketIds.length < 4) {
			socketIds.push(socket.id);
			var newConnected = missingPlayers.shift();
			newConnected.id = socket.id;	
			players.push(newConnected); //push a Player object instead of object containing id and num
			cg.players[newConnected.num] = newConnected; 
			if (socketIds.length === 4) {
				//update everyones game
				console.log('reconnectingGame')
				emitEach("reconnectGame");
			}
		}

	}

	

	socket.on('clickedCard', function(data) {
		if (data !== undefined) {
			cg.players[data.playerNum].selectedCards = data.selectedCards;
			console.log('Player ' + data.playerNum+1);
			console.log(cg.players[data.playerNum].selectedCards);
		};
	});

	socket.on('disconnect', function() {
		var discPlayer = socketIds.indexOf(socket.id);
		socketIds.splice(discPlayer,1);
		console.log(socketIds.length + 'players. ' + discPlayer + " " + socket.id + ' has disconnected');

		missingPlayers.push(players.splice(discPlayer,1));
		console.log(missingPlayers);
		console.log('--------');

		if (socketIds.length === 0) {
			console.log('no connections, deleting game')
			missingPlayers = [];
			gameStarted = false;
		}

	});

	socket.on('getGameData', function() {
		socket.emit('receiveGameData', cg)
	});

	socket.on('getLastPlayedHand', function() {
		socket.emit('sendLastPlayedHand', cg.lastPlayedHand);
	});

	socket.on('displayNewRule', function(d) {
		socket.broadcast.emit('displayNewRule',d);
	});

	socket.on('playedCards', function(d) {

		var i = cg.findPlayerIndex(d.updatedPlayer);
		console.log('----player ' + (i+1) + ' played cards----')
		console.log(cg.players[i].hand.cards.length)
		cg.players[i] = d.updatedPlayer;
		cg.players[i].__proto__ = Player.prototype;
		console.log(cg.players[i].hand.cards.length)

		cg.lastPlayedHand = d.oldGame.lastPlayedHand;
		cg.lastPlayedHand.__proto__ = Hand.prototype;

		cg.leader = d.oldGame.leader;
		cg.currentPlayer = d.oldGame.currentPlayer;
		cg.turnData = d.oldGame.turnData;
		cg.currentRule = d.oldGame.currentRule;
		console.log('displaying turndata ', + cg.leader +" "+ cg.currentPlayer);
		console.log('-----end played cards.  emitting to other players-----')

		//NEED TO pass updated player to local
		socket.broadcast.emit('playedCards', {cg: cg, updatedPlayer: d.updatedPlayer});

	});

	socket.on('skipTurn', function(localGame) {
		cg.currentPlayer = localGame.currentPlayer;
		cg.turnData = localGame.turnData;
		var newTurn = cg.checkTurnData(); 
		socket.broadcast.emit('skipTurn', {cg:cg, newTurn:newTurn});
	});
});



server.listen(3000, function() {
	console.log('listening on :3000');
});