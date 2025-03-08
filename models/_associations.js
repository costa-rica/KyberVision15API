const Player = require("./Player");
const PlayerContract = require("./PlayerContract");
const Team = require("./Team");
const Match = require("./Match");

// Define associations **after** models are imported
Player.hasMany(PlayerContract, { foreignKey: "playerId", onDelete: "CASCADE" });
Team.hasMany(PlayerContract, { foreignKey: "teamId", onDelete: "CASCADE" });
PlayerContract.belongsTo(Player, { foreignKey: "playerId" });
PlayerContract.belongsTo(Team, { foreignKey: "teamId" });

// 🔹 Match & Team Associations
Match.belongsTo(Team, { foreignKey: "teamIdAnalyzed", as: "teamOne" }); // Team analyzed
Match.belongsTo(Team, { foreignKey: "teamIdOpponent", as: "teamTwo" }); // Team opponent

console.log("✅ Associations have been set up");
