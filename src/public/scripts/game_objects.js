//3-10 --> 0-7
//J,Q,K,A,2 --> 8->12
var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];
var currentGame;
Array.prototype.sortCards = function() {
	var sorted = this.slice().sort(function (a,b) {
		if (a.num === b.num) {
			return (a.suit - b.suit);
		} else {
			return (a.num - b.num);
		}
	});
	return sorted;
};
//Card can take in a Card, a String, or two ints
var Card = function (a, b) {
	"use strict";
	//Passed in Object or String
	if (b === undefined) {
		//Copy Constructor
		if ((a.length === undefined) && (typeof a === "object")) {
			//console.log("Card Copy Constructor");
			this.num = a.num;
			this.suit = a.suit;
			this.val = a.val;
		} else if (typeof a === "string" && a.length > 0) {	
			//console.log('Card Constructor String ' + a)	
			
			var divide = a.indexOf(":");
			var thisSuit = a.slice(divide+1);
			var thisNum = a.slice(0,divide);
			if (!isNaN(parseInt(thisNum))) {
				thisNum = parseInt(thisNum);
			}

			this.num = numValues.indexOf(thisNum);
			this.suit = suitValues.indexOf(thisSuit);
			this.val = a;
		}
	} else {
		//Pass in Two Ints.(0-12, 0-3)
		this.num = a;
		this.suit = b;
		if ((a || b) !== -1) {
			this.val = numValues[a] + ":" + suitValues[b];
		}
	}
};

//compareTo checks Number first, then suit.
Card.prototype.compareTo = function (b) {
	if (this.num > b.num) {
		return 1;
	} else if (this.num === b.num) {
		if (this.suit > b. suit) {
			return 1;
		} else if (this.suit === b.suit) {
			return 0;
		} else {
			return -1;
		}
	} else {
		return -1;
	}
};

var threeOfSpades = new Card(0,0);

//Player Copy constructor, so new object will have prototype methods
var Player = function(obj) {
	"use strict";
	this.id = obj.id;
	this.num = obj.num;
	this.hand = new Hand(obj.hand);
	this.selectedCards = obj.selectedCards;
};

//Removes selected cards from Players hand, resets selected Cards and re-sorts hand.
//Sets turnData, and leader and currentPlayer indexes.
//Sets lastPlayedHand
//Saves data locally and on server
Player.prototype.playCards = function() {
	"use strict";
	var playerHand = this.hand;
	var cardsToPlay = new Hand(this.selectedCards);

	//repeated Code just in case
	if (localGame.lastPlayedHand === null) {
		var fakeHand = new Hand(this.selectedCards);
		fakeHand.val.highest = new Card(-1,-1);
		localGame.lastPlayedHand = fakeHand;
	}


	if (cardsToPlay.followsRule() && cardsToPlay.beats(localGame.lastPlayedHand)) {

		console.log('Player:beats lastPlayedHand and valid');
		localGame.lastPlayedHand = cardsToPlay;
		localGame.currentRule = cardsToPlay.getType();

		
		//Removes played Cards and re-sorts.  Resets player's selectedCards
		cardsToPlay.cards.forEach(function (cardToRemove) {
			var cardLocation = playerHand.findCard(cardToRemove);

			if (cardLocation !== -1) {
				playerHand.cards.splice(cardLocation,1);
			} else {
				console.log('couldnt find ',cardToRemove.val);
			}
		});

		playerHand.sortedCards = playerHand.cards.sortCards();
		this.selectedCards = [];


		//Sets turnData, and indexes for leader and currentPlayer
		var l = localGame.leader = localGame.findPlayerIndex(this);
		localGame.currentPlayer = l.nextIndex();
		// (l !== 3) ? localGame.currentPlayer = l + 1 : localGame.currentPlayer = 0;
		localGame.setTurnData("Leader", l);

		console.log('=====emitting play cards');
		//Updates server's data 		
		socket.emit('playCards', {oldGame : localGame, updatedPlayer : this});


		if (playerHand.cards.length === 0) {
			//call game over function.  player 1
			alert('Player ' , localGame.players.indexOf(this) , 'is the winner');
		}
	}
};


