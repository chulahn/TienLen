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
var players = [];
var missingPlayers = [];
var gameStarted = false;

function emitEach(eventName, data) {
	for (var j=0; j<4; j++) {
		var currentSocket = players[j];

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
	console.log(connectedUsers + ' users' + ' : ' + socket.id  + ' has connected');
	
	if (gameStarted === false) {
		var newPlayer = {};
		newPlayer.id = socket.id;
		newPlayer.num = players.length;

		socketIds.push(socket.id);
		players.push(newPlayer);

		if (players.length === 4) {
			console.log('ready to start');
			gameStarted = true;
			cg = new Game(players);
			cg.findStartingPlayer();
			emitEach('setUpPlayer');
		}		
	} else {

		//Game already started, but some player(s) disconnected.
		if (players.length < 4) {

			socketIds.push(socket.id);

			//Get the first disconnected Player, change id to current socket's id
			var newConnected = missingPlayers.shift();
			newConnected.id = socket.id;
			players.push(newConnected); //push object containing id and num
			console.log(players);

			//Update Server's Game object with new Player id
			cg.players[newConnected.num].id = newConnected.id; 

			//4 Players are connected, Update everyones game
			if (players.length === 4) {
				console.log('reconnectingGame');
				emitEach("reconnectGame");
			}
		} else if (players.length === 4) {

			console.log("Spectactor joined");
			socketIds.push(socket.id);

			io.to(socket.id).emit("reconnectGame", {playerIndex: socketIds.length-1 , updatedGame: cg});
		}
	}

	socket.on('disconnect', function() {
		
		//Remove disconnected Player's socket
		var discPerson = socketIds.indexOf(socket.id);
		socketIds.splice(discPerson,1);
		console.log(socketIds.length + ' sockets left.');



		
		//Find the Object which has the same id
		//Remove from players and push to missingPlayers

		for (var i=0; i<players.length; i++) {

			if (players[i].id === socket.id) {
				missingPlayers.push(players.splice(i,1)[0]);
				console.log(players.length + ' players left. ' +  
					" Player" + (discPerson+1) + ':' + socket.id + ' has disconnected');
			}

		}

		console.log(missingPlayers);
		console.log('--------');


		//Reset Game if no players;
		if (players.length === 0) {
			console.log('no players, deleting game');
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

		updateGame('played', d.newGame);

		console.log(cg.players[i].finished());

		if (cg.players[i].finished()) {
			cg.addWinner(i);
		}

		console.log('----player ' + (i+1) + ' played cards----'.green +  socket.id);
		console.log('Leader is now ', + (cg.leader+1) + " Current player:" + (cg.currentPlayer+1));
		console.log('-----end played cards.  emitting to other players-----'.red);

		socket.broadcast.emit('playedCards', {cg: cg, updatedPlayer: d.updatedPlayer});
	});

	socket.on('skipTurn', function(clientGame) {
		console.log('skipped turn'.yellow + socket.id + ' skipped turn'.yellow);

		updateGame('skip', clientGame);	

		var newTurn = cg.checkTurnData();
		if (newTurn) { console.log('newTurn'.yellow); }
		socket.broadcast.emit('skipTurn', {cg:cg, newTurn:newTurn});
	});
});



server.listen(3000, function() {
	console.log('listening on :3000');
});

function updateGame(action, clientGame) {

	cg.currentPlayer = clientGame.currentPlayer;
	cg.turnData = clientGame.turnData;
	
	if (action === "played") {
		cg.lastPlayedHand = clientGame.lastPlayedHand;
		cg.lastPlayedHand.__proto__ = Hand.prototype;

		cg.leader = clientGame.leader;
		cg.currentRule = clientGame.currentRule;
	}
}