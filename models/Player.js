// Modifed 2025-03-05
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Player = sequelize.define(
  "Player",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "first_name",
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "last_name",
    },
    birthDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "birth_date",
    },
  },
  {
    tableName: "players",
    timestamps: false,
  }
);

module.exports = Player;
