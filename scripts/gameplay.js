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

var socket = io.connect('http://localhost:3000');

var thisPlayer;
var lastPlayedHand;
var currentRule;
var cg;

socket.on('connect' , function() {
	console.log(socket.id)

	socket.on('setUpPlayer', function(data) {
		console.log('settingup player')
		console.log(data)
		thisPlayer = new Player(data.playerData);
		lastPlayedHand = data.lastPlayedHand;
	});

	socket.on('foundStartingPlayer', function(data) {
		console.log('player ' + data + ' starts');

		$('#currentPlayersTurn').html("Player " + data);
		$("#player" + data).addClass("activePlayer");		
	});

	socket.on('displayCards', function(data) {
		// console.log('displaying cards');
		//show all cards
		for (var i =0; i< data.cards.length; i++) {
			var curr = data.cards[i];
			$('' + curr.selecter).append(curr.html)
		}
		// console.log(data.playerNum)
		
		//hides other classes cards
		$('.card').addClass('other');
		$('#player' + (data.playerNum+1) +' .card').removeClass('other');
	});

	socket.on('receiveLastPlayedHand', function(data) {

		lastPlayedHand = data;  
		console.log('got last played hand ' + data)
	});
});

$(document).ready(function() {
	"use strict";
	currentGame = new Game();
	currentGame.initialize();
	// currentGame.displayCards();
	// currentGame.findStartingPlayer();

});

//update player's selected hand
$(document).on('click', '.card', function() {
	"use strict";
	//highlight DOM obj
	var clickedCard = $(this);
	clickedCard.toggleClass('selected');
	console.log('clicked on card ', clickedCard.attr('alt'));


	//get player
	var selectedPlayer = clickedCard.parent().attr('id');
	var playerNum = selectedPlayer.getLastChar() - 1;

	//see if clicked card is already selected.
	//Then add/remove
	var selectedCards = thisPlayer.selectedCards;
	clickedCard = new Card(clickedCard.attr('alt'));
	selectedCards.addRemoveCard(clickedCard);

	socket.emit('clickedCard', {selectedCards: selectedCards , playerNum : playerNum});
});

$(document).on('click', '.btn.playCards', function() {

	"use strict";

	console.log('playCard')
	var selectedPlayer = $(this).closest('.player');
	var playerIndex = selectedPlayer.attr('id');
	playerIndex = playerIndex.getLastChar() - 1;

	// var thisPlayerObj = cg.players[playerIndex];
	// var selectedCards = new Hand(thisPlayerObj.selectedCards);

	var selectedCards = new Hand(thisPlayer.selectedCards);
	console.log(0)

	socket.emit('getGameData');

	socket.on('receiveGameData', function(data) {
		console.log('received gamedata')
		cg = data;

		//for first move
		if (cg.lastPlayedHand === null) {
			var fakeHand = new Hand(thisPlayer.selectedCards);
			fakeHand.val.highest = new Card(-1,-1);
			lastPlayedHand = fakeHand;
		}

		var lastPlayedHand = (lastPlayedHand || fakeHand);
		cg.lastPlayedHand = lastPlayedHand;

		if (selectedCards.followsRule() && selectedCards.beats(lastPlayedHand)) {

			//save cards that were played in global Game object, and display them in #lastPlayed
			var cardsToRemove = selectedPlayer.find('.selected');
			var lastPlayedHTML = "";
			cardsToRemove.each(function() {
				lastPlayedHTML += $(this)[0].outerHTML;
			});
			lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");
			lastPlayedHTML += "by Player " + (playerIndex + 1);
			$("#lastPlayed").html(lastPlayedHTML);


			//remove cards from player's Hand object and player's div
			thisPlayer.playCards();
			console.log('successfully removed.  ', thisPlayer.hand.cards.length , ' cards left');
			cardsToRemove.remove();

			//Show Current Rule, highlight next Player, change currentPlayer Text
			cg.currentRule = selectedCards.getType();
			$("#currentRule").html(cg.currentRule);


			// cg.setTurnData("Leader" , playerIndex);

			highlightNextPlayer();
		}

		else {
			console.log('cannot play these cards');
		}
	
	});

	console.log(123);
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
