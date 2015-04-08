var server = require('../app.js');

var Player = function(obj) {
	"use strict";
	this.id = obj.id;
	this.num = obj.num;
	this.hand = [];
	this.selectedCards = [];
};

//not used
//Removes selected cards from Players hand and plays them.
//sets currentGame.Leader to this Player if true.
//sets currentGame.lastHand to played hand if true.
Player.prototype.playCards = function() {
	"use strict";
	var playersHand = this.hand;
	var cardsToPlay = new Hand(this.selectedCards);
	var cg = server.currentGame;

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
		console.log('beats rule');
		cardsToPlay.cards.forEach(function (cardToRemove) {
			var cardLocation = playersHand.findCard(cardToRemove);

			if (cardLocation !== -1) {
				playersHand.cards.splice(cardLocation,1);
			} else {
				console.log('couldnt find ',cardToRemove.val);
			}
		});

		this.selectedCards = [];
		playersHand.sortedCards = playersHand.cards.sortCards();


		//update sorted cards
		cg.lastPlayedHand = cardsToPlay;
		if (playersHand.cards.length === 0) {
			//call game over function.  player 1
			alert('Player ' , cg.players.indexOf(this) , 'is the winner');
		}

		//set currentPlayer and leader indexes
		var l = cg.leader = cg.players.indexOf(this);
		(l !== 3) ? cg.currentPlayer = l + 1 : cg.currentPlayer = 0;
		cg.turnData = ['-','-','-','-'];
		cg.turnData[l] = "L";
	}
};


Player.prototype.finished = function() {
	return (this.hand.cards.length === 0);
};

module.exports = Player;