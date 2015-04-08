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
		if (action === "Leader" || action === "Start") {

			var curr = playerInd;
			var next = curr.nextIndex();

			while (next !== curr) {
				if (isNaN(parseInt(this.turnData[next]))) {
					this.turnData[next] = "-";
				}
				next = next.nextIndex();
			}
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

		for (var i=0; i<this.players.length; i++) {
			currentPlayer = this.players[i];

			if (currentPlayer.finished()) {

			}
		}

		//player plays and finishes and other players, skip, the player after gets a new rule;;

		//player can play cards and beginning of turn and win game
		//if player won, updateTurnData should be different. 

		var newTurn = (this.turnData.indexOf('-') === -1); 
		if (newTurn) {
			var leader = this.turnData.indexOf("Leader");
			this.updateTurnData("Start", leader);

			this.currentRule = "None";
			this.lastPlayedHand = null;
			return true;
		}
		return false;
	}
};


//Adds the index of the Player to array of finishedPlayers and updates turnData array w/ place.
Game.prototype.addWinner = function(i) {

	console.log('adding winner');

	this.finishedPlayers.push(i);
	console.log(this.finishedPlayers);

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
	this.turnData[i] = placeString;
};


module.exports = Game;