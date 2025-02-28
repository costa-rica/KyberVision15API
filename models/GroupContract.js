//NR: refactored 2025-02-08
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const GroupContract = sequelize.define("GroupContract", {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "user_id",
  },
  teamId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: "team_id",
  },
  rightsFlags: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    field: "rights_flags",
  },
});

module.exports = GroupContract;
