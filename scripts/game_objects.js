//3-10 --> 0-7
//J,Q,K,A,2 --> 8->12
var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];
var currentGame;

var Card = function (a, b) {
	"use strict";
	if (b === undefined) {
		var divide = a.indexOf(":");

		var thisSuit = a.slice(divide+1);
		var thisNum = a.slice(0,divide);
		if (!(isNaN(parseInt(thisNum)))) {
			thisNum = parseInt(thisNum);
		}

		this.num = numValues.indexOf(thisNum);
		this.suit = suitValues.indexOf(thisSuit);
		this.val = a;
	}
	else {
		this.num = a;
		this.suit = b;
		if ((a || b) !== -1) {
			this.val = numValues[a] + ":" + suitValues[b];
		}
	}
}

//compareTo checks Number first, then suit.
Card.prototype.compareTo = function (b) {
	if (this.num > b.num) {
		return 1;
	}
	else if (this.num === b.num) {
		if (this.suit > b. suit) {
			return 1;
		}
		else if (this.suit === b.suit) {
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

var threeOfSpades = new Card(0,0);


var Player = function() {
	"use strict";
	this.hand = [];
	this.selectedCards = [];
	this.isLeader = false;
}

//Removes selected cards from Players hand and plays them.
//sets currentGame.Leader to this Player if true.
//sets currentGame.lastHand to played hand if true.
Player.prototype.playCards = function() {
	"use strict";
	var playersHand = this.hand;
	var cardsToPlay = new Hand(this.selectedCards);
	var cg = currentGame;

	//repeated Code just in case
	if (cg.lastPlayedHand === null) {
		var fakeHand = new Hand(this.selectedCards);
		fakeHand.val.highest = new Card(-1,-1);
		cg.lastPlayedHand = fakeHand;
	}


	//check rule is valid, matches currentGame.currentRule, and beats lastHand.
	//reset selected cards, re-sort cards
	//set currentGame data(turnData, leader, and lastPlayed Hand)
	if (cardsToPlay.followsRule() && cardsToPlay.beats(cg.lastPlayedHand)) {
		console.log('beats rule')
		cardsToPlay.cards.forEach(function (cardToRemove) {
			var cardLocation = playersHand.findCard(cardToRemove);

			if (cardLocation !== -1) {
				playersHand.cards.splice(cardLocation,1);
			}

			else {
				console.log('couldnt find ',cardToRemove.val)
			}
		});

		this.selectedCards = [];
		playersHand.sortedCards = playersHand.cards.slice().sort(function (a,b) {
			if (a.num === b.num) {
				return (a.suit - b.suit);
			}
			else {
				return (a.num - b.num);
			}
		});


		//update sorted cards
		cg.lastPlayedHand = cardsToPlay;
		if (playersHand.cards.length === 0) {
			//call game over function.  player 1
			alert('Player ' , cg.players.indexOf(this) , 'is the winner');
		}

		//set currentPlayer and leader indexes
		var l = cg.leader = cg.players.indexOf(this);
		(l !== 3) ? cg.currentPlayer = l + 1 : cg.currentPlayer = 0;
		cg.turnData = [0,0,0,0];
		cg.turnData[l] = "L";
	}
};


//Hand object takes in array of Cards, or a single card, and organizes
var Hand = function(cards) {
	"use strict";
	if (cards instanceof Card) {
		var a = [];
		a.push(cards);
		cards = a;
	}
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
	this.getValue();
}

//Returns index of the Card if in Hand, else -1
//goes thru hand to find a card that matches input card value
Hand.prototype.findCard = function(cardToFind) {
	for (var i=0; i<this.cards.length; i++) {
		var currentCard = this.cards[i];
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

Hand.prototype.isValid = function() {
	return (this.val.type !== "invalid");
};

//Returns type for a Hand, (Single, Double, Straight 3, Straight 4) or nothing if not valid.
//Checks length, and then checks if all cards have the same number.
//If not all tnumber are the same, check if they increase by one.
Hand.prototype.getType = function() {
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
				//triples, 4ofakind
				var numToMatch = currentCard.num;
				if (i===0) {
					var allCardsMatch = sortedCards.every(function(card) {
						return (card.num === numToMatch);
					});

					if (allCardsMatch) {
						if (sortedCards.length === 3) {
							return "Triples";
						}
						else if (sortedCards.length === 4) {
							return "Bomb";
						}
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

//If Hand is Valid, gets Value, by getting Type and highest Card
Hand.prototype.getValue = function() {
	var cards = this.sortedCards;
	var handVal = this.val = {};
	//if hand is valid then return
	if (this.getType()) {
		handVal.type = this.getType();
		handVal.highest = cards[cards.length-1];
		return handVal;
	}
	else {
		handVal.type = "invalid";
	}
}

//If a Hand beats another Hand, returns true.
//Checks if both Hands are valid and same Type.
//then compares values of both cards.
Hand.prototype.beats = function(b) {
	if (this.isValid() && b.isValid()) {

		if (this.val.type === b.val.type) {
			var thisCard = this.val.highest;
			var otherCard = b.val.highest;

			var value = thisCard.compareTo(otherCard);
			return (value === 1);
		}
	}
}

//CHecks if Hand follows current rule.
Hand.prototype.followsRule = function() {

	var cr = currentGame.currentRule;

	if (cr !== "Start" && cr !== "None") {
		return (this.val.type === currentGame.currentRule);
	}

	else {
		if (cr === "Start") {
			var containsThreeOfSpades = (this.findCard(threeOfSpades) !== -1);

			if (!(containsThreeOfSpades)) {
				alert("Must have 3 of Spades in Starting Hand");
			}

			
			return this.isValid() && containsThreeOfSpades;
		}

		else if (cr === "None") {
			return this.isValid();
		}
	}
}





var Game = function() {

	"use strict";
	this.deck = [];
	this.players = [];
	this.currentRule = "Start";

	this.leader = -1;
	this.currentPlayer = -1;

	this.lastPlayedHand = null;
	
	this.turnData = [0,0,0,0];


}


Game.prototype.createDeck = function() {

	this.deck = [];

	for (var i=0; i<13; i++) {
		for (var j=0; j<4; j++) {
			this.deck.push(new Card(i, j));
		}
	}
};

Game.prototype.createPlayers = function() {

	this.players = [];

	for (var i=0; i<4; i++) {
		var newPlayer = new Player();
		this.players.push(newPlayer);
	}
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
			currentPlayer.hand = new Hand(currentPlayer.hand)
		}
	}
};

Game.prototype.initialize = function() {
	this.createDeck();
	this.createPlayers();
	this.dealCards();
};

Game.prototype.findStartingPlayer = function() {

	for (var i=0; i< this.players.length; i++) {
		var currentPlayer = this.players[i];

		for (var j=0; j<currentPlayer.hand.cards.length; j++) {
			var currentCard = currentPlayer.hand.cards[j];

			if (currentCard.val === threeOfSpades.val) {
				var playerNumber = (i+1);
				$('#currentPlayersTurn').html("Player " + playerNumber);
				$("#player" + playerNumber).addClass("activePlayer");
				$(".card[alt='3:Spade']").addClass("selected");

				this.currentPlayer = i;
				this.turnData[i] = "S";
				this.currentRule = "Start";
				currentPlayer.selectedCards.push(threeOfSpades);
				return currentPlayer;
			}
		}
	}
};

Game.prototype.displayCards = function() {

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