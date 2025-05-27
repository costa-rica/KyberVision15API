const { Team, League, CompetitionContract, Match } = require("kybervision15db");

async function createNewTeam(teamName, city, coachName, leagueId) {
  try {
    const existingTeam = await Team.findOne({
      where: { teamName },
    });

    if (existingTeam) {
      console.log(`ℹ️  Team ${teamName} already exists. Skipping setup.`);
      return;
    }

    const team = await Team.create({
      teamName,
      city,
      coachName,
    });

    if (!leagueId) {
      const leagueFreeAgents = await League.findOne({
        where: { name: "Free Agent League" },
      });
      leagueId = leagueFreeAgents.id;
    }

    const competitionContract = await CompetitionContract.create({
      leagueId,
      teamId: team.id,
    });

    // Create practice match
    await Match.create({
      teamIdAnalyzed: team.id,
      teamIdOpponent: team.id,
      matchDate: new Date().toISOString().split("T")[0],
      leagueId,
      teamIdWinner: null,
      competitionContractId: competitionContract.id,
      city: "Practice",
    });

    console.log(`✅ Team ${teamName} created.`);
  } catch (err) {
    console.error(`❌ Error creating team ${teamName}:`, err);
  }
}

module.exports = {
  createNewTeam,
};
