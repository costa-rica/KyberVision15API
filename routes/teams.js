const express = require("express");
const bcrypt = require("bcrypt");
// const { Team, GroupContract } = require('../models');
const Team = require("../models/Team");
const GroupContract = require("../models/GroupContract");
const League = require("../models/League");
const { authenticateToken } = require("../modules/userAuthentication");
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

router.post("/update-or-create", authenticateToken, async (req, res) => {
  try {
    const { id, teamName, city, coachName } = req.body;

    if (id) {
      // Update Team if ID is provided
      const teamToUpdate = await Team.findByPk(id);

      if (!teamToUpdate) {
        return res.status(404).json({ error: "Team not found" });
      }

      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
          updatedFields[key] = req.body[key];
        }
      });

      await teamToUpdate.update(updatedFields);
      return res.status(200).json({ result: true, team: teamToUpdate });
    }

    // Check for duplicate Team before creating a new one
    const existingTeam = await Team.findOne({
      where: { teamName, city, coachName },
    });

    if (existingTeam) {
      return res.status(400).json({
        error: "This team already exists",
      });
    }

    if (!teamName || !city || !coachName) {
      return res.status(400).json({
        result: false,
        error: "Missing required fields: teamName, city, coachName",
      });
    }

    const newTeam = await Team.create({ teamName, city, coachName });

    return res.status(201).json({ result: true, team: newTeam });
  } catch (error) {
    console.error("Error in /update-or-create-team route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:teamId", authenticateToken, async (req, res) => {
  try {
    const { teamId } = req.params;

    // const { success, message, error } = await deleteLeague(leagueId);
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    await team.destroy();

    res.status(200).json({ message: "Team deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /teams/:teamId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /players/:teamId - Get all players for a specific team
router.get("/players/:teamId", authenticateToken, async (req, res) => {
  const { teamId } = req.params;

  try {
    // Check if the team exists
    const team = await Team.findByPk(teamId);
    if (!team) {
      return res.status(404).json({ error: "Team not found" });
    }

    // Get players linked to the team via PlayerContract
    const players = await Player.findAll({
      include: [
        {
          model: PlayerContract,
          required: true,
          where: { teamId },
          attributes: ["shirtNumber"], // Include shirt number in response
        },
      ],
      attributes: ["id", "firstName", "lastName", "birthDate"],
    });

    return res.status(200).json(players);
  } catch (error) {
    console.error("Error fetching players:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
