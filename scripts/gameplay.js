var socket = io.connect('http://localhost:3000');

var thisPlayerIndex;
var thisPlayer;
var lastPlayedHand;
var currentRule;
var currentPlayer;
var localGame;
var leader;

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
	console.log(clickedCard);
	var selectedPlayer = clickedCard.parent().parent().attr('id');
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

	var cardsToPlay = new Hand(thisPlayer.selectedCards);
	console.log(cardsToPlay);
	
	socket.emit('getGameData');

	socket.on('receiveGameData', function(data) {
		console.log('received gamedata');
		localGame = new Game(data);
		thisPlayer = localGame.players[thisPlayerIndex];
		// thisPlayer.selectedCards = cardsToPlay;


		//for first move
		if (localGame.lastPlayedHand.val == undefined) {
			console.log('lastplayedhand was null');
			var fakeHand = new Hand(thisPlayer.selectedCards);
			fakeHand.val.highest = new Card(-1,-1);
			console.log(fakeHand);
			console.log(cardsToPlay);
			console.log(fakeHand == cardsToPlay);
			localGame.lastPlayedHand = lastPlayedHand = fakeHand;
		} else {
			lastPlayedHand = localGame.lastPlayedHand;
			console.log(localGame.lastPlayedHand);
		}

		if (cardsToPlay.followsRule() && cardsToPlay.beats(lastPlayedHand)) {
			console.log('follows rule and beats lastplayed');
			
			//get the Cards that are going to be played, and create the HTML to display cards in lastPlayed Div
			var cardsToRemove = selectedPlayer.find('.selected');


			var lastPlayedHTML = cardsToPlay.createHTML();
			lastPlayedHTML += "by Player " + (playerIndex + 1);
			$("#lastPlayed").html(lastPlayedHTML);

			//Show Current Rule based on played cards.
			localGame.currentRule = cardsToPlay.getType();
			$("#currentRule").html(localGame.currentRule);

			//remove cards from player's Hand object(and servers) and player's div
			thisPlayer.playCards();
			console.log('successfully removed.  ', thisPlayer.hand.cards.length , ' cards left');
			cardsToRemove.remove();
			//NEED TO remove cards in other players screen
			displayGameData();

			

			//Display changes to the other clients 
			socket.emit('displayNewRule', {lastPlayed:lastPlayedHTML, currentRule: localGame.currentRule});
		} else {
			console.log('cannot play these cards');
		}	
	});
});

$(document).on('click', '.btn.skipTurn', function() {
	"use strict";

	if (thisPlayerIndex === localGame.currentPlayer && (localGame.currentRule === "None" || localGame.currentRule === "Start")) {
		alert('must Play a card');
		return;
	}


	var thisPlayer = $(this).closest('.player');
	var playerIndex = thisPlayer.attr('id');
	playerIndex = playerIndex.slice(playerIndex.length-1) - 1;
	localGame.currentPlayer = localGame.currentPlayer.nextIndex();
	localGame.setTurnData("Pass", playerIndex);

	socket.emit('skipTurn', localGame);
	localGame.checkTurnData();


	displayGameData();
});

function displayGameData() {
	//displays turnTable
	var turn = localGame.turnData;
	var dispHTML = "<div id='turnTable'>";
	var player = "<ul><li class='index'>Player";
	var status = "<ul><li class='index'>Status";

	for (var i=0; i<turn.length; i++) {
		var li = "<li class=' ";
		if (i === thisPlayerIndex) {
			li += "you ";
		}
		if (i === localGame.currentPlayer) {
			li += "currentPlayer ";
		}
		li += "'>";

		player += li + (i+1);
		status += li + turn[i];
	}

	player += "</ul>";
	status += "</ul>";

	dispHTML += player + status + "</div>";
	$('#turnData').html(dispHTML);

	//display currentRule
	$("#currentRule").html(localGame.currentRule);


	//display currentPlayer and thisPlayer's turn
	$('#playerInfo').html(thisPlayerIndex.toDivNum());
	var cpDiv = localGame.currentPlayer.toDivNum(); 
	// if (cpDiv === thisPlayerIndex.toDivNum()) {
	// 	cpDiv = "Your";
	// } else {
	// 	cpDiv = "Player " + cpDiv + "'s";
	// }
	(cpDiv === thisPlayerIndex.toDivNum()) ? cpDiv = "Your" : cpDiv = "Player " + cpDiv + "'s";
	$('#currentPlayersTurn').html(cpDiv);


	//display lastPlayedHand
	if (lastPlayedHand && lastPlayedHand.cards) {
		var leaderDiv = localGame.leader.toDivNum();
		$('#lastPlayed').html(localGame.lastPlayedHand.createHTML());
		$('#lastPlayed').append("by Player " + leaderDiv);
	} else{
		$('#lastPlayed').html("");
	}


	//highlightNextPlayer
	$('.activePlayer').removeClass('activePlayer');
	$("#player" + localGame.currentPlayer.toDivNum()).addClass("activePlayer");	
}

//hides other players buttons
function hideOtherPlayer() {
	var a = thisPlayerIndex.toDivNum();

	$('.player').each(function() {
		var curr = $(this);
		var playerNum = curr.attr('id').getLastChar();
		console.log(playerNum , a);

		if (a != playerNum) {
			curr.find('.btn').hide();
			curr.find('.card').addClass('other');
		}
	});

}