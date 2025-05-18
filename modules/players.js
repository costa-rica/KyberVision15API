const {
  sequelize,
  User,
  Video,
  Action,
  CompetitionContract,
  Complex,
  GroupContract,
  League,
  Match,
  OpponentServeTimestamp,
  Player,
  PlayerContract,
  Point,
  Script,
  SyncContract,
  Team,
} = require("kybervision15db");
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

// function modifyArrayReplacePlayerIdWithPlayerObject(array) {
//   return array.map((item) => {
//     return {
//       ...item,
//       playerId: Player.findByPk(item.playerId),
//     };
//   });
// }

async function createUniquePlayerObjArray(actions) {
  try {
    // 🔹 Extract unique player IDs
    const uniquePlayerIds = [
      ...new Set(actions.map((action) => action.playerId)),
    ];

    if (uniquePlayerIds.length === 0) {
      return []; // Return empty array if no players are found
    }

    // 🔹 Query the Player table for their full objects
    const players = await Player.findAll({
      where: { id: uniquePlayerIds },
      attributes: ["id", "firstName", "lastName", "birthDate"], // Adjust attributes as needed
    });

    return players; // Return full player objects
  } catch (error) {
    console.error("Error fetching unique player objects:", error);
    throw new Error("Failed to fetch unique player objects.");
  }
}

async function createUniquePlayerNamesArray(actions) {
  try {
    // 🔹 Extract unique player IDs
    const uniquePlayerIds = [
      ...new Set(actions.map((action) => action.playerId)),
    ];

    if (uniquePlayerIds.length === 0) {
      return []; // Return empty array if no players are found
    }

    // 🔹 Query the Player table for their first names
    const players = await Player.findAll({
      where: { id: uniquePlayerIds },
      attributes: ["firstName"], // Only retrieve the firstName column
    });

    // 🔹 Extract first names and ensure uniqueness
    const uniquePlayerNames = [
      ...new Set(players.map((player) => player.firstName)),
    ];

    return uniquePlayerNames;
  } catch (error) {
    console.error("Error fetching unique player names:", error);
    throw new Error("Failed to fetch unique player names.");
  }
}

module.exports = {
  isPlayerDuplicate,
  // modifyArrayReplacePlayerIdWithPlayerObject,
  createUniquePlayerNamesArray,
  createUniquePlayerObjArray,
};
