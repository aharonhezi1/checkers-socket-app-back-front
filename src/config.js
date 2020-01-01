const express = require("express");
const app = express();
const http = require("http").Server(app);
const sequelizeModule = require("./sequelize");
const sequelize = sequelizeModule.sequelize;
const User = sequelizeModule.User;
const users = [];
const cors = require('cors')
const server = app.listen(process.env.PORT);




app.use(cors())
app.get("/api/config", (req, res) => {
    User.sync({ force: true }).then(() => {
        try {
             console.log('success')
           //  console.log("All users:", JSN.stringify(users, null, 4));
            res.status(200).send({"config":"success"});
        } catch (e) {
          console.log("eroor", e);
          res.status(400).send(e);
        }
      })
    })
      
