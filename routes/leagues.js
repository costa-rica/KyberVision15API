const express = require("express");
const bcrypt = require("bcrypt");
// const { Team, GroupContract } = require('../models');
// const Team = require("../models/Team");
// const GroupContract = require("../models/GroupContract");
const League = require("../models/League");
const { authenticateToken } = require("../modules/userAuthentication");
const { checkBodyReturnMissing } = require("../modules/common");
const router = express.Router();

// router.post("/create", authenticateToken, async (req, res) => {
//   console.log("- accessed POST /league/create");

//   const checkBodyObj = checkBodyReturnMissing(req.body, ["name", "category"]);
//   if (!checkBodyObj.isValid) {
//     return res.status(401).json({
//       result: false,
//       error: `Missing or empty fields: ${checkBodyObj.missingKeys}`,
//     });
//   }

//   // Check if the team already exists
//   const existingLeague = await League.findOne({
//     where: { name: req.body.name, category: req.body.category },
//   });

//   if (existingLeague) {
//     return res.status(409).json({
//       result: false,
//       error: "League already exists in the database",
//     });
//   }

//   await League.create({
//     name: req.body.name,
//     category: req.body.category,
//   });
//   res.json({ result: true, message: "League created successfully" });
// });

router.post("/update-or-create", authenticateToken, async (req, res) => {
  try {
    const { id, name, category } = req.body;

    if (id) {
      // Update League if ID is provided
      const leagueToUpdate = await League.findByPk(id);

      if (!leagueToUpdate) {
        return res.status(404).json({ error: "League not found" });
      }

      const updatedFields = {};
      Object.keys(req.body).forEach((key) => {
        if (req.body[key] !== null && req.body[key] !== undefined) {
          updatedFields[key] = req.body[key];
        }
      });

      await leagueToUpdate.update(updatedFields);
      return res.status(200).json({ result: true, league: leagueToUpdate });
    }

    // Check for duplicate League before creating a new one
    const existingLeague = await League.findOne({
      where: { name, category },
    });

    if (existingLeague) {
      return res.status(400).json({
        error: "This league already exists",
      });
    }

    if (!name || !category) {
      return res.status(400).json({
        result: false,
        error: "Missing required fields: name, category",
      });
    }

    const newLeague = await League.create({ name, category });

    return res.status(201).json({ result: true, league: newLeague });
  } catch (error) {
    console.error("Error in /update-or-create route:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/:leagueId", authenticateToken, async (req, res) => {
  try {
    const { leagueId } = req.params;

    // const { success, message, error } = await deleteLeague(leagueId);
    const league = await League.findByPk(leagueId);
    if (!league) {
      return res.status(404).json({ error: "League not found" });
    }

    await league.destroy();

    res.status(200).json({ message: "League deleted successfully" });
  } catch (error) {
    console.error("Error in DELETE /leagues/:leagueId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

module.exports = router;
