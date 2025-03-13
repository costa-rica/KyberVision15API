// NR: refactored 2025-03-13
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const OpponentServeTimestamp = sequelize.define(
  "OpponentServeTimestamp",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    actionId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    timestampServiceOpp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    serveType: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: "opponentServeTimestamps",
    timestamps: false,
  }
);

module.exports = OpponentServeTimestamp;
