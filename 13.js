//3-10 --> 0-7
//J,Q,K,A,2 --> 8->12
var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];
var currentGame;

var Card = function (a, b) {
	"use strict";
	if (b === undefined) {
		var divide = a.indexOf(":");

		var thisNum = a.slice(divide+1);
		if (!isNaN(parseInt(thisNum))) {
			thisNum = parseInt(thisNum);
		}

		this.num = numValues.indexOf(thisNum);

		this.suit = suitValues.indexOf(a.slice(0,divide));
		this.val = a;
	}

	else {
		this.num = a;
		this.suit = b;
		this.val = suitValues[b] + ":" + numValues[a];
	}

	this.compareTo = function (b) {
		if (this.suit > b.suit) {
			return 1;
		}
		else if (this.suit === b.suit) {
			if (this.num > b. num) {
				return 1;
			}
			else if (this.num === b.num) {
				return 0;
			}
			else {
				return -1;
			}
		}
		else {
			return -1;
		}
	}

};
var startingCard = new Card(0,0);


var Player = function() {
	"use strict";
	this.hand = [];
	this.selectedCards = [];
	this.isLeader = false;

	//onclick Player.selectedCards.push
};

//Hand object takes in array of Cards
var Hand = function(cards) {
	if (cards instanceof Card) {
		var a = [];
		a.push(cards);
		cards = a;
	}
	"use strict";
	//cards is an Array of Card objects
	this.cards = cards;
	this.sortedCards = cards.slice().sort(function (a,b) {

		if (a.num === b.num) {
			return (a.suit - b.suit);
		}

		else {
			return (a.num - b.num);
		}
	});
	//searches hand for a card that matches cardToFind's value
	this.findCard = function(cardToFind) {
		for (var i=0; i<this.cards.length; i++) {
			var currentCard = this.cards[i];
			//didn't reach the end
			if (i !== this.cards.length-1) {
				if (currentCard.val === cardToFind.val) {
					return i;
				}
			}
			else {
				if (currentCard.val === cardToFind.val) {
					return i;
				}
				else {
					return -1;
				}
			}
		}
	};

	this.isValid = function() {

		var cards = this.cards;
		var sortedCards = this.sortedCards;

		for (var i=0; i<sortedCards.length; i++) {

			if (sortedCards.length === 1) {
				return true;
			}

			else {
				var currentCard = sortedCards[i];
				if (i !== sortedCards.length-1) {
					var nextCard = sortedCards[i+1];
				}

				if (sortedCards.length === 2) {
					return (currentCard.num === nextCard.num);
				}

				else if (sortedCards.length > 2) {
					//check doubles, triples, 4ofakind
					var numToMatch = currentCard.num;
					if (i===0) {
						var allCardsMatch = sortedCards.every(function(card) {
												return (card.num === numToMatch);
											});

						if (allCardsMatch) {
							return true;
						}
					}

					//was not double,triple,4ofakind
					//did not reach end, check if next value is 1 more
					else if (i !== sortedCards.length-1) {
						numToMatch = currentCard.num+1;
						if (nextCard.num !== numToMatch) {
							return false;
						}
					}

					else if (i === sortedCards.length-1){
						return true;
					}
				}
			}
		}
	};


	this.getType = function() {
		var sortedCards = this.sortedCards;
		if (sortedCards.length === 1) {
			return "Single";
		}
		else {
			for (var i=0; i<sortedCards.length; i++) {
				var currentCard = sortedCards[i];
				if (i !== sortedCards.length-1) {
					var nextCard = sortedCards[i+1];
				}

				if (sortedCards.length === 2) {

					if (currentCard.num === nextCard.num) {
						return "Doubles";
					}

					else {
						return;
					}
				}

				else if (sortedCards.length > 2) {
					//check doubles, triples, 4ofakind
					var numToMatch = currentCard.num;
					if (i===0) {
						var allCardsMatch = sortedCards.every(function(card) {
							return (card.num === numToMatch);
						});

						if (allCardsMatch) {
							return "Triples";
						}
					}

					//check for straights
					//did not reach end, check if next value is 1 more
					else if (i !== sortedCards.length-1) {
						numToMatch = currentCard.num+1;
						if (nextCard.num !== numToMatch) {
							return;
						}
					}

					else if (i === sortedCards.length-1) {
						return "Straight " + sortedCards.length;
					}
				}
			}
		}
	}

	this.getValue = function() {
		var cards = this.sortedCards;
		var handVal = this.val = {};
		//if hand is valid then return
		console.log(this)
		if (this.getType()) {
			handVal.type = this.getType();
			handVal.highest = cards[cards.length-1];
			return handVal;
		}

	}
	this.getValue();

	//checks if hand is valid, and if it is beter
	this.beats = function(b) {

		if (this.isValid()) {
			var thisCard = this.val.highest;
			var otherCard = b.val.highest;

			var value = thisCard.compareTo(otherCard);

			return (value === 1);
		}



	}

	this.followsRule = function() {
		if (currentGame.currentRule !== "Start") {
			return (this.getType() === currentGame.currentRule) && (this.beatsHand(currentGame.lastPlayedHand));
		}

		else {
			return this.isValid();
		}
	}
};

