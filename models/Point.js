// NR: refactored 2025-03-04
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Point = sequelize.define(
  "Point",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    setNumber: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5,
      },
      field: "set_number",
    },
    scoreTeamAnalyzed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "score_team_analyzed",
    },
    scoreTeamOther: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "score_team_other",
    },
    rotation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["P1", "P2", "P3", "P4", "P5", "P6"]],
      },
      field: "rotation",
    },
  },
  {
    tableName: "points",
    timestamps: false,
  }
);

module.exports = Point;
