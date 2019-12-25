const express = require("express");
const app = express();
const http = require("http").Server(app);
const io = require("socket.io")(http);
const router = new express.Router();
const jwt = require("jsonwebtoken");

const sequelizeModule = require("./sequelize");
const sequelize = sequelizeModule.sequelize;
const User = sequelizeModule.User;
const users = [];

router.get("/api/users", (req, res) => {
  // User.sync({ force: true }).then(() => {
  try {
    User.findAll().then(users => {
      // console.log('success',users)
      // console.log("All users:", JSON.stringify(users, null, 4));
      res.status(200).send(users);
    });
  } catch (e) {
    console.log("eroor", e);
    res.status(400).send(e);
  }
});

router.post("/api/users", async (req, res) => {
  const user = req.body;
  console.log(user);
  try {
    await User.create(user);
    res.send();
  } catch (e) {
    res.status(400).send(e);
  }
});

router.post("/api/users/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ where: { email, password } });
    if (user) {
      const token = jwt.sign({ email }, process.env.JWT_SECRET, {
        expiresIn: "3h"
      });
      await User.update({ token }, { where: { email, password } });
      userDetails = {
        name: user.name,
        numberOfGames: user.numberOfGames,
        numberOfVictories: user.numberOfVictories,
        token
      };
      users.push(userDetails);
      console.log(users);
      io.on("connection", socket => {
        socket.emit("users", users);
      });
      res.send();
    } else {
      throw new Error();
    }
  } catch (e) {
    res.status(401).send(e);
  }
});
router.post("/api/users/signup", async (req, res) => {
  try {
    // const { email } = req.body;
    // const user = await User.findOne({ where: { email } });

    await User.create(req.body);

    res.send({ message: req.body.name + " was added!" });
  } catch (e) {
    res.status(401).send({ error: "User already exists!" });
  }
});
router.patch("/api/users/increment", async (req,res) => {
  const{isGames,isWins,user}=req.body
  console.log(' isGames,isWins,user',isGames,isWins,user);
  
  try {
     await User.update({
       numberOfGames:isGames?sequelize.literal('numberOfGames+1'):sequelize.literal('numberOfGames+0'),
      numberOfVictories:isWins?sequelize.literal('numberOfVictories+1'):sequelize.literal('numberOfVictories+0')},
      {where:{
        email:user.email
      }})
  } catch (error) {
    console.log(error);
    
  }
});

module.exports = router;
