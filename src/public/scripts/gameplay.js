var socket = io.connect('http://localhost:3000');
var thisPlayerIndex;
var thisPlayer;
var localGame;

$(document).ready(function() {
	"use strict";
});

//update player's selected hand
$(document).on('click', '.card', function() {
	"use strict";

	var $clickedCard = $(this);
	var $selectedPlayer = $clickedCard.closest('.player');
	var playerNum = $selectedPlayer.attr('id').getLastChar() - 1;

	if (playerNum !== thisPlayerIndex) { return ; }
	//highlight DOM obj
	$clickedCard.toggleClass('selected');
	console.log('clicked on card ', $clickedCard.attr('alt'));

	//create Card object of clickedCard and add/remove from player's selectedCards
	var selectedCards = thisPlayer.selectedCards;
	var clickedCard = new Card($clickedCard.attr('alt'));
	selectedCards.addRemoveCard(clickedCard);

	//get playerNum so server knows which player to update
	

	socket.emit('clickedCard', {selectedCards: selectedCards , playerNum : playerNum});
});

$(document).on('click', '.btn', function() {



});

$(document).on('click', '.btn.playCards', function() {
	"use strict";

	if (!isPlayersButton($(this))) { return alert(' not your button'); }
	if (localGame.currentPlayer !== thisPlayerIndex) { return alert('not your turn'); }

	console.log('playCard');

	//gets latest gameData from server to make sure user didn't change anything.
	//server emits receiveGameData with gameData, and the player attempts to playCard.
	socket.emit('getGameData', "play");

});

$(document).on('click', '.btn.skipTurn', function() {
	"use strict";

	if (!isPlayersButton($(this))) { return alert(' not your button'); }
	if (localGame.currentPlayer !== thisPlayerIndex) { return alert('not your turn'); }
	if (localGame.currentRule === "None" || localGame.currentRule === "Start") { return alert('must Play a card'); }


	localGame.updateTurnData("Pass", thisPlayerIndex);
	localGame.setNextPlayer();
	socket.emit('skipTurn', localGame);
	localGame.checkTurnData();


	displayGameData();
});

function isPlayersButton($clickedButton) {

	var $buttonsPlayer  = $clickedButton.closest('.player');
	var playerNum = $buttonsPlayer.attr('id').getLastChar() - 1;
	return (playerNum === thisPlayerIndex);

}

function displayGameData() {

	$('#thisPlayer').html(thisPlayerIndex.toDivNum());
	$("#currentRule").html(localGame.currentRule);

	displayTurnData();
	displayLastPlayedHand();
	highlightCurrentPlayer();
		
	function displayTurnData() {
		//Turn Information in table format
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

		//Current Player's Turn in text
		var cpDiv = localGame.currentPlayer.toDivNum(); 
		(cpDiv === thisPlayerIndex.toDivNum()) ? cpDiv = "Your" : cpDiv = "Player " + cpDiv + "'s";
		$('#currentPlayersTurn').html(cpDiv);
	}
	
	function displayLastPlayedHand() {
		if (localGame.lastPlayedHand && localGame.lastPlayedHand.cards) {
			var leaderDiv = localGame.leader.toDivNum();
			$('#lastPlayed').html(localGame.lastPlayedHand.createHTML());
			$('#lastPlayed').append("by Player " + leaderDiv);
		} else {
			$('#lastPlayed').html("");
		}
	}

	function highlightCurrentPlayer() {
		$('.activePlayer').removeClass('activePlayer');
		$("#player" + localGame.currentPlayer.toDivNum()).addClass("activePlayer");		
	}

}

//hides other players buttons
function hideOtherPlayer() {
	var a = thisPlayerIndex.toDivNum();
	$('.btn').show();

	$('.player').each(function() {
		var curr = $(this);
		var playerNum = curr.attr('id').getLastChar();
		if (a != playerNum) {
			curr.find('.btn').hide();
		}
	});

}