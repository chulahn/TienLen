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

	//create Card object of clickedCard and add/remove from player's selectedCards
	var selectedCards = thisPlayer.selectedCards;
	var clickedCardObj = new Card(clickedCard.attr('alt'));
	selectedCards.addRemoveCard(clickedCardObj);

	//get playerNum so server knows which player to update
	var selectedPlayer = clickedCard.closest('.player');
	var playerNum = selectedPlayer.attr('id').getLastChar() - 1;

	socket.emit('clickedCard', {selectedCards: selectedCards , playerNum : playerNum});
});

$(document).on('click', '.btn.playCards', function() {

	"use strict";

	console.log('playCard');
	var selectedPlayer = $(this).closest('.player');
	var playerIndex = selectedPlayer.attr('id').getLastChar() - 1;


	socket.emit('getGameData');

	socket.on('receiveGameData', function(data) {
		console.log('received gamedata');
		localGame = new Game(data);
		thisPlayer = localGame.players[thisPlayerIndex];
		cardsToPlay = new Hand(thisPlayer.selectedCards);
		function setLastPlayed() {

			//If first move of a turn
			//Create a fakeHand that has same type but a lower value
			if (localGame.lastPlayedHand.val === undefined) {
				console.log('No lastPlayedHand.val');
				var fakeHand = new Hand(thisPlayer.selectedCards);
				fakeHand.val.highest = new Card(-1,-1);
				localGame.lastPlayedHand = fakeHand;
			} else {
				localGame.lastPlayedHand;
				// console.log(localGame.lastPlayedHand);
			}
		}
		setLastPlayed();


		function displayError() {

			var errorMessage = "";

			if ( thisPlayerIndex !== localGame.currentPlayer ) {
				errorMessage += "Not your turn\n";
			}

			if ( !(cardsToPlay.followsRule()) ) {
				errorMessage += "Hand does not follow rule " + localGame.currentRule + "\n";
			}

			if ( !(cardsToPlay.beats(localGame.lastPlayedHand)) ) {
				errorMessage += "Hand does not beat last played Hand\n";
				errorMessage += localGame.lastPlayedHand.val.type;
				console.log(cardsToPlay);
				console.log(localGame.lastPlayedHand);
			}
			alert(errorMessage);
		}
		
		var isPlayersTurn = (thisPlayerIndex === localGame.currentPlayer);

		if (isPlayersTurn && cardsToPlay.followsRule() && cardsToPlay.beats(localGame.lastPlayedHand)) {
			console.log('Gameplay:follows rule and beats lastplayed');
			

			var cardsToRemove = selectedPlayer.find('.selected');
			cardsToRemove.remove();

			//updates localGame and thisPlayer and then pushes changes to server to push to other players
			thisPlayer.playCards();


			displayGameData();
		} else {
			displayError();
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
	(cpDiv === thisPlayerIndex.toDivNum()) ? cpDiv = "Your" : cpDiv = "Player " + cpDiv + "'s";
	$('#currentPlayersTurn').html(cpDiv);


	//display lastPlayedHand
	if (localGame.lastPlayedHand && localGame.lastPlayedHand.cards) {
		var leaderDiv = localGame.leader.toDivNum();
		$('#lastPlayed').html(localGame.lastPlayedHand.createHTML());
		$('#lastPlayed').append("by Player " + leaderDiv);
	} else {
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

		if (a != playerNum) {
			curr.find('.btn').hide();
			curr.find('.card').addClass('other');
		}
	});

}