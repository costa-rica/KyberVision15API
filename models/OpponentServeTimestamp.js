// NR: refactored 2025-03-04
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
      field: "action_id",
    },
    timestampServiceOpp: {
      type: DataTypes.DATE,
      allowNull: false,
      field: "timestamp_service_opp",
    },
    serveType: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "serve_type",
    },
  },
  {
    tableName: "opponent_serve_timestamps",
    timestamps: false,
  }
);

module.exports = OpponentServeTimestamp;
