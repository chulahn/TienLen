String.prototype.getLastChar = function() {
	return this.slice(this.length-1);
}

Array.prototype.addRemoveCard = function(clickedCard) {

	var thisArray = this;

	if (thisArray.length === 0) {
		thisArray.push(clickedCard);
		return;
	}

	var validHandArray = thisArray.every(function(element) {
		return (typeof element === "object") && element.hasOwnProperty("num") && element.hasOwnProperty("suit") && (thisArray.length > 0)
	});

	if (validHandArray) {
		for (var i=0; i<thisArray.length; i++) {
			var currentCard = thisArray[i];
			//if already in, remove
			if (typeof currentCard === "object" && currentCard.val === clickedCard.val) {
				thisArray.splice(i,1);
				break;
			}

			//if reached the end, and it wasnt already removed, add
			if (i === thisArray.length-1) {
				thisArray.push(clickedCard);
				break;
			}
		}
	}

	else {
		alert("every element in array is not a Card or length=0")
	}
}

var socket = io.connect('http://localhost');



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

	socket.emit('clickedCard', {data: clickedCard.attr('alt')});

	//get player
	var selectedPlayer = clickedCard.parent().attr('id');
	var playerNum = selectedPlayer.getLastChar() - 1;
	selectedPlayer = currentGame.players[playerNum];

	//see if clicked card is already selected.
	//Then add/remove
	var selectedCards = selectedPlayer.selectedCards;
	clickedCard = new Card(clickedCard.attr('alt'));
	selectedCards.addRemoveCard(clickedCard);



});

$(document).on('click', '.btn.playCards', function() {

	"use strict";
	var cg = currentGame;

	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.getLastChar() - 1;

	var thisPlayerObj = cg.players[playerIndex];
	var selectedCards = new Hand(thisPlayerObj.selectedCards);

	//for first move
	if (cg.lastPlayedHand === null) {
		var fakeHand = new Hand(thisPlayerObj.selectedCards);
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


		cg.setTurnData("Leader" , playerIndex);

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
	playerIndex = playerIndex.slice(playerIndex.length-1) - 1;

	currentGame.setTurnData("Pass", playerIndex);
	highlightNextPlayer();
	currentGame.checkTurnData();
	

});

function highlightNextPlayer() {
	var currentPlayer = $('.activePlayer').attr('id');
	currentPlayer = parseInt(currentPlayer.getLastChar());

	var nextPlayer;
	(currentPlayer !== 4) ? nextPlayer = currentPlayer + 1 : nextPlayer = 1; 

	$('.activePlayer').removeClass('activePlayer');

	$('#player' + nextPlayer).addClass('activePlayer');
	$('#currentPlayersTurn').html('Player ' + nextPlayer);

}
