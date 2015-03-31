socket.on('connect' , function() {
	console.log(socket.id);

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

	socket.on('receiveLastPlayedHand', function(data) {
		localGame.lastPlayedHand = new Hand(data);  
		console.log('got last played hand ' + new Hand(data));
	});

	//passed html to server to be shown on the other clients
	socket.on('displayNewRule', function(d) {

		console.log('displayNewRule');
		$("#lastPlayed").html(d.lastPlayed);
		$("#currentRule").html(d.currentRule);
		displayGameData();

	});

	socket.on('playedCards', function(d) {
		console.log('a player played cards');

		var i = localGame.findPlayerIndex(d.updatedPlayer);
		localGame.players[i] = new Player(d.updatedPlayer);



		//NEED TO update players
		localGame.lastPlayedHand = new Hand(d.cg.lastPlayedHand);
		localGame.leader = d.cg.leader;
		localGame.currentPlayer = d.cg.currentPlayer;
		localGame.turnData = d.cg.turnData;
		localGame.currentRule = d.cg.currentRule;

		for (var j=0; j<localGame.lastPlayedHand.cards.length; j++) {
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
