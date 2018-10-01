var exports = module.exports;

var Card = require("./game_objects/card.js");
var Player = require("./game_objects/player.js");
var Hand = require("./game_objects/hand.js");
var Game = require("./game_objects/game.js");

//var express = require('express'), app = express();
var app = require("express")();
var server = require("http").Server(app);
var io = (exports.io = require("socket.io").listen(server));
var colors = require("colors");

// Load the full build.
var _ = require("lodash");

var fileRouter = require("./fileRouter.js");

app.use("/", fileRouter);

app.get("/", function(req, res) {
  res.sendfile("./public/index.html");
});

app.get("/room", function(req, res) {
  res.sendfile("./public/room.html");
});

app.get("/room/:roomNum", function(req, res) {
  res.render("room.ejs", { roomNum: req.params.roomNum });
});

var cg = exports.currentGame;

var Glo = {};
Glo.socketIds = [];
Glo.rooms = [];
Glo.players = [];

//array of strings
var socketIds = [];
var rooms = [];

//array of objs.  @id = socket number, @num = playerIndex
var players = [];
var missingPlayers = [];

var gameStarted = false;

// Connect to Socket
io.on("connection", function(socket) {
  var connectedUsers = io.sockets.sockets.length;
  console.log(
    connectedUsers,
    " users(io.sockets.sockets.length): ",
    socket.id,
    " has connected"
  );

  // var sessionid = socket.io.engine.id;
  //console.log(socket);
  // console.log(io.nsps['/'].adapter.rooms)

  // Push connected user to array of socketIds
  socketIds.push(socket.id);
  Glo.socketIds.push(socket.id);

  /*
		Room Handlers
	*/

  // Sends the client an array of available rooms
  // index.html receives rooms [] => .id and .players
  socket.on("getRooms", function() {
    console.log("gettingRooms");
    checkRooms();
    socket.emit("gotRooms", Glo.rooms);
  });

  // Create a Room Obj, and push to Globals
  socket.on("createRoom", function() {
    // Initialize room with id, and connected first player
    var roomNum = Math.floor(Math.random() * 10000);

    //TODO: Create a Room Object w/ Constructor
    var room = {};
    room.gameStarted = false;
    room.id = roomNum;
    room.players = [];

    //TODO: Create a Player Object w/ Constructor
    var firstPlayer = {};
    firstPlayer.id = socket.id;
    firstPlayer.num = room.players.length;
    room.players.push(firstPlayer);

    // Then Push to Global rooms array
    Glo.rooms.push(room);

    // Put Socket in room, and emit createdRoom.
    socket.join(roomNum);
    console.log(socket.id + " created/joining " + roomNum);
    io.to(socket.id).emit("createdRoom", roomNum);
  });

  // Create a playerObject and add to Glo.rooms[i].players
  socket.on("joinRoom", function(roomNum) {
    // Join socket room
    console.log(
      "Join Room: ".green,
      socket.id,
      " joining room ".green,
      roomNum
    );
    socket.join(roomNum);
    //TODO:log about selected room

    // Emit joinedRoom so browser:index.html loads /rooms
    // $('body').load('/room/'
    io.to(socket.id).emit("joinedRoom", roomNum);

    var thisRoom = _.find(Glo.rooms, function(room) {
      // == room.id is int, roomNum is string
      return room.id == roomNum;
    });

    //TODO: If Game not started

    //TODO: USE PLAYER OBJECT?
    //Add newPlayer with this socket, and player Number, to Glo.rooms[i].players
    var newPlayer = {};
    newPlayer.id = socket.id;
    newPlayer.num = thisRoom.players.length;

    // Add the player that just joined room
    thisRoom.players.push(newPlayer);

    // If there are 4 players, set up game
    var readyToStart = thisRoom.players.length === 4;
    if (readyToStart) {
      console.log(
        "joinRoom: Room is ready to start.  emitting to each player".yellow
      );

      // Initialize room.
      thisRoom.gameStarted = true;
      thisRoom.game = new Game(thisRoom.players);
      thisRoom.game.findStartingPlayer();

      // Emit to each player their index and Game object.
      // So localGame can be updated

      _.forEach(thisRoom.players, function(thisPlayer, index) {
        // Room.ejs /socket.js
        io.to(thisPlayer.id).emit("setUpPlayer", {
          playerIndex: index,
          updatedGame: thisRoom.game
        });

        // Emit to last player a second later because page needs to be loaded so it can receive emitted event.
        if (index === 3) {
          setTimeout(
            function(thisRoom) {
              console.log("joinRoom: Emit to player 4".yellow);
              io.to(thisPlayer.id).emit("setUpPlayer", {
                playerIndex: 3,
                updatedGame: thisRoom.game
              });
            },
            1000,
            thisRoom
          );
        }
      });
    }
    /* Reconnect Logic
          var gameHasStarted = thisRoom.gameStarted
            if (gameHasStarted && players.length < 4) {
              //Get the first disconnected Player, change id to current socket's id
              var newConnected = missingPlayers.shift();
              newConnected.id = socket.id;
              players.push(newConnected); //push object containing id and num
              console.log(players);

              //Update Server's Game object with new Player id
              cg.players[newConnected.num].id = newConnected.id;

              //4 Players are connected, Update everyones game
              if (players.length === 4) {
                console.log("reconnectingGame");
                emitEach("reconnectGame");
              }
            } else if (players.length === 4) {
              console.log("Spectactor joined");
              io.to(socket.id).emit("reconnectGame", {
                playerIndex: socketIds.length - 1,
                updatedGame: cg
              });
            }
          }
    */
  });

  /*
		Game Handlers
	*/

  // Called when a card is Clicked
  // Updates Server's Global game object Player's selectedCards on
  // data has .selectedCards and .playerNum
  socket.on("clickedCard", function(data) {
    console.log(
      "clickedCard: ".green,
      socket.id,
      " data: ".green,
      data.selectedCards
    );

    _.forEach(Glo.rooms, function(room) {
      var playerSocketInRoom = _.find(room.players, function(player, index) {
        if (player.id == socket.id) {
          console.log(
            "playerSocketInRoom: Found Player: ".cyan,
            index + 1,
            " roomId: ".cyan,
            room.id,
            " socket: ".cyan,
            socket.id
          );
        }
        return player.id == socket.id;
      });

      if (playerSocketInRoom) {
        if (data !== undefined) {
          //update server's Global data with data.selectedCards

          room.game.players[data.playerNum].selectedCards = data.selectedCards;
          console.log(
            "clickedCard: Player ".yellow,
            data.playerNum + 1,
            " Cards: ".yellow,
            room.game.players[data.playerNum].selectedCards
          );
        }
      } else {
        console.log("clickedCard: Socket not in Room ".yellow, room.id);
      }
    });

    console.log("clickedCard END: ".red, socket.id);
  });

  // Called when a player is making a move. Eg. play or skip
  // Server send's its game by emit("readyToPlayCards") so that player can call playCards
  socket.on("getGameData", function(action) {
    console.log(
      "getGameData: ".green,
      socket.id,
      " on gameData action was ".green,
      action
    );

    switch (action) {
      case "play":
        // Get Room Number based socket's id.
        var roomIndex = getRoomNumberFromSocketId(socket.id);
        var roomToUpdate = Glo.rooms[roomIndex];
        console.log(
          "getGameData: emitting readyToPlayCards Play ".green,
          roomToUpdate.game.players
        );

        socket.emit("readyToPlayCards", roomToUpdate.game);
        break;
      // case "skip";
      // 	socket.emit('')
    }
    console.log("getGameData: END".red);
  });

  // Called after playCards. d .newGame and .updatedPlayer
  socket.on("playCards", function(d) {
    // Updates Player object on server's game object
    console.log(
      "playCards: updateGame('played', d.newGame, d.updatedPlayer, socket.id)"
        .blue,
      // cg,
      " updatedPlayer cardsLeft:".blue,
      d.updatedPlayer.hand.sortedCards.length,
      " socket: ".blue,
      socket.id
    );
    updateGame("played", d.newGame, d.updatedPlayer, socket.id);

    var roomIndex = getRoomNumberFromSocketId(socket.id);
    var roomToUpdate = Glo.rooms[roomIndex];
    var cg = roomToUpdate.game;

    var i = cg.findPlayerIndex(d.updatedPlayer);

    if (cg.players[i].finished()) {
      cg.addWinner(i);
    }

    console.log(
      "playCards: Player ".blue,
      i + 1,
      " played cards----".blue,
      socket.id
    );
    console.log(
      "playCards: Leader is now ".blue,
      cg.leader + 1,
      " Current player:".blue,
      cg.currentPlayer + 1
    );

    // Give updated game to client so Local can Refresh with cg and updatedPlayer
    console.log(
      "-----end playCards.  emitting playedCards to other players-----".red
    );
    // This emits to everyone.  Should only emit in Room
    socket.broadcast.emit("playedCards", {
      cg: cg,
      updatedPlayer: d.updatedPlayer
    });
  });

  /*
		TODO HANDLERS
	*/
  // TODO: UPDATE .  check on(leftRoom)
  socket.on("leaveRoom", function(roomNum) {
    console.log(socket.id + " leaving room " + roomNum);
    socket.leave(roomNum);
    io.to(socket.id).emit("leftRoom");
  });

  // TODO: UPDATE.  get from Globals based on socketid
  // Update turnData on server's game object
  socket.on("skipTurn", function(clientGame) {
    console.log("skipped turn".yellow + socket.id + " skipped turn".yellow);

    updateGame("skip", clientGame);

    var newTurn = cg.checkTurnData();
    if (newTurn) {
      console.log("newTurn".yellow);
    }
    socket.broadcast.emit("skipTurn", { cg: cg, newTurn: newTurn });
  });

  // TODO: UPDATE SO ITS COMPATIBLE
  socket.on("disconnect", function() {
    //Remove disconnected Player's socket
    var discPerson = socketIds.indexOf(socket.id);
    socketIds.splice(discPerson, 1);
    console.log(socketIds.length + " sockets left.");

    //Find the Object which has the same id
    //Remove from players and push to missingPlayers
    for (var i = 0; i < players.length; i++) {
      if (players[i].id === socket.id) {
        missingPlayers.push(players.splice(i, 1)[0]);
        console.log(
          players.length +
            " players left. " +
            " Player" +
            (discPerson + 1) +
            ":" +
            socket.id +
            " has disconnected"
        );
      }
    }

    console.log(missingPlayers);
    console.log("--------");

    //Reset Game if no players;
    if (players.length === 0) {
      console.log("no players, deleting game");
      missingPlayers = [];
      gameStarted = false;
    }
  });
});

