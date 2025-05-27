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

async function createMatchWithFreeAgentLeague(teamId) {
  try {
    const freeAgentLeague = await League.findOne({
      where: { name: "Free Agent League" },
    });

    if (!freeAgentLeague) {
      console.log("ℹ️  Free Agent league not found. Skipping setup.");
      return;
    }
    const competitionContract = await CompetitionContract.create({
      leagueId: freeAgentLeague.id,
      teamId: teamId,
    });

    const match = await Match.create({
      leagueId: freeAgentLeague.id,
      teamIdAnalyzed: teamId,
      teamIdOpponent: teamId,
      teamIdWinner: teamId,
      competitionContractId: competitionContract.id,
      city: "Practice",
      matchDate: new Date().toISOString().split("T")[0],
    });

    console.log(`✅ Match created with Free Agent league.`);
  } catch (err) {
    console.error(`❌ Error creating match with Free Agent league:`, err);
  }
}

const createMatch = async (matchData) => {
  try {
    const match = await Match.create(matchData);
    return { success: true, match };
  } catch (error) {
    console.error("Error creating match:", error);
    return { success: false, error: error.message };
  }
};

const deleteMatch = async (matchId) => {
  try {
    const match = await Match.findByPk(matchId);
    if (!match) {
      return { success: false, error: "Match not found" };
    }

    await match.destroy();
    return { success: true, message: "Match deleted successfully" };
  } catch (error) {
    console.error("Error deleting match:", error);
    return { success: false, error: error.message };
  }
};

const getMatchWithTeams = async (matchId) => {
  try {
    // Fetch match with team details
    const match = await Match.findOne({
      where: { id: matchId },
      include: [
        {
          model: Team,
          as: "teamOne",
          attributes: ["id", "teamName", "city", "coachName"], // Only team fields
          required: true,
          foreignKey: "teamIdAnalyzed",
        },
        {
          model: Team,
          as: "teamTwo",
          attributes: ["id", "teamName", "city", "coachName"], // Only team fields
          required: false,
          foreignKey: "teamIdOpponent",
        },
      ],
      attributes: {
        exclude: ["teamIdAnalyzed", "teamIdOpponent"], // Exclude these fields from match details
      },
    });

    if (!match) {
      return { success: false, error: "Match not found" };
    }

    // Rename team attributes by prefixing them
    const formattedMatch = {
      ...match.get(),
      teamOneId: match.teamOne?.id,
      teamOneName: match.teamOne?.teamName,
      teamOneCity: match.teamOne?.city,
      teamOneCoach: match.teamOne?.coachName,

      teamTwoId: match.teamTwo?.id,
      teamTwoName: match.teamTwo?.teamName,
      teamTwoCity: match.teamTwo?.city,
      teamTwoCoach: match.teamTwo?.coachName,
    };

    // Remove the nested team objects
    delete formattedMatch.teamOne;
    delete formattedMatch.teamTwo;

    return { success: true, match: formattedMatch };
  } catch (error) {
    console.error("Error fetching match with teams:", error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  createMatchWithFreeAgentLeague,
  createMatch,
  deleteMatch,
  getMatchWithTeams,
};
