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
} = require("kybervision14db");

// Accepts an array of action objects and a deltaTime (in seconds)
// Returns the estimated start of video timestamp
// Why: mobile device on selection of Match to Review (i.e ReviewMatchSelection.js)
function createEstimatedTimestampStartOfVideo(actions, deltaTime) {
  if (!Array.isArray(actions) || actions.length === 0) {
    return null;
  }

  // Ensure actions are sorted by timestamp (ASC)
  const sortedActions = [...actions].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // First recorded action timestamp as a Date object
  const firstActionTimestamp = new Date(sortedActions[0].timestamp);

  // Subtract deltaTime (convert seconds to milliseconds)
  const estimatedStartOfVideo = new Date(
    firstActionTimestamp.getTime() - deltaTime * 1000
  );

  return estimatedStartOfVideo;
}

async function updateSyncContractsWithVideoId(videoId, matchId) {
  const scripts = await Script.findAll({
    where: { matchId },
  });

  if (scripts.length === 0) {
    console.log(`⚠️ No scripts found for matchId: ${matchId}`);
  } else {
    console.log(`📜 Found ${scripts.length} script(s) for matchId: ${matchId}`);
  }

  let syncContractUpdates = 0;

  // Step 5: Loop through all scripts and update SyncContracts
  for (const script of scripts) {
    const syncContracts = await SyncContract.findAll({
      where: { scriptId: script.id },
    });

    if (syncContracts.length > 0) {
      console.log(
        `🔄 Updating ${syncContracts.length} SyncContract(s) for scriptId: ${script.id}`
      );

      for (const syncContract of syncContracts) {
        await syncContract.update({ videoId });
        syncContractUpdates++;
      }
    } else {
      console.log(`⚠️ No SyncContracts found for scriptId: ${script.id}`);
    }
  }

  return syncContractUpdates;
}

module.exports = {
  createEstimatedTimestampStartOfVideo,
  updateSyncContractsWithVideoId,
};
