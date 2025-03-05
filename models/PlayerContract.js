// NR: refactored 2025-03-05
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const PlayerContract = sequelize.define(
  "PlayerContract",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "player_id",
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id",
    },
    shirtNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "shirt_number",
    },
  },
  {
    tableName: "player_contracts",
    timestamps: false,
  }
);

module.exports = PlayerContract;
