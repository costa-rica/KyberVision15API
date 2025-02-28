const Player = require("../models/Player");
const { Op } = require("sequelize");
/**
 * Function to check if a player with the same firstName, lastName, and birthDate (only date, ignoring time) exists
 */
async function isPlayerDuplicate(firstName, lastName, birthDate) {
  // Convert birthDate string ("YYYY-MM-DD") into a Date object
  const birthDateStart = new Date(birthDate);
  birthDateStart.setHours(0, 0, 0, 0); // Normalize to start of the day

  const birthDateEnd = new Date(birthDate);
  birthDateEnd.setHours(23, 59, 59, 999); // Normalize to end of the day

  // Check if a player exists with the same firstName, lastName, and birthDate within that day
  return await Player.findOne({
    where: {
      firstName,
      lastName,
      birthDate: {
        [Op.between]: [birthDateStart, birthDateEnd], // Check within the date range
      },
    },
  });
}

module.exports = {
  isPlayerDuplicate,
};
