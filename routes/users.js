var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
// const User = require("kybervision14db");
// const GroupContract = require("kybervision14db");
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
} = require("kybervision14db");
const { authenticateToken } = require("../modules/userAuthentication");
const jwt = require("jsonwebtoken");
const {
  sendRegistrationEmail,
  sendResetPasswordEmail,
} = require("../modules/mailer");

const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// 🔹 Register User (Create)
router.post(
  "/register",
  asyncHandler(async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ error: "Tous les champs sont requis." });
    }

    console.log(`Creating user: ${username}, ${password}, ${email}`);

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "L'utilisateur existe déjà." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      created: new Date(),
    });
    //TODO: Create GroupContract with PAVVB
    await GroupContract.create({
      userId: user.id,
      teamId: 1,
      // rightsFlags: 7,
    });
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    // const token = jwt.sign({ user }, process.env.JWT_SECRET);

    await sendRegistrationEmail(email, username)
      .then(() => console.log("Email sent successfully"))
      .catch((error) => console.error("Email failed:", error));

    res
      .status(201)
      .json({ message: "Utilisateur créé avec succès.", user, token });
  })
);

// 🔹 Get All Users
router.get(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const users = await User.findAll();
    res.status(200).json(users);
  })
);

// 🔹 Get Current User by Token
router.get(
  "/me",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const userId = req.user.id;
    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({
        error: "Utilisateur non trouvé.",
        userId: userId,
        reqUser: req.user,
      });
    }

    res.status(200).json({
      id: user.id,
      username: user.username,
      email: user.email,
    });
  })
);

// 🔹 Get User by ID
router.get(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    res.status(200).json(user);
  })
);

// 🔹 Delete All Users
router.delete(
  "/",
  authenticateToken,
  asyncHandler(async (req, res) => {
    await User.destroy({ where: {} });
    res
      .status(200)
      .json({ message: "Tous les utilisateurs ont été supprimés." });
  })
);

// 🔹 Delete User by ID
router.delete(
  "/:id",
  authenticateToken,
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    await user.destroy();
    res.status(200).json({ message: "Utilisateur supprimé avec succès." });
  })
);

// 🔹 User Login
router.post(
  "/login",
  asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Mot de passe incorrect." });
    }

    await user.update({ updatedAt: new Date() });

    // const token = jwt.sign({ user }, process.env.JWT_SECRET);
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET);
    // const token = jwt.sign({ user }, process.env.JWT_SECRET, {
    //   expiresIn: "5h",
    // });

    res.status(200).json({ message: "Connexion réussie.", token, user });
  })
);

// 🔹 Update User (PATCH-like behavior)
router.post(
  "/update/:userId",
  authenticateToken, // Ensure the user is authenticated
  asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { username, password, email, isAdminForKvManagerWebsite } = req.body;

    console.log(`Updating user ${userId}`);

    // Find the user by ID
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ error: "Utilisateur non trouvé." });
    }

    // Prepare update object (only include non-null fields)
    const updatedFields = {};
    if (username) updatedFields.username = username;
    if (email) updatedFields.email = email;
    if (typeof isAdminForKvManagerWebsite === "boolean") {
      updatedFields.isAdminForKvManagerWebsite = isAdminForKvManagerWebsite;
    }

    // If password is provided, hash it before updating
    if (password) {
      updatedFields.password = await bcrypt.hash(password, 10);
    }

    // Perform the update if there are fields to update
    if (Object.keys(updatedFields).length > 0) {
      await user.update(updatedFields);
      console.log(`User ${userId} updated successfully`);
    } else {
      console.log(`No updates applied for user ${userId}`);
    }

    res.status(200).json({ message: "Mise à jour réussie.", user });
  })
);

router.post(
  "/test-email",
  asyncHandler(async (req, res) => {
    const { email, username } = req.body;
    await sendRegistrationEmail(email, username);
    res.status(200).json({ message: "Email sent successfully" });
  })
);

// 🔹 Send reset token POST /users/request-password-reset
router.post("/request-password-reset", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });
    // Reset link
    const resetLink = `${process.env.URL_KV_MANAGER_WEBSITE}/forgot-password/reset/${token}`;

    // Send email
    await sendResetPasswordEmail(email, resetLink)
      .then(() => console.log("Email sent successfully"))
      .catch((error) => console.error("Email failed:", error));

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reset-password/:token", async (req, res) => {
  const token = req.params.token;
  const { password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await user.update({ password: hashedPassword });

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;
