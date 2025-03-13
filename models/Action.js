// NR: refactored 2025-03-13
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Action = sequelize.define(
  "Action",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    complexId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    pointId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    syncContractId: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    playerId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    type: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subtype: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    quality: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    timestamp: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    zone: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "actions",
  }
);

module.exports = Action;