//Hand object takes in array of Cards, or a single card
//and sorts, and gets value of Hand.  Called when playing a Hand or creating Player
var Hand = function(cards) {
	"use strict";
	if (cards instanceof Object && cards.cards === undefined && cards.val !== undefined && cards.length === undefined) {
		// console.log('Hand constructor, single Card');
		// console.log(cards);
		var a = [];
		a.push(cards);
		cards = a;
		return this;
	}
	// called when initialized, or when no rule
	if (cards === null) {
		// console.log('Null Hand');
		return null;
	}
	if ((cards instanceof Array) === true) {
		//cards is an Array of Card objects
		var arr = cards;
		var newCards = [];

		for (var i=0; i<arr.length; i++) {
			newCards.push(new Card(arr[i]));
		}
		this.cards = newCards;
		this.sortedCards = this.cards.sortCards();
		this.getValue();
	} else {
		// console.log('Hand copy constructor');
		var oldHand = cards;
		if (oldHand.cards) {
			var newCards = [];
			for (var j=0; j<oldHand.cards.length; j++) {
				newCards.push(new Card(oldHand.cards[j]));
			}
			this.cards = newCards;
			this.sortedCards = this.cards.sortCards();
			this.val = oldHand.val;
		} else {
			console.log("Empty Hand");
			return this;
		}

	}
};

