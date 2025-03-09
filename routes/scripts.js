const express = require("express");
const router = express.Router();
// const { Script, Action, SyncContract } = require('../models');
const Script = require("../models/Script");
const Action = require("../models/Action");
const SyncContract = require("../models/SyncContract");

const { authenticateToken } = require("../middleware/auth");
const { checkBodyReturnMissing } = require("../modules/common");

//? GET all Scripts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const scripts = await Script.findAll({
      include: [{ model: SyncContract, as: "SyncContracts" }],
    });
    res.status(200).json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? GET a single Script by ID
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const script = await Script.findByPk(req.params.id, {
      include: [{ model: SyncContract, as: "SyncContracts" }],
    });
    if (!script)
      return res.status(404).json({ error: "Script by ID not found" });
    res.status(200).json(script);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? GET Scripts by Match_ID
router.get("/match/:matchId", authenticateToken, async (req, res) => {
  try {
    const { matchId } = req.params;
    const scripts = await Script.findAll({
      where: { Match_ID: matchId },
      include: [{ model: SyncContract, as: "SyncContracts" }],
    });
    if (scripts.length === 0)
      return res.status(404).json({ error: "No scripts found" });
    res.status(200).json(scripts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? POST a new Script
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { Match_ID, Date, Last_Access_Date } = req.body;
    const newScript = await Script.create({ Match_ID, Date, Last_Access_Date });
    res.status(201).json(newScript);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//? PUT update a Script by ID
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await Script.update(req.body, { where: { id } });
    if (!updated[0]) return res.status(404).json({ error: "Script not found" });
    const updatedScript = await Script.findByPk(id);
    res.status(200).json(updatedScript);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//? DELETE a Script by ID
router.delete("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Script.destroy({ where: { id } });
    if (!deleted) return res.status(404).json({ error: "Script not found" });
    res.status(204).end();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? Route pour récupérer les SyncContracts d'un Script
router.get("/:id/sync-contracts", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const script = await Script.findByPk(id, {
      include: [{ model: SyncContract, as: "SyncContracts" }],
    });
    if (!script) {
      return res.status(404).json({ error: "Script not found" });
    }
    res.status(200).json(script.SyncContracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? Route pour récupérer les actions en fonction d'un Script_ID
router.get("/script/:scriptId", authenticateToken, async (req, res) => {
  const { scriptId } = req.params;
  try {
    const actions = await Action.findAll({
      include: {
        model: SyncContract,
        where: { Script_ID: scriptId },
      },
    });
    res.status(200).json(actions);
  } catch (error) {
    res.status(500).json({
      error: "Erreur lors de la récupération des actions pour le Script_ID, ",
      scriptId,
      details: error.message,
    });
  }
});

// #########################################################
// -----  Routes created specfically for Mobile -----------
// #########################################################
router.post("/receive-actions-array", authenticateToken, async (req, res) => {
  console.log("- accessed POST /scripts/receive-actions-array");
  const user = req.user;
  const checkBodyObj = checkBodyReturnMissing(req.body, [
    "actionsArray",
    "matchId",
  ]);
  if (!checkBodyObj.isValid) {
    return res.status(400).json({
      result: false,
      error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
    });
  }

  const { actionsArray, matchId } = req.body;

  try {
    // Create a new script
    const newScript = await Script.create({ matchId });

    // Create SyncContract
    const newSyncContract = await SyncContract.create({
      scriptId: newScript.id,
    });

    // Create actions
    await Promise.all(
      actionsArray.map((elem, index) => {
        const actionObj = {
          ...elem,
          zone: 1,
          syncContractId: newSyncContract.id,
        };
        const newAction = Action.create({ ...actionObj });
      })
    );
    console.log(`actionsArray[0]`);
    console.log(JSON.stringify(actionsArray[0]));
    console.log(actionsArray[0].timestamp);
    console.log(typeof actionsArray[0].timestamp);

    res.json({
      result: true,
      message: `Actions for scriptId: ${newScript.id}, syncContractId: ${newSyncContract.id}`,
    });
  } catch (error) {
    console.error("Error in /receive-actions-array:", error);
    res.status(500).json({ result: false, error: "Internal Server Error" });
  }
});

router.get("/send-actions", authenticateToken, async (req, res) => {
  // 1. Get script syncContract row delta time
  // 2. create actionsArray from actions scriptId
  // 3. create a difference between script.date - video
  // 3. for each action in actionsArray, create a timestampeModified property that is timestamp - syncContract.delta_time
});

module.exports = router;
