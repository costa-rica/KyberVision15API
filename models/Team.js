// NR: refactored 2025-02-08
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Team = sequelize.define(
  "Team",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    teamName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "team_name",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    coachName: {
      type: DataTypes.STRING,
      allowNull: false,
      field: "coach_name",
    },
  },
  {
    tableName: "teams",
  }
);

module.exports = Team;
