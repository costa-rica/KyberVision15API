const express = require("express");
const Player = require("../models/Player");
const { authenticateToken } = require("../middleware/auth");
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

// router.post("/create", authenticateToken, async (req, res) => {
//   console.log("- accessed POST /team/create_league");

//   const checkBodyObj = checkBodyReturnMissing(req.body, [
//     "firstName",
//     "lastName",
//     "birthDate",
//   ]);
//   if (!checkBodyObj.isValid) {
//     return res.status(401).json({
//       result: false,
//       error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
//     });
//   }

//   const { firstName, lastName, birthDate } = req.body;

//   const newPlayer = await Player.create({
//     firstName,
//     lastName,
//     birthDate,
//   });
//   res.json({ result: true, message: "Player created successfully" });
// });

module.exports = router;
