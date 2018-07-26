if (typeof socket === "undefined") {
  socket = io.connect("http://localhost:3000");
}

socket.on("connect", function() {
  console.log("Your socket.id is " + socket.id);
});

socket.on("setUpPlayer", function(data) {
  console.log("settingup player");

  setupLocalGame(data);

  cleanPage();
  localGame.displayCards();

  displayGameData();
});

socket.on("reconnectGame", function(data) {
  console.log("reconnecting");

  setupLocalGame(data);

  cleanPage();
  localGame.displayCards();
  highlightSelected();

  displayGameData();
});

socket.on("playedCards", function(d) {
  localGame = new Game(d.cg);
  thisPlayer = localGame.players[thisPlayerIndex];

  var i = localGame.findPlayerIndex(d.updatedPlayer);

  var cardsToRemove = localGame.lastPlayedHand.cards.length;
  for (var j = 0; j < cardsToRemove; j++) {
    $("#player" + (i + 1) + ">div.hand>div.card")[0].remove();
  }

  displayGameData();
  console.log("player " + (i + 1) + " played cards");
});

socket.on("readyToPlayCards", function(data) {
  console.log("readyToPlaycards data: ", data);
  localGame = new Game(data);
  thisPlayer = localGame.players[thisPlayerIndex];
  var cardsToPlay = new Hand(thisPlayer.selectedCards);

  if (localGame.lastPlayedHand.val === undefined) {
    createFakeHand();
  }

  var isPlayersTurn = thisPlayerIndex === localGame.currentPlayer;

  if (
    isPlayersTurn &&
    cardsToPlay.followsRule() &&
    cardsToPlay.beats(localGame.lastPlayedHand)
  ) {
    console.log("Gameplay:follows rule and beats lastplayed");

    var selectedPlayer = $("#player" + thisPlayerIndex.toDivNum());
    var cardsToRemove = selectedPlayer.find(".selected");
    cardsToRemove.remove();

    //updates localGame and thisPlayer and then pushes changes to server to push to other players
    thisPlayer.playCards();

    displayGameData();
  } else {
    displayError();
  }
  console.log("----------------finished playCard----------");

  function createFakeHand() {
    //If first move of a turn
    //Create a fakeHand that has same type but a lower value
    console.log("createFakeHand", thisPlayer.selectedCards);
    var fakeHand = new Hand(thisPlayer.selectedCards);
    fakeHand.val.highest = new Card(-1, -1);
    localGame.lastPlayedHand = fakeHand;
  }

  function displayError() {
    var errorMessage = "";

    if (thisPlayerIndex !== localGame.currentPlayer) {
      errorMessage += "Not your turn\n";
    }

    if (!cardsToPlay.followsRule()) {
      errorMessage +=
        "Hand does not follow rule " + localGame.currentRule + "\n";

      var containsThreeOfSpades = cardsToPlay.findCard(threeOfSpades) !== -1;
      if (!containsThreeOfSpades) {
        errorMessage += "Must have 3 of Spades";
      }
    }

    if (!cardsToPlay.beats(localGame.lastPlayedHand)) {
      errorMessage += "Hand does not beat last played Hand\n";
    }
    alert(errorMessage);
  }
});

socket.on("skipTurn", function(d) {
  localGame = new Game(d.cg);

  console.log(socket.id + " skippedTurn");

  if (d.newTurn) {
    localGame.lastPlayedHand = lastPlayedHand = null;
    var leader = localGame.turnData.indexOf("Start");
    alert(
      "onEmit skip New Turn.  Player " +
        (leader + 1) +
        " starts.  This is Player " +
        thisPlayerIndex
    );
    $("#currentRule").html("None");
    $("#lastPlayed>.hand").html("");
  }
  displayGameData();
});

socket.on("createdRoom", function(roomNum) {
  console.log("createdRoom");

  $("body").load("/room");
});

socket.on("leftRoom", function(roomNum) {
  console.log("leftRoom");

  $("body").load("/", function() {
    $("title").html("Home");
  });
});

function setupLocalGame(newData) {
  console.log(newData);
  thisPlayerIndex = newData.playerIndex;
  localGame = new Game(newData.updatedGame);
  thisPlayer = localGame.players[newData.playerIndex];
}

//Clears any previously added Cards, and shows only the user's buttons
function cleanPage() {
  //clear cards so that new cards can be added
  $(".card").remove();

  //hide other player's buttons
  var a = thisPlayerIndex.toDivNum();
  $(".btn").show();
  $(".player").each(function() {
    var $curr = $(this);
    var playerNum = $curr.attr("id").getLastChar();
    if (a != playerNum) {
      $curr.find(".btn").hide();
    }
  });
}
