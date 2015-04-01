var numValues = [3,4,5,6,7,8,9,10,"J","Q","K","A",2];
var suitValues = ["Spade", "Clover", "Diamond", "Heart"];

var Card = function (a, b) {
	"use strict";
	if (b === undefined) {
		var divide = a.indexOf(":");

		var thisSuit = a.slice(divide+1);
		var thisNum = a.slice(0,divide);
		if (!isNaN(parseInt(thisNum))) {
			thisNum = parseInt(thisNum);
		}

		this.num = numValues.indexOf(thisNum);
		this.suit = suitValues.indexOf(thisSuit);
		this.val = a;
	} else {
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
	
module.exports = Card;