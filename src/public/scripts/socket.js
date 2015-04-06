socket.on('connect' , function() {
	console.log("Your socket.id is " + socket.id);

	socket.on('setUpPlayer', function(data) {
		console.log('settingup player');
		updateLocal(data);
		console.log('xxxxxxxxxfinished setting up');

		$('.card').remove();
		localGame.displayCards();

		hideOtherPlayer();
		displayGameData();
	});

	socket.on('reconnectGame', function(data) {
		updateLocal(data);
		$('#playerInfo').html(thisPlayerIndex.toDivNum());
		$('.btn').show();
		$('.card').remove();
		localGame.displayCards();

		hideOtherPlayer();
		displayGameData();
	});

	socket.on('playedCards', function(d) {

		var i = localGame.findPlayerIndex(d.updatedPlayer);
		localGame.players[i] = new Player(d.updatedPlayer);
		localGame.players[i].cardsLeft = localGame.players[i].hand.cards.length;
		localGame.players[i].hand = undefined;

		console.log('player ' + (i+1) + ' played cards');


		//NEED TO update players
		localGame.lastPlayedHand = new Hand(d.cg.lastPlayedHand);
		localGame.leader = d.cg.leader;
		localGame.currentPlayer = d.cg.currentPlayer;
		localGame.turnData = d.cg.turnData;
		localGame.currentRule = d.cg.currentRule;

		var cardsToRemove = localGame.lastPlayedHand.cards.length;

		for (var j=0; j<cardsToRemove; j++) {
			$('#player'+(i+1)+'>div.hand>div.card')[0].remove();
		}

		displayGameData();

	});

	socket.on('readyToPlayCards', function(data) {

		localGame = new Game(data);
		thisPlayer = localGame.players[thisPlayerIndex];
		var cardsToPlay = new Hand(thisPlayer.selectedCards);

		if (localGame.lastPlayedHand.val === undefined) { createFakeHand(); }

		function createFakeHand() {

			//If first move of a turn
			//Create a fakeHand that has same type but a lower value
			console.log('No lastPlayedHand.val');
			var fakeHand = new Hand(thisPlayer.selectedCards);
			fakeHand.val.highest = new Card(-1,-1);
			localGame.lastPlayedHand = fakeHand;
		}


		function displayError() {

			var errorMessage = "";

			if ( thisPlayerIndex !== localGame.currentPlayer ) {
				errorMessage += "Not your turn\n";
			}

			if ( !cardsToPlay.followsRule() ) {
				errorMessage += "Hand does not follow rule " + localGame.currentRule + "\n";
			}

			if ( !cardsToPlay.beats(localGame.lastPlayedHand) ) {
				errorMessage += "Hand does not beat last played Hand\n";
				}
			alert(errorMessage);
		}
		
		var isPlayersTurn = (thisPlayerIndex === localGame.currentPlayer);

		if (isPlayersTurn && cardsToPlay.followsRule() && cardsToPlay.beats(localGame.lastPlayedHand)) {
			console.log('Gameplay:follows rule and beats lastplayed');			

			var selectedPlayer = $('#player' + thisPlayerIndex.toDivNum());
			var cardsToRemove = selectedPlayer.find('.selected');
			cardsToRemove.remove();

			//updates localGame and thisPlayer and then pushes changes to server to push to other players
			thisPlayer.playCards();

			displayGameData();
		} else {
			displayError();
		}
		console.log('----------------finished playCard----------');

	});




});

socket.on('skipTurn', function(d) {
	localGame.turnData = d.cg.turnData;
	localGame.currentPlayer = d.cg.currentPlayer;
	localGame.currentRule = d.cg.currentRule;
	console.log(socket.id + ' skippedTurn');

	$('#currentPlayersTurn').html(localGame.currentPlayer.toDivNum());
	if (d.newTurn) {
		localGame.lastPlayedHand = lastPlayedHand = null;
		var leader = localGame.turnData.indexOf("Start");
		alert("onEmit skip New Turn.  Player " + (leader+1) + " starts.  This is Player " + thisPlayerIndex);
		$('#currentRule').html("None");
		$('#lastPlayed').html("");
	}
	displayGameData();

});

function updateLocal(newData) {
	thisPlayerIndex = newData.playerIndex;
	localGame = new Game(newData.updatedGame);
	thisPlayer = localGame.players[newData.playerIndex];
	lastPlayedHand = new Hand(localGame.lastPlayedHand);
	currentRule = localGame.currentRule;
	lastPlayedHand = localGame.lastPlayedHand;
	currentPlayer = localGame.currentPlayer;
	leader = localGame.leader;
}
