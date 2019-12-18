const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const jwt = require("jsonwebtoken");

const sequelizeModule = require("./sequelize");
const sequelize = sequelizeModule.sequelize;
const User = sequelizeModule.User;
// const userRoute=require("./users");
// const cors = require('cors')

// app.use(cors())
// app.use(express.json())
// app.use(userRoute)
function socketRecursive(socket,eventName,req){
  if (req){
    console.log('socketRecursive',socket)
    console.log(eventName,req)
    socket.emit(eventName,req)
  }else{
    setTimeout(() => {
      socketRecursive(socket,eventName,req)
    }, 1000);
    
  }
}
module.exports = io => {
  let count = 0;
  const games = {};
  let message = "hello from server";
  let loginUsers = [];
  io.on("connection", socket => {
    //   const signUsers= User.findAll();
    //   console.log('signUsers',signUsers)
  
    socket.on("login", newUser => {
      const { email, password } = newUser;
      console.log("New user is:", newUser);
    
      let userDetails;
      const socketClientsIds = Object.keys(io.sockets.clients().connected);
  const socketId= socket.id

//
      User.findOne({ where: { email, password } })
        .then(res => {
          res = JSON.stringify(res);
          const user = JSON.parse(res);
          const email = user.email;
          console.log(email);
              if(loginUsers.some(user=>user.email===email)&& loginUsers.length!==0){
                throw new Error()
          }
            
          io.sockets.connected[socketId].emit('auth',{auth:true})

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
            id:socketId
          };
          if(!loginUsers.some(user=>user.email===userDetails.email)|| loginUsers.length===0){
            loginUsers.push(userDetails);
          }
         // socket.emit('loginUsers',loginUsers);
         // socketRecursive(socket,"loginUsers",userDetails);
         // console.log('socketClients',socketClientsIds)
         socketClientsIds.forEach(client=>{
           console.log(client)
           io.sockets.connected[client].emit('loginUsers',loginUsers.map(user=> ({...user, email:''})))
         })
         console.log("loginUsers", loginUsers);


          User.update({ token: token }, { where: { email, password } })
          .then((res)=>console.log('User.update',res));
        })
        .catch(err => {
         // socket.emit("loginUsers", { error: "Ahthentication failed!" });
       console.log( "Ahthentication failed!")
         io.sockets.connected[socketId].emit('auth',{ error: "Ahthentication failed!" })
        
        });


    });
    message = "hello from server" + " " + count;
    let room;
    let rooms = [];
    console.log("hello there1! ", count);
    socket.emit("hello", message);
    let clients;

    socket.on("start game", req => {
      count++;
      if (!io.sockets.adapter.rooms[req.user.room].sockets) {
        let room = req.user.room;
      }

      rooms[room] = {
        ...rooms[room],
        redPiecesPosition: user.redPiecePosition,
        blackPiecesPosition: user.blackPiecesPosition
      };
      // rooms[room].redPiecesPosition=user.redPiecePosition;
      // rooms[room].blackPiecesPosition=user.blackPiecesPosition
      socket.join(room);
      clients = io.sockets.adapter.rooms[room].sockets;
      clients = Object.keys(clients);
      if (clients.length > 2) {
        socket.leave(room);
      }
      console.log(clients);
      io.sockets.connected[clients[clients.length - 1]].emit("setNewBoard", {
        id: clients[clients.length - 1],
        room,
        players: rooms[room].players,
        isFirstPlayer: !(clients.length > 1),
        blackPiecesPosition: rooms[room].blackPiecesPosition,
        isBlackPlayerTurn: false, //clients.length > 1,
        redPiecesPosition: rooms[room].redPiecesPosition
      });
    });
    socket.on("postBoard", nextMove => {
      clients = io.sockets.adapter.rooms[nextMove.room].sockets;
      clients = Object.keys(clients);
      console.log("postBoard", nextMove);
      // socket.emit('setBoard',{
      //   isBlackPlayerTurn: !nextMove.isBlackPlayerTurn,
      //   redPiecesPosition: nextMove.redPiecesPosition,
      //   blackPiecesPosition: nextMove.blackPiecesPosition
      // })
      clients.forEach(client => {
        console.log(client);
        io.sockets.connected[client].emit("setBoard", {
          isBlackPlayerTurn: !nextMove.isBlackPlayerTurn,
          redPiecesPosition: nextMove.redPiecesPosition,
          blackPiecesPosition: nextMove.blackPiecesPosition
        });
      });
    });
  });
};
