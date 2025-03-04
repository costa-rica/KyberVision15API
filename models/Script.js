// NR: refactored 2025-02-08
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Script = sequelize.define(
  "Script",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    matchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "match_id",
    },
    date: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    lastAccessDate: {
      type: DataTypes.DATE,
      allowNull: true,
      field: "last_access_date",
    },
  },
  {
    tableName: "scripts",
    timestamps: false,
  }
);

module.exports = Script;