server.listen(3000, function() {
  console.log("listening on :3000");
});

//Called when creating a game, or when a started game has enough players again.
function emitEach(eventName, data) {
  for (var j = 0; j < 4; j++) {
    var currentSocket = players[j];

    switch (eventName) {
      case "setUpPlayer":
        io.to(currentSocket.id).emit(eventName, {
          playerIndex: j,
          updatedGame: cg
        });
        break;
      case "reconnectGame":
        for (var k = 0; k < cg.players.length; k++) {
          var currentPlayer = cg.players[k];
          if (currentSocket.id == currentPlayer.id) {
            io.to(currentSocket.id).emit(eventName, {
              playerIndex: k,
              updatedGame: cg
            });
          }
        }
        break;
    }
    console.log("emitting " + eventName + " " + currentSocket.id);
  }
}

function getRoomNumberFromSocketId(socketId) {
  // io.sockets.sockets.length;
  for (var i = 0; i < Glo.rooms.length; i++) {
    var thisRoom = Glo.rooms[i];
    console.log(
      "getRoomNumberFromSocketId: ".cyan,
      thisRoom.id,
      " socket: ",
      socketId
    );

    for (var j = 0; j < thisRoom.players.length; j++) {
      var thisPlayer = thisRoom.players[j];
      console.log("getRoomNumberFromSocketId: thisPlayer:".cyan, thisPlayer);

      if (thisPlayer.id === socketId) {
        console.log(
          "getRoomNumberFromSocketId: Found room Player: ".cyan,
          j + 1,
          " roomId: ".cyan,
          thisRoom.id,
          " socket: ".cyan,
          socketId
        );
        return i;
      }
    }
  }
}

