const express = require("express");
const router = express.Router();
const SyncContract = require("../models/SyncContract");
const Video = require("../models/Video");
const Script = require("../models/Script");
const { authenticateToken } = require("../middleware/auth");
// const { checkBodyReturnMissing } = require("../modules/common");
//? GET all SyncContracts
router.get("/", authenticateToken, async (req, res) => {
  try {
    const sync_contracts = await SyncContract.findAll();
    res.status(200).json(sync_contracts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//? Route pour modifier le Delta_Time d'un SyncContract
router.put("/:id", authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { Delta_Time } = req.body;
    if (Delta_Time === undefined) {
      return res.status(400).json({ error: "Delta_Time est requis." });
    }
    const [updated] = await SyncContract.update(
      { Delta_Time },
      { where: { id } }
    );
    if (!updated) {
      return res.status(404).json({ error: "SyncContract non trouvé." });
    }
    const updatedSyncContract = await SyncContract.findByPk(id);
    res.status(200).json(updatedSyncContract);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 🔹 Update SyncContract deltaTime with default (POST /sync-contracts/update-delta-with-default/:syncContractId)
router.post(
  "/update-delta-with-default/:syncContractId",
  authenticateToken,
  async (req, res) => {
    try {
      const { syncContractId } = req.params;
      const syncContract = await SyncContract.findByPk(syncContractId);
      const script = await Script.findByPk(syncContract.scriptId);
      const video = await Video.findByPk(syncContract.videoId);
      if (!syncContract) {
        return res.status(404).json({ error: "SyncContract non trouvé." });
      }
      if (!script) {
        return res.status(404).json({ error: "Script non trouvé." });
      }
      // console.log(script);
      console.log(
        `script.createdAt: ${script.createdAt}, video.videoFileCreatedDateTimeEstimate: ${video.videoFileCreatedDateTimeEstimate}`
      );

      const deltaTime =
        (script.createdAt - video.videoFileCreatedDateTimeEstimate) / 1000;

      console.log(`deltaTime: ${deltaTime}`);
      await syncContract.update({ deltaTime });
      res.status(200).json({ message: "Delta_Time mis à jour." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// 🔹 Update SyncContract deltaTime with manual (POST /sync-contracts/update-delta/:syncContractId)
router.post(
  "/update-delta/:syncContractId",
  authenticateToken,
  async (req, res) => {
    const { deltaTime } = req.body;
    try {
      const { syncContractId } = req.params;
      const syncContract = await SyncContract.findByPk(syncContractId);
      // const script = await Script.findByPk(syncContract.scriptId);
      // const video = await Video.findByPk(syncContract.videoId);
      if (!syncContract) {
        return res.status(404).json({ error: "SyncContract non trouvé." });
      }
      // if (!script) {
      //   return res.status(404).json({ error: "Script non trouvé." });
      // }

      // console.log(`deltaTime: ${deltaTime}`);
      await syncContract.update({ deltaTime });
      res.status(200).json({ message: "Delta_Time mis à jour." });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

module.exports = router;
