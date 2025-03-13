// NR: refactored 2025-03-13
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
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    shirtNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "playerContracts",
    timestamps: false,
  }
);

module.exports = PlayerContract;
