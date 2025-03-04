// NR: refactored 2025-02-08
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const SyncContract = sequelize.define(
  "SyncContract",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    scriptId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      field: "script_id",
    },
    videoId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      field: "video_id",
    },
    deltaTime: {
      type: DataTypes.FLOAT,
      allowNull: true,
      field: "delta_time",
    },
  },
  {
    tableName: "sync_contracts",
    timestamps: false,
  }
);

module.exports = SyncContract;
