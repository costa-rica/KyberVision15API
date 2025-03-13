// NR: refactored 2025-03-13
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
    },
    scoreTeamAnalyzed: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    scoreTeamOther: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    rotation: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isIn: [["P1", "P2", "P3", "P4", "P5", "P6"]],
      },
    },
  },
  {
    tableName: "points",
    timestamps: false,
  }
);

module.exports = Point;
