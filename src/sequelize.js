const Sequelize = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT
  }
);
sequelize
  .authenticate()
  .then(() => {
    console.log("Connection has been established successfully.");
  })
  .catch(err => {
    console.error("Unable to connect to the database:", err);
  });
const User = sequelize.define(
  "user",
  {
    // attributes
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      primaryKey: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    numberOfGames: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    numberOfVictories: {
      type: Sequelize.INTEGER,
      defaultValue: 0
    },
    token: {
      type: Sequelize.STRING
    }
  },
  {
    timestamps: false
  }
);
module.exports={
    User,
    sequelize
}
