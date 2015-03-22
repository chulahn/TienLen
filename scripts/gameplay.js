var socket = io.connect('http://localhost:3000');

var thisPlayer;
var lastPlayedHand;
var currentRule;
var localGame;

socket.on('connect' , function() {
	console.log(socket.id)

	socket.on('setUpPlayer', function(data) {
		console.log('settingup player')
		thisPlayer = new Player(data.playerData);
		localGame = new Game(data.updatedGame);
		lastPlayedHand = localGame.lastPlayedHand;
		currentRule = localGame.currentRule;
	});

	socket.on('foundStartingPlayer', function(playerNum) {
		console.log('player ' + playerNum + ' starts');
		$('#currentPlayersTurn').html("Player " + playerNum);
		$("#player" + playerNum).addClass("activePlayer");		
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
		localGame.lastPlayedHand = new Hand(data);  
		console.log('got last played hand ' + new Hand(data));
	});

	socket.on('displayLastPlayed', function(html) {
		console.log('socket on displaylastplayed');
		$("#lastPlayed").html(html);
	});

	socket.on('displayCurrentRule', function(html) {
		console.log('on displaycurrentrule');
		$("#currentRule").html(html);
	});

	socket.on('playedCards', function(cg) {
		console.log('a player played cards')
		highlightNextPlayer();

		//NEED TO update players
		localGame.lastPlayedHand = new Hand(cg.lastPlayedHand);
		localGame.leader = cg.leader;
		localGame.currentPlayer = cg.currentPlayer;
		localGame.turnData = cg.turnData;
	});

});

$(document).ready(function() {
	"use strict";
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

	console.log('playCard');
	var selectedPlayer = $(this).closest('.player');
	var playerIndex = selectedPlayer.attr('id');
	playerIndex = playerIndex.getLastChar() - 1;

	// var thisPlayerObj = cg.players[playerIndex];
	// var selectedCards = new Hand(thisPlayerObj.selectedCards);

	var selectedCards = new Hand(thisPlayer.selectedCards);

	socket.emit('getGameData');

	socket.on('receiveGameData', function(data) {
		console.log('received gamedata')
		localGame = new Game(data);

		//for first move
		if (localGame.lastPlayedHand.val == undefined) {
			console.log('lastplayedhand was null')
			var fakeHand = new Hand(thisPlayer.selectedCards);
			fakeHand.val.highest = new Card(-1,-1);
			localGame.lastPlayedHand = lastPlayedHand = fakeHand;
		}
		else {
			console.log(localGame.lastPlayedHand);
		}

		if (selectedCards.followsRule() && selectedCards.beats(lastPlayedHand)) {
			console.log('follows rule amd beats lastplayed')
			
			//save cards that were played in global Game object, and display them in #lastPlayed

			//get the Cards that are going to be played, and create the HTML to display cards
			var cardsToRemove = selectedPlayer.find('.selected');
			var lastPlayedHTML = "";
			cardsToRemove.each(function() {
				lastPlayedHTML += $(this)[0].outerHTML;
			});
			lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");
			lastPlayedHTML += "by Player " + (playerIndex + 1);
			//update locally, update to other players
			$("#lastPlayed").html(lastPlayedHTML);
			console.log('emitting updateLastPlayedHTML');
			socket.emit('updateLastPlayedHTML', lastPlayedHTML);


			//remove cards from player's Hand object and player's div
			thisPlayer.playCards();
			console.log('successfully removed.  ', thisPlayer.hand.cards.length , ' cards left');
			cardsToRemove.remove();
			//NEED TO remove cards in other players screen

			//Show Current Rule, highlight next Player, change currentPlayer Text
			localGame.currentRule = selectedCards.getType();
			$("#currentRule").html(localGame.currentRule);
			socket.emit('updateCurrentRuleHTML', localGame.currentRule);

			//update everyones TurnData
			// cg.setTurnData("Leader" , playerIndex);

			//NEED TO highlightNextPlayer for other players
			highlightNextPlayer();
		}

		else {
			console.log('cannot play these cards');
		}	
	});
});

$(document).on('click', '.btn.skipTurn', function() {
	"use strict";

	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.slice(playerIndex.length-1) - 1;

	localGame.setTurnData("Pass", playerIndex);
	highlightNextPlayer();
	localGame.checkTurnData();
	

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
