const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");
const Match = require("./Match");

const Video = sequelize.define(
  "Video",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    matchId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Match,
        key: "id",
      },
      field: "match_id",
    },
    filename: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    url: {
      type: DataTypes.STRING,
    },
    videoFileCreatedDateTimeEstimate: {
      type: DataTypes.DATE,
      field: "video_file_created_date_time_estimate",
    },
    videoFileSizeInMb: {
      type: DataTypes.FLOAT,
      field: "video_file_size_in_mb",
    },
  },
  {
    tableName: "videos",
  }
);

module.exports = Video;
