// NR: refactored 2025-03-04
const { DataTypes } = require("sequelize");
const sequelize = require("./_connection");

const Complex = sequelize.define(
  "Complex",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        is: /^K.+/, // Ensures the string starts with "K"
      },
    },
  },
  {
    tableName: "complexes",
    timestamps: false,
  }
);

module.exports = Complex;
