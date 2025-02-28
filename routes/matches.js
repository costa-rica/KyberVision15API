const express = require("express");
const Script = require("../models/Script");
const Match = require("../models/Match");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const { createMatch, deleteMatch } = require("../modules/match");

//GET / - Retrieve all matches

router.get("/", authenticateToken, async (req, res) => {
  try {
    const matches = await Match.findAll();
    res.status(200).json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /create - Create a new match

router.post("/create", authenticateToken, async (req, res) => {
  try {
    const {
      leagueId,
      teamIdAnalyzed,
      teamIdOpponent,
      teamIdWinner,
      matchDate,
      city,
    } = req.body;

    // Validate required fields
    if (!leagueId || !teamIdAnalyzed || !matchDate || !city) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { success, match, error } = await createMatch({
      leagueId,
      teamIdAnalyzed,
      teamIdOpponent,
      teamIdWinner,
      matchDate,
      city,
    });

    if (!success) {
      return res.status(500).json({ error });
    }

    res.status(201).json(match);
  } catch (error) {
    console.error("Error in /create route:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * DELETE /:matchId - Delete a match by ID
 */
router.delete("/:matchId", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;

    const { success, message, error } = await deleteMatch(matchId);

    if (!success) {
      return res.status(404).json({ error });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error("Error in DELETE /matches/:matchId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/:scriptId", authenticateToken, async (req, res) => {
  try {
    const scriptId = req.params.scriptId;

    const script = await Script.findOne({
      where: { id: scriptId },
      include: [
        {
          model: Match,
          required: true,
        },
      ],
    });

    if (!script) {
      return res.status(404).json({ error: "Script non trouvé" });
    }

    const match = script.Match;
    res.status(200).json(match);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur interne du serveur" });
  }
});

//? Route pour associer un match à un GroupContract
router.post('/:matchId/groupcontract/:groupContractId', authenticateToken, async (req, res) => {
  try {
    const matchId = req.params.matchId;
    const groupContractId = req.params.groupContractId;

    const match = await Match.findOne({
      where: { id: matchId },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match non trouvé' });
    }

    const groupContract = await GroupContract.findOne({
      where: { id: groupContractId },
    });

    if (!groupContract) {
      return res.status(404).json({ error: 'GroupContract non trouvé' });
    }

    match.Group_ID = groupContract.id;
    await match.save();

    res.status(200).json({ message: 'Match associé au GroupContract avec succès', match });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur interne du serveur' });
  }
});

module.exports = router;
