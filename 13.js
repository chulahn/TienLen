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

};
var startingCard = new Card(0,0);


var Player = function() {
	"use strict";
	this.hand = [];
	this.selectedCards = [];
	this.isLeader = false;

	//onclick Player.selectedCards.push
};

var Hand = function(cards) {
	"use strict";
	//cards is an Array of Card objects
	this.cards = cards;

	//searches hand for a card that matches cardToFind's value
	this.findCard = function(cardToFind) {
		console.log(this.cards.length)
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

		var sorted = cards.sort(function (a,b) {
			if (a.num === b.num) {
				return (a.suit - b.suit);
			}

			else {
				return (a.num - b.num);
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
	};

	this.followsRule = function() {
		var cards = this.cards;

		switch (currentGame.currentRule) {

			case "Start":
				return (cards.findCard(startingCard) !== -1)
			case "Single":
				return (cards.length === 1);
			case "Doubles":
				return (cards.length === 2);
			case "Triples":
				return (cards.length === 3);




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
	if (cardsToPlay.isValid() === true) {
		cardsToPlay.cards.forEach(function (cardToPlay) {
			var cardLocation = playersHand.findCard(cardToPlay);
			console.log('removing card at' , cardLocation);

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

	"use strict"
	this.deck = [];
	this.players = [];

	this.currentRule = "Start";
	this.leader = null;

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

	this.setRule = function(rule) {

		"use strict";
		for (var c in this.players) {
			var currentPlayer = this.players[c];
			currentPlayer.rule = this.currentRule;
		}
	};

	this.initialize = function() {
		this.createDeck();
		this.createPlayers();
		this.dealCards();
		this.setRule();
	};

	this.findStartingPlayer = function() {

		for (var i=0; i< this.players.length; i++) {
			var currentPlayer = this.players[i];

			for (var j=0; j<currentPlayer.hand.cards.length; j++) {
				var currentCard = currentPlayer.hand.cards[j];

				if (currentCard.val === startingCard.val) {
					var playerNumber = (i+1);
					alert("Player " + playerNumber + " has the 3 of Spades");
					$("#player" + playerNumber).addClass("activePlayer");
					$(".card[alt='Spade:3']").addClass("selected")

					this.leader = currentPlayer;
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


		$(".card[alt='Spade:3']").off('click');

		console.log($(".card[alt='Spade:3']"));
	});


$(document).on('click', '.card', function() {
	"use strict";
	//highlight DOM obj
	var thisCard = $(this);
	thisCard.toggleClass('selected');
	console.log('clicked on card ', thisCard.attr('alt'));

	//get player
	var selectedPlayer = thisCard.parent().attr('id');
	var playerNum = selectedPlayer.slice(selectedPlayer.length-1);
	playerNum -= 1;
	selectedPlayer = currentGame.players[playerNum];

	//add or remove card
	thisCard = new Card(thisCard.attr('alt'));

	var selectedCards = selectedPlayer.selectedCards;

	if (selectedCards.length === 0) {
		selectedCards.push(thisCard);
	}

	else {

		for (var i=0; i< selectedCards.length; i++) {

			var currentCard = selectedCards[i];
			if (typeof currentCard === "object" && currentCard.val === thisCard.val) {
				selectedCards.splice(i,1);
				break;
			}

			if (i === selectedCards.length-1) {
				selectedCards.push(thisCard);
				break;
			}


		}
	}



});

$(document).on('click', '.btn.playCards', function() {

	"use strict";
	var thisPlayer = $(this).closest('.player');
	var playerNum = thisPlayer.attr('id');
	var playerIndex = playerNum.slice(playerNum.length-1);
	playerIndex = parseInt(playerIndex) - 1;

	var currentPlayer = currentGame.players[playerIndex];
	var selectedCards = new Hand(currentPlayer.selectedCards);

	if (selectedCards.isValid()) {
		var cardsToRemove = thisPlayer.find('.selected');

		var lastPlayedHTML = "";
		cardsToRemove.each(function() {
			console.log($(this));
			lastPlayedHTML += $(this)[0].outerHTML;
			console.log(1)
			console.log(lastPlayedHTML)
		});
		lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");

		currentPlayer.playCards();

		console.log('successfully removed.  ', currentPlayer.hand.cards.length , ' cards left');

		cardsToRemove.remove();

		$('#currentRule').html('doubles');
		$('#lastPlayed').html(lastPlayedHTML);

		console.log(thisPlayer.children('.selected').length);

		//move to next player

	}

	else {
		console.log('cannot play these cards');
	}




});

// a.findStartingPlayer();

//wait for player to playCards
//move to nextPlayer

//if everyone skips, leader stays same, rule is reset;

//if someone beats, reassign leader
