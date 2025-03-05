const Player = require("./Player");
const PlayerContract = require("./PlayerContract");
const Team = require("./Team");

// Define associations **after** models are imported
Player.hasMany(PlayerContract, { foreignKey: "playerId", onDelete: "CASCADE" });
Team.hasMany(PlayerContract, { foreignKey: "teamId", onDelete: "CASCADE" });
PlayerContract.belongsTo(Player, { foreignKey: "playerId" });
PlayerContract.belongsTo(Team, { foreignKey: "teamId" });

console.log("✅ Associations have been set up");
