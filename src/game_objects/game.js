var Card = require('./card.js');
var Hand = require('./hand.js');
var Player = require('./player.js');
var server = require('../app.js');


var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var threeOfSpades = new Card(0,0);

var Game = function(players) {

	"use strict";
	this.deck = [];
	this.players = [];
	this.currentRule = "Start";

	this.leader = -1;
	this.currentPlayer = -1;

	this.lastPlayedHand = null;
	
	this.turnData = [0,0,0,0];

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

	setTurnData: function(action, playerInd) {
		if (action === "Leader") {
			this.turnData = [0,0,0,0];
		}
		this.turnData[playerInd] = action;
	},

	checkTurnData: function() {
		if (this.turnData.indexOf(0) === -1) {
			console.log("new Turn");
			var leader = this.turnData.indexOf("Leader");
			this.turnData = [0,0,0,0];
			this.turnData[leader] = "Start";

			this.currentRule = "None";
			this.lastPlayedHand = null;
			return true;
		}
		return false;
	}
};



module.exports = Game;