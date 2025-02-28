const express = require("express");
const bcrypt = require("bcrypt");
// const { Team, GroupContract } = require('../models');
const Team = require("../models/Team");
const GroupContract = require("../models/GroupContract");
const League = require("../models/League");
const { authenticateToken } = require("../middleware/auth");
const { checkBodyReturnMissing } = require("../modules/common");
const router = express.Router();

const RIGHTS = {
  VALIDATE_GROUP_REQUEST: 1 << 0, // b0
  CREATE_REMOVE_PLAYER: 1 << 1, // b1
  WRITE_ENABLED: 1 << 2, // b2
};

const checkRights = (userRights, requiredRights) => {
  return (userRights & requiredRights) === requiredRights;
};

// Middleware pour vérifier les droits d'un utilisateur
const hasRights = (requiredRights) => {
  return async (req, res, next) => {
    const userId = req.user.id;
    const { teamId } = req.body;

    try {
      const groupContract = await GroupContract.findOne({
        where: { User_ID: userId, Team_ID: teamId },
      });

      if (!groupContract) {
        return res.status(403).json({
          message: "Accès refusé : vous n'êtes pas dans cette équipe.",
        });
      }

      if (!checkRights(groupContract.Rights_flags, requiredRights)) {
        return res.status(403).json({
          message: "Accès refusé : vous n'avez pas les droits requis.",
        });
      }

      next();
    } catch (error) {
      console.error("Erreur lors de la vérification des droits :", error);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  };
};

// Route : Créer une équipe
router.post("/", authenticateToken, async (req, res) => {
  try {
    const { teamName, city, groupPassword, coachName, userId } = req.body;

    if (!teamName || !city || !groupPassword || !coachName || !userId) {
      return res.status(400).json({ message: "Tous les champs sont requis." });
    }

    const hashedPassword = await bcrypt.hash(groupPassword, 10);

    const newTeam = await Team.create({
      TeamName: teamName,
      City: city,
      GroupPassword: hashedPassword,
      CoachName: coachName,
    });

    const rights =
      RIGHTS.VALIDATE_GROUP_REQUEST |
      RIGHTS.CREATE_REMOVE_PLAYER |
      RIGHTS.WRITE_ENABLED;

    await GroupContract.create({
      User_ID: userId,
      Team_ID: newTeam.id,
      Rights_flags: rights,
    });

    res.status(201).json({
      message: "Équipe créée avec succès.",
      team: newTeam,
    });
  } catch (error) {
    console.error("Erreur lors de la création de l'équipe :", error);
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Route : Ajouter un utilisateur à une équipe
// TODO: remove group password
router.post(
  "/add-user",
  authenticateToken,
  hasRights(RIGHTS.CREATE_REMOVE_PLAYER),
  async (req, res) => {
    try {
      const { userId, teamId, groupPassword } = req.body;

      if (!userId || !teamId || !groupPassword) {
        return res
          .status(400)
          .json({ message: "Tous les champs sont requis." });
      }

      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ message: "Équipe non trouvée." });
      }

      const isPasswordValid = await bcrypt.compare(
        groupPassword,
        team.GroupPassword
      );
      if (!isPasswordValid) {
        return res.status(403).json({ message: "Mot de passe incorrect." });
      }

      const existingContract = await GroupContract.findOne({
        where: { User_ID: userId, Team_ID: teamId },
      });

      if (existingContract) {
        return res
          .status(400)
          .json({ message: "L'utilisateur est déjà dans cette équipe." });
      }

      await GroupContract.create({
        userId,
        teamId,
        rightsFlags: RIGHTS.WRITE_ENABLED,
      });

      res
        .status(201)
        .json({ message: "Utilisateur ajouté à l'équipe avec succès." });
    } catch (error) {
      console.error(
        "Erreur lors de l'ajout de l'utilisateur à l'équipe :",
        error
      );
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
);

// Route : Récupérer les équipes d'un utilisateur
router.get("/:userId", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    const teams = await GroupContract.findAll({
      where: { User_ID: userId },
      include: [{ model: Team }],
    });

    res.status(200).json({ teams });
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des équipes de l'utilisateur :",
      error
    );
    res.status(500).json({ message: "Erreur interne du serveur." });
  }
});

// Route : Modifier une équipe
router.put(
  "/:teamId",
  authenticateToken,
  hasRights(RIGHTS.WRITE_ENABLED),
  async (req, res) => {
    try {
      const { teamId } = req.params;
      const { teamName, city, coachName } = req.body;

      const team = await Team.findByPk(teamId);
      if (!team) {
        return res.status(404).json({ message: "Équipe non trouvée." });
      }

      team.TeamName = teamName || team.TeamName;
      team.City = city || team.City;
      team.CoachName = coachName || team.CoachName;

      await team.save();

      res
        .status(200)
        .json({ message: "Équipe mise à jour avec succès.", team });
    } catch (error) {
      console.error("Erreur lors de la modification de l'équipe :", error);
      res.status(500).json({ message: "Erreur interne du serveur." });
    }
  }
);

router.get("/test", (req, res) => {
  res.json({ message: "Route team/test works!" });
});

// #########################################################
// -----  Routes created specfically for Mobile -----------
// #########################################################
router.post("/create", authenticateToken, async (req, res) => {
  const { teamName, city, coachName } = req.body;
  const user = req.user;
  console.log(
    `teamName: ${teamName}, city: ${city}, coachName: ${coachName}, userId: ${user.id}`
  );
  const checkBodyObj = checkBodyReturnMissing(req.body, [
    "teamName",
    "city",
    "coachName",
  ]);
  if (!checkBodyObj.isValid) {
    return res.status(401).json({
      result: false,
      error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
    });
  }

  const newTeam = await Team.create({
    teamName,
    city,
    coachName,
  });
  res.json({ result: true, message: "League created successfully" });
});

// Route for Mobile
router.post("/create-league", authenticateToken, async (req, res) => {
  console.log("- accessed POST /team/create_league");

  const checkBodyObj = checkBodyReturnMissing(req.body, ["name", "category"]);
  if (!checkBodyObj.isValid) {
    return res.status(401).json({
      result: false,
      error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
    });
  }
  await League.create({
    name: req.body.name,
    category: req.body.category,
  });
  res.json({ result: true, message: "League created successfully" });
});

module.exports = router;
