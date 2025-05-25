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
const express = require("express");
const router = express.Router();
const { authenticateToken } = require("../modules/userAuthentication");

// POST groups/create/:teamId
router.post("/create/:teamId", authenticateToken, async (req, res) => {
  try {
    const teamId = req.params.teamId;
    const userId = req.user.id;
    const { isSuperUser, isAdmin, isCoach } = req.body;
    // create or modify group contract
    const [group, created] = await GroupContract.upsert(
      { userId, teamId, isSuperUser, isAdmin, isCoach },
      { returning: true }
    );
    // res.status(201).json(group);
    res.status(created ? 201 : 200).json({
      message: created
        ? "Groupe créé avec succès"
        : "Groupe modifié avec succès",
      group,
    });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la création du groupe",
      details: error.message,
    });
  }
});

// GET /groups
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    // const groups = await GroupContract.findAll({ where: { userId } });
    const groupContracts = await GroupContract.findAll({
      where: { userId },
      include: {
        model: Team,
        attributes: ["id", "teamName", "city", "coachName"], // specify fields you want
      },
    });

    // const teamsArray = groupContracts.map((gc) => gc.Team);
    const teamsArray = await Promise.all(
      groupContracts.map(async (gc) => {
        const team = gc.Team.toJSON(); // convert to plain object
        const practiceMatch = await Match.findOne({
          where: {
            teamIdAnalyzed: team.id,
            teamIdOpponent: team.id,
            city: "practice",
          },
          order: [["matchDate", "DESC"]],
        });
        team.practiceMatch = practiceMatch;
        return team;
      })
    );

    res.status(200).json({ teamsArray });
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des groupes",
      details: error.message,
    });
  }
});

module.exports = router;
