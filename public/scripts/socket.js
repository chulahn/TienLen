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

		$('.card').remove();
		localGame.displayCards();

		hideOtherPlayer();
		displayGameData();
	});

	socket.on('playedCards', function(d) {

		var i = localGame.findPlayerIndex(d.updatedPlayer);
		localGame.players[i] = new Player(d.updatedPlayer);

		console.log('player ' + (i+1) + ' played cards');


		//NEED TO update players
		localGame.lastPlayedHand = new Hand(d.cg.lastPlayedHand);
		localGame.leader = d.cg.leader;
		localGame.currentPlayer = d.cg.currentPlayer;
		localGame.turnData = d.cg.turnData;
		localGame.currentRule = d.cg.currentRule;

		var cardsToRemove = localGame.lastPlayedHand.cards.length;
		console.log ('cards to remove ' + cardsToRemove);
		for (var j=0; j<cardsToRemove; j++) {
			console.log(localGame.lastPlayedHand);
			console.log('removing ' + (j+1));
			console.log( '#player'+(i+1)+'>div.hand>div.card' + ' is selector');
			$('#player'+(i+1)+'>div.hand>div.card')[0].remove();
		}

		displayGameData();

	});

	socket.on('skipTurn', function(d) {
		localGame.turnData = d.cg.turnData;
		localGame.currentPlayer = d.cg.currentPlayer;
		localGame.currentRule = d.cg.currentRule;

		$('#currentPlayersTurn').html(localGame.currentPlayer.toDivNum());
		if (d.newTurn) {
			localGame.lastPlayedHand = lastPlayedHand = null;
			var leader = localGame.turnData.indexOf("Start");
			alert("on skip New Turn.  Player " + (leader+1) + " starts");
			$('#currentRule').html("None");
			$('#lastPlayed').html("");
		}
		displayGameData();

	});
});

function updateLocal(newData) {
	localGame = new Game(newData.updatedGame);
	thisPlayerIndex = newData.playerIndex;
	thisPlayer = localGame.players[newData.playerIndex];
	lastPlayedHand = new Hand(localGame.lastPlayedHand);
	currentRule = localGame.currentRule;
	lastPlayedHand = localGame.lastPlayedHand;
	currentPlayer = localGame.currentPlayer;
	leader = localGame.leader;
}
