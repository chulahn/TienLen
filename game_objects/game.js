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
}

Game.prototype.findPlayerIndex = function(player) {
	for (var i=0; i<this.players.length; i++) {
		if (this.players[i].id === player.id) {
			console.log('index ' + i);
			return i;
		}
	}
}

Game.prototype.createDeck = function() {

	this.deck = [];

	for (var i=0; i<13; i++) {
		for (var j=0; j<4; j++) {
			this.deck.push(new Card(i, j));
		}
	}

	console.log('deck created ' + this.deck.length)
};

Game.prototype.createPlayers = function(players) {
	this.players = [];

	for (var i=0; i<4; i++) {
		console.log('adding player ' + players[i].num + ":" + players[i].id);
		var newPlayer = new Player(players[i]);
		this.players.push(newPlayer);
	}

	console.log('finished creating players');
};

Game.prototype.dealCards = function() {

	//JS .length in for loop is dynamic
	for (var i=0; i<52; i++) {

		var cardToDeal = Math.floor(Math.random() * this.deck.length);
		cardToDeal = this.deck.splice(cardToDeal,1)[0];	

		var currentPlayer = i % 4;
		currentPlayer = this.players[currentPlayer];

		currentPlayer.hand.push(cardToDeal);

		if (Math.floor(i/4) === 12) {
			currentPlayer.hand = new Hand(currentPlayer.hand);
			console.log('finished dealing cards for player ' + currentPlayer.id)
		}
	}
	console.log('dealt all cards');
	// this.findStartingPlayer();
};

Game.prototype.initialize = function(players) {
	this.createDeck();
	this.createPlayers(players);
	this.dealCards();
};

Game.prototype.findStartingPlayer = function() {
	console.log("looking for starting player");
	for (var i=0; i< this.players.length; i++) {
		var currentPlayer = this.players[i];

		for (var j=0; j<currentPlayer.hand.cards.length; j++) {
			var currentCard = currentPlayer.hand.cards[j];

			if (currentCard.val === threeOfSpades.val) {
				var playerNumber = (i+1);
				console.log('found starting player ' + playerNumber);
				server.io.emit('foundStartingPlayer', playerNumber);

				this.currentPlayer = i;
				this.turnData[i] = "S";
				this.currentRule = "Start";

				return currentPlayer;
			}
		}
	}
};

Game.prototype.displayCards = function() {

	var display = [];
	console.log('display Cards')

	for (var i=0; i<this.players.length ; i++) {

		var currentPlayer = this.players[i];
		var currentPlayersHand = currentPlayer.hand.cards;
		var cardHTML = "";

		for (var j=0; j< currentPlayersHand.length; j++) {

			var currentCard = currentPlayersHand[j];

			cardHTML += "<div class='card panel-primary' alt='";
			cardHTML += currentCard.val;
			cardHTML += "'>";

			cardHTML += "<div class='panel-heading'>";

			cardHTML += "<span id='card_font'>";
			cardHTML += numValues[currentCard.num];
			cardHTML += "</span>";

			var iconHTML = "<img class='";
			switch (currentCard.suit) {
				case 0:
					iconHTML += "spade";
					break;
				case 1:
					iconHTML += "clover";
					break;
				case 2:
					iconHTML += "diamond";
					break;
				case 3:
					iconHTML += "heart";
					break;
			}
			iconHTML += "' src='/images/img_trans.gif'></img>";
			cardHTML += iconHTML;

			cardHTML += "</div>";
			cardHTML += "<div class ='panel-body'>";
			cardHTML += "</div>";
			cardHTML += "</div>";

		}
		var obj = {};
		obj.selecter = "#player" + (i+1);
		obj.html = cardHTML;
		display.push(obj);
	}

	console.log('finished loop' , display.length)

	if (display.length === 4) {
		console.log('emit displayCards');
		for (var j=0; j<server.io.sockets.sockets.length; j++) {
			var currentPlayer = server.io.sockets.sockets[j];

			server.io.to(currentPlayer.id).emit('displayCards', {cards:display ,playerNum : j});
		};
	}
};

Game.prototype.setTurnData = function(action, playerInd) {
	if (action === "Leader") {
		this.turnData = [0,0,0,0];
	}
	this.turnData[playerInd] = action;
}

Game.prototype.checkTurnData = function() {
	if (this.turnData.indexOf(0) === -1) {
		var leader = this.turnData.indexOf("Leader");
		this.turnData = [0,0,0,0];
		this.turnData[leader] = ["Start"];
		alert("New Turn.  Player " + (leader+1) + " starts");
		currentGame.currentRule = "None";
		currentGame.lastPlayedHand = null;
		$('#currentRule').html("None");
		$('#lastPlayed').html("");
	}
}

module.exports = Game;