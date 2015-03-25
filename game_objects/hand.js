var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];

var Card = require('./card.js');
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

Hand.prototype.createHTML = function() {
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
	}
	else {
		return "Nothing";
	}
}

module.exports = Hand