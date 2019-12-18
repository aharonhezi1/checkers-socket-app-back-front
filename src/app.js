const express= require("express")
const app = express();
// const http = require("http").Server(app);
const userRoute=require("./users");
const cors = require('cors')
const server = app.listen(3030);


var io = require('socket.io').listen(server);

app.use(cors())
app.use(express.json())
app.use(userRoute)

let count = 0; 
const games = {};
let message = "hello from server";
const sockets=require('./sockets')(io)
// sockets.listen(server)

 // http.listen(3030);