Hand.prototype = {
	//Returns index of the Card if in Hand, else -1
	//goes thru hand to find a card that matches input card value
	findCard: function(cardToFind) {
		for (var i=0; i<this.cards.length; i++) {
			var currentCard = this.cards[i];
			if (i !== this.cards.length-1) {
				if (currentCard.val === cardToFind.val) {
					return i;
				}
			} else {
				//Last card
				var foundCard = (currentCard.val === cardToFind.val) ? i : -1;
				return foundCard;
			}
		}
	},


	isValid: function() {
		return (this.val.type !== "invalid");
	},

	//Returns type for a Hand, (Single, Double, Straight 3, Straight 4) or nothing if not valid.
	//Checks length, and then checks if all cards have the same number.
	//If not all tnumber are the same, check if they increase by one.
	getType: function() {
		var sortedCards = this.sortedCards;
		if (sortedCards.length === 1) {
			return "Single";
		} else {
			for (var i=0; i<sortedCards.length; i++) {
				var currentCard = sortedCards[i];
				//Get nextCard if not at the end
				if (i !== sortedCards.length-1) {
					var nextCard = sortedCards[i+1];
				}

				if (sortedCards.length === 2) {
					var isDouble = (currentCard.num === nextCard.num) ? "Doubles" : undefined;
					return isDouble;
				} else if (sortedCards.length > 2) {
					var numToMatch = currentCard.num;
					if (i===0) {
						//check for triples or 4 of a kind
						var allCardsMatch = sortedCards.every(function(card) {
							return (card.num === numToMatch);
						});

						if (allCardsMatch) {
							if (sortedCards.length === 3) {
								return "Triples";
							} else if (sortedCards.length === 4) {
								return "Bomb";
							}
						}
					} else if (i !== sortedCards.length-1) {
						//return before reaching end if next card wasn't one more than prev
						numToMatch = currentCard.num+1;
						if (nextCard.num !== numToMatch) {
							return;
						}
					} else if (i === sortedCards.length-1) {
						//Finally reached end, is a Straight
						return "Straight " + sortedCards.length;
					}
				}
			}
		}
	},

	//If Hand is Valid, gets Value, by getting Type and highest Card
	getValue: function() {
		var cards = this.sortedCards;
		var handVal = this.val = {};
		//if hand is valid then return
		if (this.getType()) {
			handVal.type = this.getType();
			handVal.highest = cards[cards.length-1];
			return handVal;
		} else {
			handVal.type = "invalid";
		}
	},

	//If a Hand beats another Hand, returns true.
	//Checks if both Hands are valid and same Type.
	//then compares values of both cards.
	beats: function(b) {
		if (this.isValid() && b.isValid()) {

			if (this.val.type === b.val.type) {
				var thisCard = this.val.highest;
				var otherCard = b.val.highest;

				var value = thisCard.compareTo(otherCard);
				return (value === 1);
			}
		}
	},

	//Checks if Hand follows current rule.
	followsRule: function() {
		var cr = localGame.currentRule;
		console.log('Hand.followsRule ' + cr);

		if (cr !== "Start" && cr !== "None") {
			return (this.val.type === localGame.currentRule);
		} else {
			if (cr === "Start") {
				var containsThreeOfSpades = (this.findCard(threeOfSpades) !== -1);
				if (!containsThreeOfSpades) {
					alert("Must have 3 of Spades in Starting Hand");
				}
				return this.isValid() && containsThreeOfSpades;
			
			} else if (cr === "None") {
				return this.isValid();
			}
		}
	},

	createHTML: function() {
		cards = this.sortedCards;
		if (cards) {
			var cardHTML = "";

			for (var i=0; i<cards.length; i++) {
				var currentCard = cards[i];

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
			return cardHTML;
		} else {
			console.log(this);
			return "";
		}
	}
};

var Game = function(oldGame) {

	//Copy Constructor for Game
	"use strict";
	this.deck = oldGame.deck;

	var newPlayerArray = [];

	for (var i=0; i<oldGame.players.length; i++) {
		var newPlayer = new Player(oldGame.players[i]);
		
		if (i !== thisPlayerIndex) {
			newPlayer.cardsLeft = newPlayer.hand.cards.length;
			newPlayer.hand = undefined;
		}
		newPlayerArray.push(newPlayer);
	}
	this.players = newPlayerArray;


	this.currentRule = oldGame.currentRule;
	this.leader = oldGame.leader;
	this.currentPlayer = oldGame.currentPlayer;

	this.lastPlayedHand = new Hand(oldGame.lastPlayedHand);

	this.turnData = oldGame.turnData;
};

Game.prototype = {

	createDeck: function() {
		this.deck = [];
		for (var i=0; i<13; i++) {
			for (var j=0; j<4; j++) {
				this.deck.push(new Card(i, j));
			}
		}
	},

	createPlayers: function() {
		this.players = [];
		for (var i=0; i<4; i++) {
			var newPlayer = new Player();
			this.players.push(newPlayer);
		}
	},

	dealCards: function() {

		//JS .length in for loop is dynamic
		for (var i=0; i<52; i++) {

			var cardToDeal = Math.floor(Math.random() * this.deck.length);
			cardToDeal = this.deck.splice(cardToDeal,1)[0];	

			var currentPlayer = i % 4;
			currentPlayer = this.players[currentPlayer];

			currentPlayer.hand.push(cardToDeal);

			if (Math.floor(i/4) === 12) {
				currentPlayer.hand = new Hand(currentPlayer.hand);
			}
		}
	},

	initialize: function() {
		this.createDeck();
		this.createPlayers();
		this.dealCards();
	},

	findStartingPlayer: function() {

		for (var i=0; i< this.players.length; i++) {
			var currentPlayer = this.players[i];

			for (var j=0; j<currentPlayer.hand.cards.length; j++) {
				var currentCard = currentPlayer.hand.cards[j];

				if (currentCard.val === threeOfSpades.val) {
					var playerNumber = (i+1);
					$('#currentPlayersTurn').html(playerNumber);
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
	},

	findPlayerIndex: function(player) {
		for (var i=0; i<this.players.length; i++) {
			if (this.players[i].id === player.id) {
				return i;
			}
		}
	},

	displayCards: function() {

		for (var i=0; i<this.players.length ; i++) {

			var currentPlayer = this.players[i];
			var selector = "#player" + (i+1) + " div.hand";
		
			var currentPlayersHand = currentPlayer.hand;
			if (currentPlayersHand) {
				var cardHTML = currentPlayersHand.createHTML();


				$(selector).append(cardHTML);
			} else {
				console.log('nohand');
				var noCardsHTML = "";
				for (var j=0; j<currentPlayer.cardsLeft; j++) {
					noCardsHTML += "<div class='card cardBack'></div>";
				}

				$(selector).append(noCardsHTML);
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
		console.log(this.turnData);
		if (this.turnData.indexOf(0) === -1) {
			var leader = this.turnData.indexOf("Leader");
			this.turnData = [0,0,0,0];
			this.turnData[leader] = "Start";
			alert("checkTurn New Turn.  Player " + (leader+1) + " starts");
			this.currentRule = "None";
			this.lastPlayedHand = null;
			$('#currentRule').html("None");
			$('#lastPlayed').html("");
		}
	}
};
