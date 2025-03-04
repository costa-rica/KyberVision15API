// NR: refactored 2025-02-08
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const CompetitionContract = sequelize.define(
  "CompetitionContract",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leagueId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "league_id",
    },
    teamId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id",
    },
  },
  {
    tableName: "competition_contracts",
    timestamps: false,
  }
);

module.exports = CompetitionContract;
