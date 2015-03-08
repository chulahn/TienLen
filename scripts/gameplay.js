String.prototype.getLastChar = function() {
	return this.slice(this.length-1);
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
	var playerNum = selectedPlayer.getLastChar();
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
	var cg = currentGame;

	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.getLastChar();
	playerIndex = parseInt(playerIndex) - 1;

	var thisPlayerObj = cg.players[playerIndex];
	var selectedCards = new Hand(thisPlayerObj.selectedCards);
	console.log(thisPlayerObj)

	if (cg.lastPlayedHand === null) {
		var fakeHand = new Hand(thisPlayerObj.selectedCards);
		var fakeArray = [];
		fakeHand.val.highest = new Card(-1,-1);
		cg.lastPlayedHand = fakeHand;
	}

	var lastPlayedHand = (cg.lastPlayedHand || fakeHand);

	if (selectedCards.followsRule() && selectedCards.beats(lastPlayedHand)) {

		//save cards that were played in global Game object, and display them in #lastPlayed
		var cardsToRemove = thisPlayer.find('.selected');
		var lastPlayedHTML = "";
		cardsToRemove.each(function() {
			lastPlayedHTML += $(this)[0].outerHTML;
		});
		lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");
		lastPlayedHTML += "by Player " + (playerIndex + 1);
		$("#lastPlayed").html(lastPlayedHTML);


		//remove cards from player's Hand object and player's div
		thisPlayerObj.playCards();
		console.log('successfully removed.  ', thisPlayerObj.hand.cards.length , ' cards left');
		cardsToRemove.remove();

		//Show Current Rule, highlight next Player, change currentPlayer Text
		cg.currentRule = selectedCards.getType();
		$("#currentRule").html(cg.currentRule);

		highlightNextPlayer();
	}

	else {
		console.log('cannot play these cards');
	}
});

$(document).on('click', '.btn.skipTurn', function() {
	"use strict";

	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.slice(playerIndex.length-1);
	playerIndex -= 1;

	currentGame.turnData[playerIndex] = "P";
	currentGame.playerIndex += 1;

	

});

function highlightNextPlayer() {
	var currentPlayer = $('.activePlayer').attr('id');
	currentPlayer = parseInt(currentPlayer.getLastChar());

	var nextPlayer;
	(currentPlayer !== 4) ? nextPlayer = currentPlayer + 1 : nextPlayer = 1; 

	$('.activePlayer').removeClass('activePlayer');

	$('#player' + nextPlayer).addClass('activePlayer');

}