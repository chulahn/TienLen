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

//array of strings
var socketIds = [];
var rooms = [];

//array of objs.  @id = socket number, @num = playerIndex
var players = [];
var missingPlayers = [];

var gameStarted = false;

io.on("connection", function(socket) {
  var connectedUsers = io.sockets.sockets.length;
  console.log(connectedUsers + " users" + " : " + socket.id + " has connected");
  // var sessionid = socket.io.engine.id;
  //console.log(socket);
  // console.log(io.nsps['/'].adapter.rooms)

  socketIds.push(socket.id);

  // if (gameStarted === false) {
  // var newPlayer = {};
  // newPlayer.id = socket.id;
  // newPlayer.num = players.length;

  //   players.push(newPlayer);

  //   if (players.length === 4) {
  //     console.log("Starting Game");
  //     gameStarted = true;
  //     cg = new Game(players);
  //     cg.findStartingPlayer();
  //     emitEach("setUpPlayer");
  //   }
  // } else {
  //   //Game already started, but some player(s) disconnected.
  //   if (players.length < 4) {
  //     //Get the first disconnected Player, change id to current socket's id
  //     var newConnected = missingPlayers.shift();
  //     newConnected.id = socket.id;
  //     players.push(newConnected); //push object containing id and num
  //     console.log(players);

  //     //Update Server's Game object with new Player id
  //     cg.players[newConnected.num].id = newConnected.id;

  //     //4 Players are connected, Update everyones game
  //     if (players.length === 4) {
  //       console.log("reconnectingGame");
  //       emitEach("reconnectGame");
  //     }
  //   } else if (players.length === 4) {
  //     console.log("Spectactor joined");
  //     io.to(socket.id).emit("reconnectGame", {
  //       playerIndex: socketIds.length - 1,
  //       updatedGame: cg
  //     });
  //   }
  // }

  /*
		Room Handlers
	*/

  socket.on("createRoom", function() {
    // Initialize room with id, first player
    // Then Push to global rooms array
    var roomNum = Math.floor(Math.random() * 10000);

    var room = {};
    room.gameStarted = false;
    room.id = roomNum;
    room.players = [];

    var firstPlayer = {};
    firstPlayer.id = socket.id;
    firstPlayer.num = room.players.length;
    room.players.push(firstPlayer);

    rooms.push(room);

    socket.join(roomNum);
    console.log(socket.id + " created/joining " + roomNum);
    io.to(socket.id).emit("createdRoom", roomNum);
  });

  socket.on("leaveRoom", function(roomNum) {
    console.log(socket.id + " leaving room " + roomNum);
    socket.leave(roomNum);
    io.to(socket.id).emit("leftRoom");
  });

  //Sends the client an array of available rooms
  socket.on("getRooms", function() {
    console.log("gettingRooms");
    checkRooms();
    socket.emit("gotRooms", rooms);
  });

  socket.on("joinRoom", function(roomNum) {
    console.log("Join Room: " + socket.id + " joining room " + roomNum);
    socket.join(roomNum);

    // Emit joinedRoom so browser loads /rooms
    // $('body').load('/room/'
    io.to(socket.id).emit("joinedRoom", roomNum);

    // Find the room with roomNum
    // Add the player that just joined room
    // If there are 4 players, set up game
    for (var i = 0; i < rooms.length; i++) {
      var thisRoom = rooms[i];
      console.log("thisRoom: ", thisRoom);
      if (thisRoom.id == roomNum) {
        var newPlayer = {};
        newPlayer.id = socket.id;
        newPlayer.num = thisRoom.players.length;

        thisRoom.players.push(newPlayer);

        if (thisRoom.players.length === 4) {
          console.log("Room is ready to start");
          // Initialize room.
          thisRoom.gameStarted = true;
          thisRoom.game = new Game(thisRoom.players);
          thisRoom.game.findStartingPlayer();

          // Emit to each player their index and Game object.
          for (var j = 0; j < thisRoom.players.length; j++) {
            var thisPlayer = thisRoom.players[j];

            io.to(thisPlayer.id).emit("setUpPlayer", {
              playerIndex: j,
              updatedGame: thisRoom.game
            });

            // Emit to last player a second later because page needs to be loaded so it can receive emitted event.
            if (j === 3) {
              setTimeout(
                function(thisRoom) {
                  console.log("Emit to player 4");
                  io.to(thisPlayer.id).emit("setUpPlayer", {
                    playerIndex: 3,
                    updatedGame: thisRoom.game
                  });
                },
                1000,
                thisRoom
              );
            }
          }
        }
      }
    }
  });

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

  /*
		Game Handlers
	*/

  // Updates Player's selectedCards on Server's game object
  socket.on("clickedCard", function(data) {
    console.log("clickedCard: ", socket.id, " data: ", data);
    console.log("-rooms", rooms);

    function checkSocketInRoom(thisRoom, socketId) {
      for (var j = 0; j < thisRoom.players.length; j++) {
        var thisPlayer = thisRoom.players[j];
        console.log("thisPlayer: ", thisPlayer);

        if (thisPlayer.id === socketId) {
          console.log(
            "Found room: ",
            j,
            " roomId: ",
            thisRoom.id,
            " socket: ",
            socketId
          );
          return true;
        }
      }
      return false;
    }

    // Find the room where socket is in
    for (var i = 0; i < rooms.length; i++) {
      var thisRoom = rooms[i];

      console.log("thisRoom: ", thisRoom);

      // If Socket is in that room, update server's data with selectedCards
      if (checkSocketInRoom(thisRoom, socket.id)) {
        console.log("Socket ", socket.id, " is in Room ", thisRoom.id);
        if (data !== undefined) {
          thisRoom.game.players[data.playerNum].selectedCards =
            data.selectedCards;
          console.log(
            "Player ",
            data.playerNum + 1,
            " Cards: ",
            thisRoom.game.players[data.playerNum].selectedCards
          );
        }
      } else {
        console.log("Socket not in Room ", thisRoom.id);
      }
    }
  });

  //Called when a player is making a move.
  //Server send's its game so that player can call playCards
  socket.on("getGameData", function(action) {
    console.log(socket.id + " requested gameData action was ".green + action);

    switch (action) {
      case "play":
        socket.emit("readyToPlayCards", cg);
        break;
      // case "skip";
      // 	socket.emit('')
    }
    console.log("sentData".red);
  });

  //Updates Player object on server's game object
  socket.on("playCards", function(d) {
    updateGame("played", d.newGame, d.updatedPlayer);

    var i = cg.findPlayerIndex(d.updatedPlayer);

    if (cg.players[i].finished()) {
      cg.addWinner(i);
    }

    console.log(
      "----player " + (i + 1) + " played cards----".green + socket.id
    );
    console.log(
      "Leader is now ",
      +(cg.leader + 1) + " Current player:" + (cg.currentPlayer + 1)
    );
    console.log("-----end played cards.  emitting to other players-----".red);

    socket.broadcast.emit("playedCards", {
      cg: cg,
      updatedPlayer: d.updatedPlayer
    });
  });

  //Update turnData on server's game object
  socket.on("skipTurn", function(clientGame) {
    console.log("skipped turn".yellow + socket.id + " skipped turn".yellow);

    updateGame("skip", clientGame);

    var newTurn = cg.checkTurnData();
    if (newTurn) {
      console.log("newTurn".yellow);
    }
    socket.broadcast.emit("skipTurn", { cg: cg, newTurn: newTurn });
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

//Called when a player plays cards or skip.
function updateGame(action, clientGame, updatedPlayer) {
  cg.currentPlayer = clientGame.currentPlayer;
  cg.turnData = clientGame.turnData;

  if (action === "played") {
    var i = cg.findPlayerIndex(updatedPlayer);
    cg.players[i] = updatedPlayer;
    cg.players[i].__proto__ = Player.prototype;

    cg.lastPlayedHand = clientGame.lastPlayedHand;
    cg.lastPlayedHand.__proto__ = Hand.prototype;

    cg.leader = clientGame.leader;
    cg.currentRule = clientGame.currentRule;
  }
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
