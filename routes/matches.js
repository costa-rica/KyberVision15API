const express = require("express");
const Script = require("../models/Script");
const Match = require("../models/Match");
const SyncContract = require("../models/SyncContract");
const Action = require("../models/Action");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const { createMatch, deleteMatch } = require("../modules/match");
const { checkBodyReturnMissing } = require("../modules/common");
const { createEstimatedTimestampStartOfVideo } = require("../modules/scripts");
const {
  createUniquePlayerNamesArray,
  createUniquePlayerObjArray,
} = require("../modules/players");

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
      groupContractId,
      matchDate,
      city,
    } = req.body;

    // // Validate required fields
    // if (!leagueId || !teamIdAnalyzed || !matchDate || !city) {
    //   return res.status(400).json({ error: "Missing required fields" });
    // }

    const checkBodyObj = checkBodyReturnMissing(req.body, [
      "leagueId",
      "teamIdAnalyzed",
      "teamIdOpponent",
      "teamIdWinner",
      "groupContractId",
      "matchDate",
      "city",
    ]);
    if (!checkBodyObj.isValid) {
      return res.status(400).json({
        result: false,
        error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
      });
    }

    const { success, match, error } = await createMatch({
      leagueId,
      teamIdAnalyzed,
      teamIdOpponent,
      teamIdWinner,
      groupContractId,
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

//DELETE /:matchId - Delete a match by ID
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
router.post(
  "/:matchId/groupcontract/:groupContractId",
  authenticateToken,
  async (req, res) => {
    try {
      const matchId = req.params.matchId;
      const groupContractId = req.params.groupContractId;

      const match = await Match.findOne({
        where: { id: matchId },
      });

      if (!match) {
        return res.status(404).json({ error: "Match non trouvé" });
      }

      const groupContract = await GroupContract.findOne({
        where: { id: groupContractId },
      });

      if (!groupContract) {
        return res.status(404).json({ error: "GroupContract non trouvé" });
      }

      match.Group_ID = groupContract.id;
      await match.save();

      res
        .status(200)
        .json({ message: "Match associé au GroupContract avec succès", match });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Erreur interne du serveur" });
    }
  }
);

// #########################################################
// -----  Routes created specfically for Mobile -----------
// #########################################################
// 🔹 Update or create a match (POST /matches/update-or-create) (used for KV-Manager)
router.post("/update-or-create", authenticateToken, async (req, res) => {
  try {
    const {
      id,
      leagueId,
      teamIdAnalyzed,
      teamIdOpponent,
      teamIdWinner,
      groupContractId,
      matchDate,
      city,
    } = req.body;

    // If `id` is provided, attempt to update an existing match
    if (id) {
      const matchToUpdate = await Match.findByPk(id);

      if (!matchToUpdate) {
        return res.status(404).json({ error: "Match not found" });
      }

      // Only update non-null values from the request body
      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
          updatedFields[key] = req.body[key];
        }
      });

      await matchToUpdate.update(updatedFields);

      return res.status(200).json({ result: true, match: matchToUpdate });
    }

    // If no `id` is provided, check for duplicate match before creating a new one
    const existingMatch = await Match.findOne({
      where: {
        leagueId,
        teamIdAnalyzed,
        teamIdOpponent,
        teamIdWinner,
        groupContractId,
        matchDate,
        city,
      },
    });

    if (existingMatch) {
      return res.status(400).json({
        error: "This record already exists",
      });
    }
    // Create new match if no duplicate exists
    const { success, match, error } = await createMatch({
      leagueId,
      teamIdAnalyzed,
      teamIdOpponent,
      teamIdWinner,
      groupContractId,
      matchDate,
      city,
    });

    if (!success) {
      return res.status(500).json({ error });
    }

    return res.status(201).json({ result: true, match });
  } catch (error) {
    console.error("Error in /update-or-create route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 Get all actions for a match (GET /matches/:matchId/actions)
router.get("/:matchId/actions", authenticateToken, async (req, res) => {
  console.log(`- in GET /matches/${req.params.matchId}/actions`);

  try {
    const { matchId } = req.params;

    // 🔹 Find all Scripts linked to this matchId
    const scripts = await Script.findAll({
      where: { matchId },
      attributes: ["id"], // Only need script IDs
    });

    if (scripts.length === 0) {
      return res
        .status(404)
        .json({ result: false, message: "No actions found for this match." });
    }

    // Extract script IDs
    const scriptIds = scripts.map((script) => script.id);

    // 🔹 Find all SyncContracts associated with these Scripts
    const syncContracts = await SyncContract.findAll({
      where: { scriptId: scriptIds },
      attributes: ["id", "scriptId", "deltaTime"], // Need deltaTime per SyncContract
    });

    if (syncContracts.length === 0) {
      return res.status(404).json({
        result: false,
        message: "No sync contracts found for this match.",
      });
    }

    console.log(`✅ Found ${syncContracts.length} SyncContracts`);

    // Create a mapping of syncContractId → deltaTime
    const deltaTimeMap = {};
    syncContracts.forEach((sc) => {
      deltaTimeMap[sc.id] = sc.deltaTime || 0.0; // Default 0.0 if undefined
    });

    console.log(`📊 DeltaTime mapping:`, deltaTimeMap);

    // Extract syncContract IDs
    const syncContractIds = syncContracts.map((sc) => sc.id);

    // 🔹 Find all Actions linked to these SyncContracts
    const actions = await Action.findAll({
      where: { syncContractId: syncContractIds },
      order: [["timestamp", "ASC"]],
    });

    if (actions.length === 0) {
      return res.json({ result: true, actions: [] });
    }

    console.log(`✅ Found ${actions.length} actions`);

    // Compute estimated start of video timestamp per action’s SyncContract deltaTime
    const updatedActions = actions.map((action, index) => {
      const actionDeltaTime = deltaTimeMap[action.syncContractId] || 0.0; // Get deltaTime per action’s SyncContract
      const estimatedStartOfVideo = createEstimatedTimestampStartOfVideo(
        actions,
        actionDeltaTime
      );

      return {
        ...action.toJSON(),
        timestampFromStartOfVideo:
          (new Date(action.timestamp) - estimatedStartOfVideo) / 1000, // Convert ms to seconds
        reviewVideoActionsArrayIndex: index + 1, // Start indexing at 1
      };
    });

    console.log(
      `✅ Updated ${updatedActions.length} actions with correct deltaTimes`
    );

    const uniqueListOfPlayerNamesArray = await createUniquePlayerNamesArray(
      updatedActions
    );
    const uniqueListOfPlayerObjArray = await createUniquePlayerObjArray(
      updatedActions
    );

    res.json({
      result: true,
      actionsArray: updatedActions,
      playerNamesArray: uniqueListOfPlayerNamesArray,
      playerDbObjectsArray: uniqueListOfPlayerObjArray,
    });
  } catch (error) {
    console.error("❌ Error fetching actions for match:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// // 🔹 Get all actions for a match (GET /matches/:matchId/actions)
// router.get("/:matchId/actions", authenticateToken, async (req, res) => {
//   console.log(`- in GET /matches/${req.params.matchId}/actions`);

//   try {
//     const { matchId } = req.params;

//     // 🔹 Find all Scripts linked to this matchId
//     const scripts = await Script.findAll({
//       where: { matchId },
//       attributes: ["id"], // Only need script IDs
//     });

//     if (scripts.length === 0) {
//       return res
//         .status(404)
//         .json({ result: false, message: "No actions found for this match." });
//     }

//     // Extract script IDs
//     const scriptIds = scripts.map((script) => script.id);

//     // 🔹 Find all SyncContracts associated with these Scripts
//     const syncContracts = await SyncContract.findAll({
//       where: { scriptId: scriptIds },
//       attributes: ["id", "deltaTime"], // Need deltaTime now
//     });

//     if (syncContracts.length === 0) {
//       return res.status(404).json({
//         result: false,
//         message: "No sync contracts found for this match.",
//       });
//     }

//     // Extract syncContract IDs
//     const syncContractIds = syncContracts.map((sc) => sc.id);

//     // 🔹 Find all Actions linked to these SyncContracts
//     const actions = await Action.findAll({
//       where: { syncContractId: syncContractIds },
//       order: [["timestamp", "ASC"]],
//     });

//     if (actions.length === 0) {
//       return res.json({ result: true, actions: [] });
//     }

//     // Determine the syncContract deltaTime (assuming all contracts have the same deltaTime)
//     const deltaTime = syncContracts[0].deltaTime || 0.0;
//     // TODO: each sync contract delta time should apply to its corresponding actions

//     // Compute estimated start of video timestamp
//     const estimatedStartOfVideo = createEstimatedTimestampStartOfVideo(
//       actions,
//       deltaTime
//     );

//     // Attach timestampFromStartOfVideo to each action
//     const updatedActions = actions.map((action, index) => ({
//       ...action.toJSON(),
//       timestampFromStartOfVideo:
//         (new Date(action.timestamp) - estimatedStartOfVideo) / 1000, // Convert ms to seconds
//       reviewVideoActionsArrayIndex: index + 1, // Start indexing at 1
//     }));

//     const uniqueListOfPlayerNamesArray = await createUniquePlayerNamesArray(
//       updatedActions
//     );
//     const uniqueListOfPlayerObjArray = await createUniquePlayerObjArray(
//       updatedActions
//     );
//     // console.log(uniqueListOfPlayerObjArray);
//     res.json({
//       result: true,
//       actionsArray: updatedActions,
//       playerNamesArray: uniqueListOfPlayerNamesArray,
//       playerDbObjectsArray: uniqueListOfPlayerObjArray,
//     });
//   } catch (error) {
//     console.error("Error fetching actions for match:", error);
//     res.status(500).json({
//       result: false,
//       message: "Internal server error",
//       error: error.message,
//     });
//   }
// });

module.exports = router;