Player.prototype.playCards = function() {
	"use strict";
	var playersHand = this.hand;
	var cardsToPlay = new Hand(this.selectedCards);

	//check rule
	//if selectedCards matches rule, play
	//else throw error

	//remove cards from hand
	if (cardsToPlay.getType() !== null) {
		cardsToPlay.cards.forEach(function (cardToPlay) {
			var cardLocation = playersHand.findCard(cardToPlay);

			if (cardLocation !== -1) {
				playersHand.cards.splice(cardLocation,1);
				playersHand = new Hand(playersHand.cards);
			}

			else {
				console.log('couldnt find ',cardToPlay.val)
			}
		});
	}


	this.selectedCards = [];
	this.isLeader = true;


};



var Game = function() {

	"use strict";
	this.deck = [];
	this.players = [];
	this.currentRule = "Start";
	this.leader = null;
	this.lastPlayedHand = null;


	this.createDeck = function() {

		this.deck = [];

		for (var i=0; i<13; i++) {
			for (var j=0; j<4; j++) {
				this.deck.push(new Card(i, j));
			}
		}
	};

	this.createPlayers = function() {

		this.players = [];

		for (var i=0; i<4; i++) {
			var newPlayer = new Player();
			this.players.push(newPlayer);
		}
	};

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
	};

	this.initialize = function() {
		this.createDeck();
		this.createPlayers();
		this.dealCards();
	};

	this.findStartingPlayer = function() {

		for (var i=0; i< this.players.length; i++) {
			var currentPlayer = this.players[i];

			for (var j=0; j<currentPlayer.hand.cards.length; j++) {
				var currentCard = currentPlayer.hand.cards[j];

				if (currentCard.val === startingCard.val) {
					var playerNumber = (i+1);
					$('#currentPlayersTurn').html("Player " + playerNumber);
					$("#player" + playerNumber).addClass("activePlayer");
					$(".card[alt='Spade:3']").addClass("selected");

					this.leader = currentPlayer;
					this.currentRule = "Start";
					currentPlayer.selectedCards.push(startingCard);
					return currentPlayer;
				}
			}
		}
	};

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
	};

}


	$(document).ready(function() {
		"use strict";
		currentGame = new Game();
		currentGame.initialize();
		currentGame.displayCards();
		currentGame.findStartingPlayer();

	});


$(document).on('click', '.card', function() {
	"use strict";
	//highlight DOM obj
	var clickedCard = $(this);
	clickedCard.toggleClass('selected');
	console.log('clicked on card ', clickedCard.attr('alt'));


	//get player
	var selectedPlayer = clickedCard.parent().attr('id');
	var playerNum = selectedPlayer.slice(selectedPlayer.length-1);
	playerNum -= 1;
	selectedPlayer = currentGame.players[playerNum];

	//see if clicked card is already selected.  add/remove
	var selectedCards = selectedPlayer.selectedCards;
	clickedCard = new Card(clickedCard.attr('alt'));

	if (selectedCards.length === 0) {
		selectedCards.push(clickedCard);
	}

	else {
		for (var i=0; i< selectedCards.length; i++) {
			var currentCard = selectedCards[i];
			//if already in, remove
			if (typeof currentCard === "object" && currentCard.val === clickedCard.val) {
				selectedCards.splice(i,1);
				break;
			}

			//if reached the end, and it wasnt already removed, add
			if (i === selectedCards.length-1) {
				selectedCards.push(clickedCard);
				break;
			}
		}
	}



});

$(document).on('click', '.btn.playCards', function() {

	"use strict";
	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.slice(playerIndex.length-1);
	playerIndex = parseInt(playerIndex) - 1;

	var currentPlayer = currentGame.players[playerIndex];
	console.log(currentPlayer)
	var selectedCards = new Hand(currentPlayer.selectedCards);

	console.log(selectedCards.getType())
	if (selectedCards.getType()) {
		//display cards that were played, and save to currentGame obj
		var cardsToRemove = thisPlayer.find('.selected');
		var lastPlayedHTML = "";
		cardsToRemove.each(function() {
			lastPlayedHTML += $(this)[0].outerHTML;
		});
		lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");
		lastPlayedHTML += "by Player " + (playerIndex + 1);
		$("#lastPlayed").html(lastPlayedHTML);
		currentGame.lastPlayedHand = selectedCards;


		//removeCards from players Hand in object and div
		currentPlayer.playCards();
		console.log('successfully removed.  ', currentPlayer.hand.cards.length , ' cards left');
		cardsToRemove.remove();

		//Show Current Rule and next player's turn,
		$("#currentRule").html(selectedCards.getType());
		currentGame.currentRule = selectedCards.getType();


		var nextPlayerIndex = playerIndex;
		(nextPlayerIndex !== 3) ? nextPlayerIndex += 1 : nextPlayerIndex = 0;
		currentGame.leader = currentGame.players[nextPlayerIndex];

		$("#currentPlayersTurn").html("Player " + (nextPlayerIndex + 1));
		$(".activePlayer").removeClass("activePlayer");
		$("#player" + (nextPlayerIndex + 1)).addClass("activePlayer");

	}

	else {
		console.log('cannot play these cards');
	}




});
