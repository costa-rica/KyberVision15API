const express = require("express");
// const Player = require("kybervision15db");
// const PlayerContract = require("kybervision15db");
// const Team = require("kybervision15db");
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
const { authenticateToken } = require("../modules/userAuthentication");
const { checkBodyReturnMissing } = require("../modules/common");
const router = express.Router();
const { isPlayerDuplicate } = require("../modules/players");

router.get("/", authenticateToken, async (req, res) => {
  const players = await Player.findAll();
  res.status(200).json(players);
});

router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  const player = await Player.findByPk(id);
  if (!player) {
    return res.status(404).json({ error: "Utilisateur non trouvé." });
  }
  res.status(200).json(player);
});

// #########################################################
// -----  Routes created specfically for Mobile -----------
// #########################################################

router.post("/create", authenticateToken, async (req, res) => {
  console.log("- accessed POST /team/create_league");

  const checkBodyObj = checkBodyReturnMissing(req.body, [
    "firstName",
    "lastName",
    "birthDate",
  ]);
  if (!checkBodyObj.isValid) {
    return res.status(400).json({
      result: false,
      error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
    });
  }

  const { firstName, lastName, birthDate } = req.body;

  try {
    // Use helper function to check for duplicates
    const existingPlayer = await isPlayerDuplicate(
      firstName,
      lastName,
      birthDate
    );

    if (existingPlayer) {
      return res.status(409).json({
        result: false,
        error: "Player already exists in the database",
      });
    }

    // Create the new player if they don't exist
    const newPlayer = await Player.create({ firstName, lastName, birthDate });

    return res.json({ result: true, message: "Player created successfully" });
  } catch (error) {
    console.error("Error creating player:", error);
    return res.status(500).json({
      result: false,
      error: "Internal server error",
    });
  }
});

router.post("/update-or-create", authenticateToken, async (req, res) => {
  try {
    const { id, firstName, lastName, birthDate } = req.body;

    if (id) {
      // Update Player if ID is provided
      const playerToUpdate = await Player.findByPk(id);

      if (!playerToUpdate) {
        return res.status(404).json({ error: "Player not found" });
      }

      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
          updatedFields[key] = req.body[key];
        }
      });

      await playerToUpdate.update(updatedFields);
      return res.status(200).json({ result: true, player: playerToUpdate });
    }

    // Check for duplicate Player before creating a new one
    const existingPlayer = await Player.findOne({
      where: { firstName, lastName, birthDate },
    });

    if (existingPlayer) {
      return res.status(400).json({
        error: "This player already exists",
      });
    }

    if (!firstName || !lastName) {
      return res.status(400).json({
        result: false,
        error: "Missing required fields: firstName, lastName",
      });
    }

    const newPlayer = await Player.create({ firstName, lastName, birthDate });

    return res.status(201).json({ result: true, player: newPlayer });
  } catch (error) {
    console.error("Error in /update-or-create route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:playerId", authenticateToken, async (req, res) => {
  try {
    const { playerId } = req.params;

    // const { success, message, error } = await deleteLeague(leagueId);
    const player = await Player.findByPk(playerId);
    if (!player) {
      return res.status(404).json({ error: "Player not found" });
    }

    await player.destroy();
    res.status(200).json({ message: "Player deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /players/:playerId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/team/:teamId", authenticateToken, async (req, res) => {
  console.log("- accessed GET /players/team/:teamId");

  const players = await Player.findAll({
    include: {
      model: PlayerContract,
      where: { teamId: req.params.teamId },
      attributes: ["id", "teamId", "playerId", "shirtNumber"], // Include PlayerContract fields
    },
  });
  console.log(`req.params.teamId: ${req.params.teamId}`);
  const team = await Team.findByPk(req.params.teamId);
  console.log(team.teamName);
  // console.log(team);

  let playersArray = [];
  if (players) {
    let playerArrayObj = {};
    console.log(`- we have players`);
    players.map((player) => {
      // console.log(player.get({ plain: true }));
      playerArrayObj = {
        id: player.id,
        firstName: player.firstName,
        lastName: player.lastName,
        birthDate: player.birthDate,
        shirtNumber: player.PlayerContracts[0].shirtNumber,
      };
      playersArray.push(playerArrayObj);
    });
  } else {
    console.log(`- no players found`);
  }

  // console.log(playersArray);
  res.json({ result: true, team, players: playersArray });
});

module.exports = router;
