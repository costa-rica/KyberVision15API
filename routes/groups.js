// const { GroupContract, Match } = require('../models');
const GroupContract = require("../models/GroupContract");
const Match = require("../models/Match");
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');

const RIGHTS = {
  VALIDATE_GROUP_REQUEST: 1 << 0, // b0
  CREATE_REMOVE_PLAYER: 1 << 1,   // b1
  WRITE_ENABLED: 1 << 2,          // b2
};

//? Route pour récupérer tous les GroupContracts.
router.get(
  '/',
  authenticateToken,
  async (req, res) => {
    try {
      const group = await GroupContract.findAll();
      res.status(200).json(group);
    } catch (error) {
      res.status(500).json({ error: 'Erreur lors de la récupération des actions', details: error.message });
    }
  }
);

//? Route pour récupérer les matchs d'un utilisateur via ses GroupContracts
router.get('/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const groupContracts = await GroupContract.findAll({
      where: { User_ID: userId },
      attributes: ['id'],
    });

    const groupContractIds = groupContracts.map((group) => group.id);

    if (groupContractIds.length === 0) {
      return res.status(404).json({ message: "Aucun match trouvé pour cet utilisateur." });
    }

    const matches = await Match.findAll({
      where: {
        Group_ID: groupContractIds,
      },
    });

    res.status(200).json(matches);
  } catch (error) {
    console.error("Erreur lors de la récupération des matchs de l'utilisateur :", error);
    res.status(500).json({ message: 'Erreur interne du serveur.' });
  }
});

//? Route pour créer un GroupContract
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { userId, teamId, rights } = req.body;

    if (!userId || !teamId) {
      return res.status(400).json({ message: "userId et teamId sont requis." });
    }

    const rightsFlags = rights ?? (RIGHTS.VALIDATE_GROUP_REQUEST | RIGHTS.CREATE_REMOVE_PLAYER | RIGHTS.WRITE_ENABLED);

    const groupContract = await GroupContract.create({
      User_ID: userId,
      Team_ID: teamId,
      Rights_flags: rightsFlags,
    });

    res.status(201).json({
      message: "GroupContract créé avec succès.",
      groupContract,
    });
  } catch (error) {
    console.error("Erreur lors de la création du GroupContract :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});


module.exports = router;
