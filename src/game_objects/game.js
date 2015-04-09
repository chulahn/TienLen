var Card = require('./card.js');
var Hand = require('./hand.js');
var Player = require('./player.js');
var server = require('../app.js');


var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var threeOfSpades = new Card(0,0);

Number.prototype.nextIndex = function() {
	return (this != 3 ? this + 1 : 0);
};

var Game = function(players) {

	"use strict";
	this.deck = [];
	this.players = [];
	this.currentRule = "Start";
	this.finishedPlayers = [];

	this.leader = -1;
	this.currentPlayer = -1;

	this.lastPlayedHand = null;
	
	this.turnData = ['-','-','-','-'];

	this.initialize(players);
};


Game.prototype = {
	//finds a player based on socket
	findPlayerIndex: function(player) {
		for (var i=0; i<this.players.length; i++) {
			if (this.players[i].id === player.id) {
				console.log('Found player at index ' + i);
				return i;
			}
		}
	},

	createDeck: function() {
		this.deck = [];

		for (var i=0; i<13; i++) {
			for (var j=0; j<4; j++) {
				this.deck.push(new Card(i, j));
			}
		}
		console.log('deck created ' + this.deck.length);
	},

	createPlayers: function(players) {
		this.players = [];

		for (var i=0; i<4; i++) {
			console.log('adding player ' + players[i].num + ":" + players[i].id);
			var newPlayer = new Player(players[i]);
			this.players.push(newPlayer);
		}

		console.log('finished creating players');
	},

	dealCards: function() {

		for (var i=0; i<52; i++) {

			var cardToDeal = Math.floor(Math.random() * this.deck.length);
			cardToDeal = this.deck.splice(cardToDeal,1)[0];	

			var currentPlayer = i % 4;
			currentPlayer = this.players[currentPlayer];

			currentPlayer.hand.push(cardToDeal);

			if (Math.floor(i/4) === 12) {
				currentPlayer.hand = new Hand(currentPlayer.hand);
				console.log('finished dealing cards for player ' + currentPlayer.id);
			}
		}
		console.log('dealt all cards');
	},

	initialize: function(players) {
		this.createDeck();
		this.createPlayers(players);
		this.dealCards();
	},

	findStartingPlayer: function() {
		for (var i=0; i< this.players.length; i++) {
			var currentPlayer = this.players[i];

			for (var j=0; j<currentPlayer.hand.cards.length; j++) {
				var currentCard = currentPlayer.hand.cards[j];

				if (currentCard.val === threeOfSpades.val) {
					var playerNumber = (i+1);
					console.log('found starting player ' + playerNumber);

					this.currentPlayer = i;
					this.turnData[i] = "Start";
					this.currentRule = "Start";

					return currentPlayer;
				}
			}
		}
	},

	//not used
	displayCards: function() {

		var display = [];
		console.log('display Cards');

		for (var i=0; i<this.players.length; i++) {

			var currentPlayer = this.players[i];
			var currentPlayersHand = currentPlayer.hand;
			var cardHTML = currentPlayersHand.createHTML();
			
			var obj = {};
			obj.selecter = "#player" + (i+1) + " div.hand";
			obj.html = cardHTML;
			display.push(obj);
		}

		console.log('finished loop' , display.length);

		if (display.length === 4) {
			console.log('emit displayCards');
			for (var j=0; j<server.io.sockets.sockets.length; j++) {
				var currentSocket = server.io.sockets.sockets[j];

				server.io.to(currentSocket.id).emit('displayCards', {cards:display ,playerNum : j});
			}
		}
	},
	/*
		updateTurnData: function(action, playerInd) {
			if (action === "Leader") {
				this.turnData = ['-','-','-','-'];
			}
			this.turnData[playerInd] = action;
		},
	*/
	updateTurnData: function(action, playerInd) {
		console.log('update turndata');
		if (action === "Leader" || action === "Start") {

			var curr = playerInd;
			var next = curr.nextIndex();

			console.log(this.turnData);
			console.log('curr ' + curr + ' next ' + next);
			while (next !== curr) {
				if (isNaN(parseInt(this.turnData[next]))) {
					this.turnData[next] = "-";
				}
				next = next.nextIndex();
			}
			console.log(this.turnData);
		}
		this.turnData[playerInd] = action;

	},

	//only called when skip
	checkTurnData: function() {

		var someoneWon = this.players.some(function (player) {
			return player.finished();
		});

		console.log('player won ' + someoneWon);

		if (someoneWon) {
			console.log('someoneWon');
		}

		//player plays and finishes and other players, skip, the player after gets a new rule;;

		//player can play cards and beginning of turn and win game
		//if player won, updateTurnData should be different. 
		console.log(this.turnData);
		console.log(this.currentPlayer);
		this.setNextPlayer();

		var newTurn = (this.turnData.indexOf('-') === -1); 
		if (newTurn) {
			console.log('new turn');
			var startingPlayer = this.turnData.indexOf("Leader");

			if (startingPlayer === -1) {
				console.log('no leader') ;
				var lastFinished = this.getLastFinishedPlace();
				var lastFinishedIndex = this.turnData.indexOf(lastFinished);
				startingPlayer = this.getPlayerAfter(lastFinishedIndex);
			}

			this.currentPlayer = startingPlayer;
			this.updateTurnData("Start", startingPlayer);

			this.currentRule = "None";
			this.lastPlayedHand = null;
			return true;
		}

		return false;
	},

	setNextPlayer: function() {

		var curr = this.currentPlayer;
		var next = curr.nextIndex();

		//while next value is a number
		//skip, leader, 1 , or 2
		while (this.turnData[next] !== "-") {

			if (next === curr) { //reached the end
				this.currentPlayer = curr.nextIndex();
				return true;
			}
			next = next.nextIndex();
		}
		this.currentPlayer = next;

	}
};


//Adds the index of the Player to array of finishedPlayers and updates turnData array w/ place.
Game.prototype.addWinner = function(i) {
	console.log('adding winner');
	this.finishedPlayers.push(i);

	console.log(this.finishedPlayers);
	var winnerNum = this.finishedPlayers.length;

	var placeString = this.getLastFinishedPlace();
	console.log(placeString);
	this.turnData[i] = placeString;
};

Game.prototype.getLastFinishedPlace = function() {

	var winnerNum = this.finishedPlayers.length;

	var placeString = "";
	switch (winnerNum) {
		case 1:
			placeString = "1st";
			break;
		case 2:
			placeString = "2nd";
			break;
		case 3:
			placeString = "3rd";
			break;
		case 4:
			placeString = "4th";
			break;
	}

	return placeString;

};

//getPlayerAfter is called with the index of lastFinishedPlace, and all pass's have been set to "-"
//if turndata looked like [-,-,1,-], Game.getPlayerAfter(2) would return 3
//[-,-,1,2], Game.getPlayerAfter(3) would return 0
//[1,-,-,2], Game.getPlayerAfter(3) would return 1
Game.prototype.getPlayerAfter = function(i) {

	var valid = (this.turnData.indexOf("-") !== -1);

	if (!valid) {
		console.log('getPlayerAfter called on invalid turnData'.red);
		console.log(this.turnData);

		for (var j=0; j<this.turnData.length; j++) {
			var turn = this.turnData[j];
			console.log(turn);
			if (turn === "Pass") { this.turnData[j] = "-"; }
		}
		console.log(this.turnData);
	}

	var start = i;
	var next = start.nextIndex();

	while(this.turnData[next] !== "-") {
		next = next.nextIndex();
	}

	return next;

};

module.exports = Game;