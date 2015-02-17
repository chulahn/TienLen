//Number
//3-10 --> 0-7
//J,Q,K,A,2 --> 8->12
var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];

//Suits
//Spade, Clover, Diamond, Hearts --> 0-3
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];

var Card = function (num, suit) {

	this.num = num;
	this.suit = suit;
	this.val = suitValues[suit] + ":" + numValues[num];
	
}


var Player = function() {
	this.hand = [];
}

var Game = function() {

	this.deck = [];
	this.players = [];

	this.createDeck = function() {

		this.deck = [];

		for (var i=0; i<13; i++) {
			for (var j=0; j<4; j++) {
				this.deck.push(new Card(i, j))
			}
		}

	}

	this.createPlayers = function() {

		this.players = [];

		for (var i=0; i<4; i++) {
			var newPlayer = new Player();
			this.players.push(newPlayer);
		}

	}

	this.dealCards = function() {

		//JS .length in for loop is dynamic
		for (var i=0; i<52; i++) {

			var cardToDeal = Math.floor(Math.random() * this.deck.length);
			cardToDeal = this.deck.splice(cardToDeal,1)[0];	

			var currentPlayer = i % 4;
			currentPlayer = this.players[currentPlayer];

			currentPlayer.hand.push(cardToDeal);

		}
	}


}


