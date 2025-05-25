const { User, Team, Match, League } = require("kybervision15db");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

async function onStartUpCreateEnvUsers() {
  if (!process.env.ADMIN_EMAIL_KV_MANAGER_WEBSITE) {
    console.warn("⚠️ No admin emails found in env variables.");
    return;
  }

  let adminEmails;
  try {
    adminEmails = JSON.parse(process.env.ADMIN_EMAIL_KV_MANAGER_WEBSITE);
    if (!Array.isArray(adminEmails)) throw new Error();
  } catch (error) {
    console.error(
      "❌ Error parsing ADMIN_EMAIL_KV_MANAGER_WEBSITE. Ensure it's a valid JSON array."
    );
    return;
  }

  for (const email of adminEmails) {
    try {
      const existingUser = await User.findOne({ where: { email } });

      if (!existingUser) {
        console.log(`🔹 Creating admin user: ${email}`);

        const hashedPassword = await bcrypt.hash("test", 10); // Default password, should be changed later.

        const newUser = await User.create({
          username: email.split("@")[0],
          email,
          password: hashedPassword,
          isAdminForKvManagerWebsite: true, // Set admin flag
        });

        // await GroupContract.create({
        //   userId: newUser.id,
        //   teamId: 1, // Assign to a default team if needed
        // });

        console.log(`✅ Admin user created: ${email}`);
      } else {
        console.log(`ℹ️  User already exists: ${email}`);
      }
    } catch (err) {
      console.error(`❌ Error creating admin user (${email}):`, err);
    }
  }
}

function createAppDirectories() {
  if (!fs.existsSync(process.env.PATH_VIDEOS)) {
    fs.mkdirSync(process.env.PATH_VIDEOS, { recursive: true });
  }
  if (!fs.existsSync(process.env.PATH_VIDEOS_UPLOAD03)) {
    fs.mkdirSync(process.env.PATH_VIDEOS_UPLOAD03, { recursive: true });
  }
}

async function onStartUpCreateTeamAndMatch() {
  try {
    const existingAnalyzedTeam = await Team.findOne({
      where: { teamName: "dummyAnalyzed" },
    });

    if (existingAnalyzedTeam) {
      console.log(
        "ℹ️  Dummy teams and match already initialized. Skipping setup."
      );
      return;
    }

    const [league, leagueCreated] = await League.findOrCreate({
      where: { name: "dummyLeague" },
      defaults: {
        category: "StartupCategory",
      },
    });

    const [teamAnalyzed] = await Team.findOrCreate({
      where: { teamName: "dummyAnalyzed" },
      defaults: {
        city: "TestCityA",
        coachName: "Coach A",
      },
    });

    const [teamOpponent] = await Team.findOrCreate({
      where: { teamName: "dummyOpponent" },
      defaults: {
        city: "TestCityB",
        coachName: "Coach B",
      },
    });

    await Match.findOrCreate({
      where: {
        teamIdAnalyzed: teamAnalyzed.id,
        teamIdOpponent: teamOpponent.id,
        matchDate: new Date().toISOString().split("T")[0],
      },
      defaults: {
        leagueId: league.id,
        teamIdWinner: null,
        groupContractId: null,
        city: "Startupville",
      },
    });

    console.log("✅ Dummy league, teams, and match created.");
  } catch (err) {
    console.error("❌ Error during dummy data setup:", err);
  }
}

async function onStartUpCreatePracticeMatch() {
  let practiceLeague = await League.findOne({
    where: { name: "practice" },
  });

  if (!practiceLeague) {
    practiceLeague = await League.create({
      name: "practice",
      category: "practice",
    });
  }

  let practiceMatchCount = 0;
  try {
    const allTeams = await Team.findAll();

    for (const currentTeam of allTeams) {
      const existingPracticeMatch = await Match.findOne({
        where: {
          teamIdAnalyzed: currentTeam.id,
          teamIdOpponent: currentTeam.id,
          city: "practice",
        },
      });

      if (!existingPracticeMatch) {
        await Match.create({
          teamIdAnalyzed: currentTeam.id,
          teamIdOpponent: currentTeam.id,
          matchDate: new Date().toISOString().split("T")[0],
          leagueId: practiceLeague.id,
          teamIdWinner: null,
          groupContractId: null,
          city: "practice",
        });
        console.log(
          `✅ Practice match created for team: ${currentTeam.teamName}`
        );
        practiceMatchCount++;
      }
    }
    if (practiceMatchCount === 0) {
      console.log(`ℹ️  All teams have practice matches.`);
    }
  } catch (err) {
    console.error("❌ Error creating practice matches:", err);
  }
}

module.exports = {
  onStartUpCreateEnvUsers,
  createAppDirectories,
  onStartUpCreateTeamAndMatch,
  onStartUpCreatePracticeMatch,
};