// Change cg to Glo.rooms[i].game
// Called when a player plays cards or skip.
function updateGame(action, clientGame, updatedPlayer, socketId) {
  var roomIndex = getRoomNumberFromSocketId(socketId);
  var roomToUpdate = Glo.rooms[roomIndex];

  var cg = roomToUpdate.game;

  console.log(
    "updateGame: ".yellow,
    // clientGame,
    " updatedPlayer:".yellow,
    updatedPlayer.num + 1,
    " socket: ".yellow,
    socketId
  );

  cg.currentPlayer = clientGame.currentPlayer;
  cg.turnData = clientGame.turnData;

  // update Global with updatedPlayer, lastPlayedHand, leader, and currentRule
  if (action === "played") {
    var i = cg.findPlayerIndex(updatedPlayer);
    cg.players[i] = updatedPlayer;
    cg.players[i].__proto__ = Player.prototype;

    cg.lastPlayedHand = clientGame.lastPlayedHand;
    cg.lastPlayedHand.__proto__ = Hand.prototype;

    cg.leader = clientGame.leader;
    cg.currentRule = clientGame.currentRule;
  }

  console.log(
    "updateGame: Glo.rooms[roomIndex] == roomToUpdate".yellow,
    Glo.rooms[roomIndex] == roomToUpdate
  );
  console.log("updateGame: END".red);
}

//Gets all created rooms and stores in room array
//TODO: remove destroyed rooms
function checkRooms() {
  var allRoomsAndSockets = io.sockets.adapter.rooms;
  var allSockets = io.sockets.adapter.sids;

  for (var room in allRoomsAndSockets) {
    for (var sock in allSockets) {
      var isRoom = room !== sock && allSockets[room] === undefined;
      var notAdded = rooms.indexOf(room) === -1;
      if (isRoom && notAdded) {
        //rooms.push(room);
        break;
      }
    }
  }
}
