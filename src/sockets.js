const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const jwt = require("jsonwebtoken");
const redis = require("socket.io-redis");
io.adapter(redis({ host: "localhost", port: 6379 }));

const sequelizeModule = require("./sequelize");
const sequelize = sequelizeModule.sequelize;
const User = sequelizeModule.User;
// const userRoute=require("./users");
// const cors = require('cors')

// app.use(cors())
// app.use(express.json())
// app.use(userRoute)
function socketRecursive(socket, eventName, req) {
  if (req) {
    console.log("socketRecursive", socket);
    console.log(eventName, req);
    socket.emit(eventName, req);
  } else {
    setTimeout(() => {
      socketRecursive(socket, eventName, req);
    }, 1000);
  }
}
module.exports = io => {
  let loginUsers = [];
  io.on("connection", socket => {
    let rooms = [];
    console.log("hello there! ");
    let clients;
    socket.on("login", newUser => {
      const { email, password } = newUser;
      console.log("New user is:", newUser);

      let userDetails;
      const socketClientsIds = Object.keys(io.sockets.clients().connected);
      const socketId = socket.id;

      //
      User.findOne({ where: { email, password } })
        .then(res => {
          res = JSON.stringify(res);
          let user = JSON.parse(res);
          user = { ...user, id: socketId };
          const email = user.email;
          console.log(email);
          if (
            loginUsers.some(user => user.email === email) &&
            loginUsers.length !== 0
          ) {
            console.log("throw new Error()");
            throw new Error();
          }
          console.log(user);

          if (user.email) {
            user = { ...user, id: socket.id };
            io.sockets.connected[socketId].emit("auth", { user });
          } else {
            throw new Error();
          }

          const token = jwt.sign({ email }, process.env.JWT_SECRET, {
            expiresIn: "3h"
          });
          return { ...user, token };
        })
        .then(user => {
          const { name, numberOfGames, numberOfVictories, token } = user;

          console.log("the user object is", user);
          userDetails = {
            email,
            name,
            numberOfGames,
            numberOfVictories,
            token,
            id: socketId,
            isAvailable: true
          };
          if (
            !loginUsers.some(user => user.email === userDetails.email) ||
            loginUsers.length === 0
          ) {
            loginUsers.push(userDetails);
          }
          // socket.emit('loginUsers',loginUsers);
          // socketRecursive(socket,"loginUsers",userDetails);
          // console.log('socketClients',socketClientsIds)
          socketClientsIds.forEach(client => {
            console.log(client);
            io.sockets.connected[client].emit(
              "loginUsers",
              loginUsers.map(user => ({ ...user, email: "" }))
            );
          });
          console.log("loginUsers", loginUsers);

          User.update(
            { token: token },
            { where: { email, password } }
          ).then(res => console.log("User.update", res));
        })
        .catch(err => {
          // socket.emit("loginUsers", { error: "Ahthentication failed!" });
          console.log("Ahthentication failed!");
          io.sockets.connected[socketId].emit("auth", {
            error: "Ahthentication failed!"
          });
        });
    });
    let isReply = false;
    let rivelPlayers;
    socket.on("requestMatch", players => {
      console.log("players", players);
      reqUser = {
        reqUserName: players.reqUserName,
        reqUserId: players.reqUserId,
        reqUsernumberOfGames: players.reqUsernumberOfGames,
        reqUsernumberOfVictories: players.reqUsernumberOfVictories,
        room: players.reqUserId
      };
      rivelPlayers = players;
      if (!isReply) {
        io.sockets.connected[players.challengedUserId].emit(
          "requestMatchToUser",
          reqUser
        );
        isReply = true;
      }
    });

    socket.on("reply", reply => {
      console.log(reply);
      isReply = false;
      if (reply.quit) {
      socket.leave(reply.room);
      const rivalPlayer = Object.keys(io.sockets.adapter.rooms[reply.room].sockets)[0];
      loginUsers = loginUsers.map(user => {
        console.log(user, socket.id);

        if (user && (user.id === socket.id|| user.id===rivalPlayer) )
          return { ...user, isAvailable: true };
        else return user;
      });
      loginUsers.forEach(user => {
        if (user)
          io.sockets.connected[user.id].emit(
            "loginUsers",
            loginUsers.map(user => ({ ...user, email: "" }))
          );
      });
     return io.sockets.connected[rivalPlayer].emit("answer", reply);
    
      }
      console.log("reply", reply);
      reply = { ...reply, room: reply.reqUserId };
      io.sockets.connected[reply.reqUserId].emit("answer", reply);
      if (reply.reply) {
        room = reply.reqUserid;
      }
    });
    socket.on("startGame", room => {
      console.log("room==>", room);

      socket.join(room);
      loginUsers = loginUsers.map(user => {
        console.log(user, socket.id);

        if (user && user.id === socket.id)
          return { ...user, isAvailable: false };
        else return user;
      });
      loginUsers.forEach(user => {
        if (user)
          io.sockets.connected[user.id].emit(
            "loginUsers",
            loginUsers.map(user => ({ ...user, email: "" }))
          );
      });

      clients = Object.keys(io.sockets.adapter.rooms[room].sockets);

      console.log(clients.indexOf(socket.id));

      io.sockets.connected[socket.id].emit("setNewBoard", {
        room,
        isFirstPlayer: clients.indexOf(socket.id) === 0,
        blackPiecesPosition: [
          [5, 0],
          [5, 2],
          [5, 4],
          [5, 6],
          [6, 1],
          [6, 3],
          [6, 5],
          [6, 7],
          [7, 0],
          [7, 2],
          [7, 4],
          [7, 6]
        ],
        isBlackPlayerTurn: false, //clients.length > 1,
        redPiecesPosition: [
          [0, 1],
          [0, 3],
          [0, 5],
          [0, 7],
          [2, 1],
          [2, 3],
          [2, 5],
          [2, 7],
          [1, 0],
          [1, 2],
          [1, 4],
          [1, 6]
        ]
      });
    });

    socket.on("postBoard", nextMove => {
      clients = io.sockets.adapter.rooms[nextMove.room].sockets;
      clients = Object.keys(clients);
      console.log("postBoard", nextMove);

      clients.forEach(client => {
        console.log(client);
        io.sockets.connected[client].emit("setBoard", {
          isBlackPlayerTurn: !nextMove.isBlackPlayerTurn,
          redPiecesPosition: nextMove.redPiecesPosition,
          blackPiecesPosition: nextMove.blackPiecesPosition
        });
      });
    });
    socket.on("disconnect", () => {
      const socketClientsIds = Object.keys(io.sockets.clients().connected);
      const socketId = socket.id;
      loginUsers = loginUsers.filter(user => user.id !== socketId);
      socketClientsIds.forEach(client => {
        io.sockets.connected[client].emit(
          "loginUsers",
          loginUsers.map(user => ({ ...user, email: "" }))
        );
      });
    });
  });
};
