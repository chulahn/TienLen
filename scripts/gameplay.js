var socket = io.connect('http://localhost:3000');

var thisPlayerIndex;
var thisPlayer;
var lastPlayedHand;
var currentRule;
var currentPlayer;
var localGame;
var leader;

socket.on('connect' , function() {
	console.log(socket.id)

	socket.on('setUpPlayer', function(data) {
		console.log('settingup player')
		localGame = new Game(data.updatedGame);
		thisPlayerIndex = data.playerData;
		thisPlayer = localGame.players[data.playerData];
		console.log('------before last played')
		console.log(localGame.lastPlayedHand)
		lastPlayedHand = new Hand(localGame.lastPlayedHand);
		console.log('after last played-----')
		currentRule = localGame.currentRule;
		lastPlayedHand = localGame.lastPlayedHand;
		console.log('xxxxxxxxxfinished setting up')

		// $('.activePlayer').removeClass('activePlayer');

		$('#playerInfo').html(thisPlayerIndex.toDivNum())
		$('.card').remove();
		localGame.displayCards();
		$('.card').addClass('other');
		$('#player' + (thisPlayerIndex.toDivNum()) +' .card').removeClass('other');


		displayTurnData();
	});

	socket.on('reconnectGame', function(data) {

		localGame = new Game(data.updatedGame);
		thisPlayerIndex = data.playerData;
		thisPlayer = localGame.players[data.playerData];
		lastPlayedHand = new Hand(localGame.lastPlayedHand);
		currentRule = localGame.currentRule;
		lastPlayedHand = localGame.lastPlayedHand;
		currentPlayer = localGame.currentPlayer;
		leader = localGame.leader;


		//div #
		var currentPlayerDiv = currentPlayer.toDivNum();
		var leaderDiv = leader.toDivNum();


		$('.card').remove();
		$('.activePlayer').removeClass();
		$('#lastPlayed').html(lastPlayedHand.createHTML());
		if (lastPlayedHand.cards) {
			$('#lastPlayed').append("by Player " + leaderDiv);
		}
		localGame.displayCards();
		$('.card').addClass('other');
		$('#player' + (thisPlayerIndex + 1) + ' .card').removeClass('other');
		$('#player' + currentPlayerDiv).addClass('activePlayer player');
		$('#currentPlayersTurn').html(currentPlayerDiv);
		$("#currentRule").html(currentRule);
		displayTurnData();
	});

	socket.on('foundStartingPlayer', function(playerNum) {
		console.log('player ' + playerNum + ' starts');
		$('#currentPlayersTurn').html(playerNum);
		$("#player" + playerNum).addClass("activePlayer");		
	});

	socket.on('displayCards', function(data) {
		// console.log('displaying cards');
		//show all cards
		$('.card').remove();
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

	//passed html to server to be shown on the other clients
	socket.on('displayNewRule', function(d) {

		$("#lastPlayed").html(d.lastPlayed);
		$("#currentRule").html(d.currentRule);
		highlightNextPlayer();

	});

	socket.on('playedCards', function(d) {
		console.log('a player played cards')

		var i = localGame.findPlayerIndex(d.updatedPlayer);
		localGame.players[i] = new Player(d.updatedPlayer);



		//NEED TO update players
		localGame.lastPlayedHand = new Hand(d.cg.lastPlayedHand);
		localGame.leader = d.cg.leader;
		localGame.currentPlayer = d.cg.currentPlayer;
		localGame.turnData = d.cg.turnData;
		localGame.currentRule = d.cg.currentRule;

		for (var j=0; j<localGame.lastPlayedHand.cards.length; j++) {
			$('#player'+(i+1)+'>div')[0].remove();
		}

		displayTurnData();

	});

	socket.on('skipTurn', function(d) {
		highlightNextPlayer();
		localGame.turnData = d.cg.turnData;
		localGame.currentPlayer = d.cg.currentPlayer;

		$('#currentPlayersTurn').html(localGame.currentPlayer.toDivNum())
		if (d.newTurn) {
			var leader = this.turnData.indexOf("Start");
			alert("New Turn.  Player " + (leader+1) + " starts");
			$('#currentRule').html("None");
			$('#lastPlayed').html("");
		}

		displayTurnData();

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
	console.log(clickedCard);
	console.log(clickedCard.parent())
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

	var cardsToPlay = new Hand(thisPlayer.selectedCards);
	console.log(cardsToPlay)
	
	socket.emit('getGameData');

	socket.on('receiveGameData', function(data) {
		console.log('received gamedata')
		localGame = new Game(data);
		thisPlayer = localGame.players[thisPlayerIndex];
		// thisPlayer.selectedCards = cardsToPlay;


		//for first move
		if (localGame.lastPlayedHand.val == undefined) {
			console.log('lastplayedhand was null')
			var fakeHand = new Hand(thisPlayer.selectedCards);
			fakeHand.val.highest = new Card(-1,-1);
			console.log(fakeHand)
			console.log(cardsToPlay)
			console.log(fakeHand == cardsToPlay)
			localGame.lastPlayedHand = lastPlayedHand = fakeHand;
		}
		else {
			lastPlayedHand = localGame.lastPlayedHand;
			console.log(localGame.lastPlayedHand);
		}

		if (cardsToPlay.followsRule() && cardsToPlay.beats(lastPlayedHand)) {
			console.log('follows rule and beats lastplayed')
			
			//get the Cards that are going to be played, and create the HTML to display cards in lastPlayed Div
			var cardsToRemove = selectedPlayer.find('.selected');
			var lastPlayedHTML = "";
			cardsToRemove.each(function() {
				lastPlayedHTML += $(this)[0].outerHTML;
			});
			lastPlayedHTML = lastPlayedHTML.replace(new RegExp("selected" , "g"), "");
			lastPlayedHTML += "by Player " + (playerIndex + 1);
			$("#lastPlayed").html(lastPlayedHTML);

			//Show Current Rule based on played cards.
			localGame.currentRule = cardsToPlay.getType();
			$("#currentRule").html(localGame.currentRule);
			highlightNextPlayer();

			//remove cards from player's Hand object(and servers) and player's div
			thisPlayer.playCards();
			console.log('successfully removed.  ', thisPlayer.hand.cards.length , ' cards left');
			cardsToRemove.remove();
			//NEED TO remove cards in other players screen
			displayTurnData();

			

			//Display changes to the other clients 
			socket.emit('displayNewRule', {lastPlayed:lastPlayedHTML, currentRule: localGame.currentRule})
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

	localGame.currentPlayer = localGame.currentPlayer.nextIndex();
	localGame.setTurnData("Pass", playerIndex);

	socket.emit('skipTurn', localGame);

	highlightNextPlayer();

	localGame.checkTurnData();
	displayTurnData();
	

});

function highlightNextPlayer() {
	var currentPlayer = $('.activePlayer').attr('id');
	currentPlayer = parseInt(currentPlayer.getLastChar());

	var nextPlayer;
	(currentPlayer !== 4) ? nextPlayer = currentPlayer + 1 : nextPlayer = 1; 

	$('.activePlayer').removeClass('activePlayer');

	$('#player' + nextPlayer).addClass('activePlayer');
	$('#currentPlayersTurn').html(nextPlayer);

}

function displayTurnData() {
	var turn = localGame.turnData;

	var dispHTML = "<div id='turnTable'>";
	var player = "<ul><li class='index'>Player";
	var status = "<ul><li class='index'>Status";

	for (var i=0; i<turn.length; i++) {

		var li = "";
		(i === thisPlayerIndex) ? li = "<li class='you'>" : li = "<li>";

		player += li + (i+1);
		status += li + turn[i];
	}

	player += "</ul>";
	status += "</ul>";

	dispHTML += player + status + "</div>";

	$('#turnData').html(dispHTML);

	var cpDiv = localGame.currentPlayer.toDivNum(); 
	$('#currentPlayersTurn').html(cpDiv);
	$("#player" + cpDiv).addClass("activePlayer");	
}