const express = require("express");
// const Player = require("kybervision15db");
// const PlayerContract = require("kybervision15db");
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

router.post("/update-or-create", authenticateToken, async (req, res) => {
  console.log("- accessed POST /player-contracts/update-or-create");
  const checkBodyObj = checkBodyReturnMissing(req.body, [
    "playerId",
    "teamId",
    "shirtNumber",
  ]);
  if (!checkBodyObj.isValid) {
    return res.status(400).json({
      result: false,
      error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
    });
  }

  try {
    const { id, playerId, teamId, shirtNumber } = req.body;

    if (id) {
      // Update PlayerContract if ID is provided
      const playerContractToUpdate = await PlayerContract.findByPk(id);

      if (!playerContractToUpdate) {
        return res.status(404).json({ error: "PlayerContract not found" });
      }

      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
          updatedFields[key] = req.body[key];
        }
      });

      await playerContractToUpdate.update(updatedFields);
      return res
        .status(200)
        .json({ result: true, playerContract: playerContractToUpdate });
    }

    // Check for duplicate PlayerContract before creating a new one
    const existingPlayerContract = await PlayerContract.findOne({
      where: { playerId, teamId, shirtNumber },
    });

    if (existingPlayerContract) {
      return res.status(400).json({
        error: "This player already exists",
      });
    }

    const newPlayerContract = await PlayerContract.create({
      playerId,
      teamId,
      shirtNumber,
    });

    return res
      .status(201)
      .json({ result: true, playerContract: newPlayerContract });
  } catch (error) {
    console.error("Error in /update-or-create route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:playerContractId", authenticateToken, async (req, res) => {
  try {
    const { playerContractId } = req.params;

    // const { success, message, error } = await deleteLeague(leagueId);
    const playerContract = await PlayerContract.findByPk(playerContractId);
    if (!playerContract) {
      return res.status(404).json({ error: "PlayerContract not found" });
    }

    await playerContract.destroy();

    res.status(200).json({ message: "PlayerContract deleted successfully" });
  } catch (error) {
    console.error(
      "Error in DELETE /player-contracts/:playerContractId:",
      error
    );
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
