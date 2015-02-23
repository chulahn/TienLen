//3-10 --> 0-7
//J,Q,K,A,2 --> 8->12
var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];
var currentGame;

var Card = function (a, b) {

	if (b === undefined) {
		var divide = a.indexOf(":");

		var thisNum = a.slice(divide+1);
		if (!isNaN(parseInt(thisNum))) {
			thisNum = parseInt(thisNum);
		};

		this.num = numValues.indexOf(thisNum);

		this.suit = suitValues.indexOf(a.slice(0,divide));
		this.val = a;
	}

	else {
		this.num = a;
		this.suit = b;
		this.val = suitValues[b] + ":" + numValues[a];
	}

}
var startingCard = new Card(0,0);


var Player = function() {
	this.hand = [];
	this.cardsToPlay = [];
	this.isLeader;

	//onclick Player.cardsToPlay.push
}

var Hand = function(cards) {
	//cards is an Array of Card objects
	this.cards = cards;

	this.isValid = function() {

		var cards = this.cards;

		var sorted = cards.sort(function (a,b) {
			if (a.num === b.num) {
				return (a.suit - b.suit);
			}

			else {
				return (a.num - b.num)
			}
		});


		for (var i=0; i<sorted.length; i++) {

			if (sorted.length === 1) {
				return true;
			}

			else {
				var currentCard = sorted[i];
				if (i !== sorted.length-1) {
					var nextCard = sorted[i+1];
				}

				if (sorted.length === 2) {
					return (currentCard.num === nextCard.num);
				}

				else if (sorted.length > 2) {
					//check doubles, triples, 4ofakind
					var numToMatch = currentCard.num;
					if (i===0) {
						var allCardsMatch = sorted.every(function(card) {
												return (card.num === numToMatch);
											});

						if (allCardsMatch) {
							return true;
						}
					}

					//was not double,triple,4ofakind
					//did not reach end, check if next value is 1 more
					else if (i !== sorted.length-1) {
						numToMatch = currentCard.num+1;
						if (nextCard.num !== numToMatch) {
							return false;
						}
					}

					else if (i === sorted.length-1){
						return true;
					}	
				}			
			}
		}		
	}
}

Player.prototype.playCards = function() {

	//check rule
	//if cardsToPlay matches rule, play
	//else throw error

	//remove cards from hand
	this.cardsToPlay.forEach(function (cardToPlay) {
		var cardLocation = this.hand.indexOf(cardToPlay);
		this.hand.splice(cardLocation,1);
	});

	this.isLeader = true;
}



var Game = function() {

	this.deck = [];
	this.players = [];

	this.currentRule;
	this.leader;

	this.createDeck = function() {

		this.deck = [];

		for (var i=0; i<13; i++) {
			for (var j=0; j<4; j++) {
				this.deck.push(new Card(i, j));
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

			if (Math.floor(i/4) === 12) {
				currentPlayer.hand = new Hand(currentPlayer.hand)
			}
		}
	}

	this.setRule = function(rule) {

		for (c in this.players) {
			var currentPlayer = this.players[c];
			currentPlayer.rule = this.currentRule;
		}
	}

	this.initialize = function() {
		this.createDeck();
		this.createPlayers();
		this.dealCards();
		this.setRule();
	}

	this.findStartingPlayer = function() {

		for (p in this.players) {
			var currentPlayer = this.players[p];

			for (c in currentPlayer.hand) {
				var currentCard = currentPlayer.hand[c];

				if (currentCard.val === startingCard.val) {
					alert("Player " + p + " has the 3 of Spades");
					this.leader = currentPlayer;
					return currentPlayer;
				}
			}
		}
	}

	this.displayCards = function() {

		for (var i=0; i<this.players.length ; i++) {

			var currentPlayer = this.players[i];
			var currentPlayersHand = currentPlayer.hand.cards;

			for (var j=0; j< currentPlayersHand.length; j++) {

				var currentCard = currentPlayersHand[j];

				var cardHTML = "<div class='card panel-primary' alt='";
				cardHTML += currentCard.val;
				cardHTML += "'>";

				cardHTML += "<div class='panel-heading'>";

				cardHTML += "<span id='card_font'>";
				cardHTML += numValues[currentCard.num];
				cardHTML += "</span>";

				iconHTML = "<img class='";
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

				iconHTML += "' src='img_trans.gif'></img>";
				cardHTML += iconHTML;

				cardHTML += "</div>";

				cardHTML += "<div class ='panel-body'>";


				cardHTML += "</div>";
				cardHTML += "</div>";

				var selector = "#player" + (i+1);
				$("#player" + (i + 1) + "").append(cardHTML);


			}


		}
	}

}


	$(document).ready(function() {
		currentGame = new Game();
		currentGame.initialize();
		currentGame.displayCards();
	});

$(document).on('click','.card', function() {
	//highlight DOM obj
	var thisCard = $(this);
	thisCard.toggleClass('selected');

	//get player
	var selectedPlayer = thisCard.parent().attr('id');
	var playerNum = selectedPlayer.slice(selectedPlayer.length-1);
	playerNum -= 1;
	selectedPlayer = currentGame.players[playerNum];

	//add or remove card
	thisCard = new Card(thisCard.attr('alt'));

	var cardsToPlay = selectedPlayer.cardsToPlay;
	console.log(cardsToPlay)

	if (cardsToPlay.length === 0) {
		cardsToPlay.push(thisCard);
	}

	else {
		console.log ('not 0')

		for (var i=0; i< cardsToPlay.length; i++) {

			var currentCard = cardsToPlay[i];
			if (typeof currentCard === "object" && currentCard.val === thisCard.val) {
				cardsToPlay.splice(i,1);
				break;
			}

			if (i === cardsToPlay.length-1) {
				cardsToPlay.push(thisCard);
				break;
			}


		}
	}



	console.log(selectedPlayer.cardsToPlay);
})

// a.findStartingPlayer();

//wait for player to playCards
//move to nextPlayer

//if everyone skips, leader stays same, rule is reset;

//if someone beats, reassign leader
