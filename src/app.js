const express= require("express")
const app = express();
// const http = require("http").Server(app);
const userRoute=require("./users");
const cors = require('cors')
const server = app.listen(process.env.PORT);


var io = require('socket.io').listen(server);

app.use(cors())
app.use(express.json())
app.use(userRoute)


