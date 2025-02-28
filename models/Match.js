const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Match = sequelize.define(
  "Match",
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
    teamIdAnalyzed: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "team_id_analyzed",
    },
    teamIdOpponent: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "team_id_opponent",
    },
    teamIdWinner: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "team_id_winner",
    },
    GroupId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    matchDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      field: "match_date",
    },
    city: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    tableName: "Match",
    underscored: false,
  }
);

module.exports = Match;
// // // NR: refactored 2025-02-08
// const { DataTypes } = require("sequelize");
// const sequelize = require("./_connection");

// const Match = sequelize.define(
//   "Match",
//   {
//     id: {
//       type: DataTypes.INTEGER,
//       autoIncrement: true,
//       primaryKey: true,
//     },
//     leagueId: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     teamIdAnalyzed: {
//       type: DataTypes.INTEGER,
//       allowNull: false,
//     },
//     teamIdOpponent: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//     },
//     teamIdWinner: {
//       type: DataTypes.INTEGER,
//       allowNull: true,
//     },
//     matchDate: {
//       type: DataTypes.DATEONLY,
//       allowNull: false,
//     },
//     city: {
//       type: DataTypes.STRING,
//       allowNull: false,
//     },
//   },
//   {
//     tableName: "Match",
//     underscored: false, // Ensures the DB columns use camelCase
//   }
// );

// module.exports = Match;
