socket.on('connect' , function() {
	console.log(socket.id)

	socket.on('setUpPlayer', function(data) {
		console.log('settingup player');
		localGame = new Game(data.updatedGame);
		thisPlayerIndex = data.playerIndex;
		thisPlayer = localGame.players[data.playerIndex];
		lastPlayedHand = new Hand(localGame.lastPlayedHand);
		currentRule = localGame.currentRule;
		lastPlayedHand = localGame.lastPlayedHand;
		console.log('xxxxxxxxxfinished setting up')


		$('#playerInfo').html(thisPlayerIndex.toDivNum())

		//old socket on displayCards
		$('.card').remove();
		localGame.displayCards();
		// $('.card').addClass('other');
		// $('#player' + (thisPlayerIndex.toDivNum()) +' .card').removeClass('other');

		hideOtherPlayer();

		displayTurnData();
	});

	socket.on('reconnectGame', function(data) {
		$('.activePlayer').removeClass();

		localGame = new Game(data.updatedGame);
		thisPlayerIndex = data.playerIndex;
		thisPlayer = localGame.players[data.playerIndex];
		lastPlayedHand = new Hand(localGame.lastPlayedHand);
		currentRule = localGame.currentRule;
		lastPlayedHand = localGame.lastPlayedHand;
		currentPlayer = localGame.currentPlayer;
		leader = localGame.leader;


		//div #
		var currentPlayerDiv = currentPlayer.toDivNum();
		var leaderDiv = leader.toDivNum();


		$('.card').remove();
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


	socket.on('receiveLastPlayedHand', function(data) {
		localGame.lastPlayedHand = new Hand(data);  
		console.log('got last played hand ' + new Hand(data));
	});

	//passed html to server to be shown on the other clients
	socket.on('displayNewRule', function(d) {

		console.log('displayNewRule')
		$("#lastPlayed").html(d.lastPlayed);
		$("#currentRule").html(d.currentRule);
		displayTurnData();

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
			$('#player'+(i+1)+'>div.hand>div.card')[0].remove();
		}

		displayTurnData();

	});

	socket.on('skipTurn', function(d) {
		localGame.turnData = d.cg.turnData;
		localGame.currentPlayer = d.cg.currentPlayer;
		console.log(d.newTurn);

		$('#currentPlayersTurn').html(localGame.currentPlayer.toDivNum())
		if (d.newTurn) {
			var leader = localGame.turnData.indexOf("Start");
			alert("New Turn.  Player " + (leader+1) + " starts");
			$('#currentRule').html("None");
			$('#lastPlayed').html("");
		}

		displayTurnData();

	});
});
