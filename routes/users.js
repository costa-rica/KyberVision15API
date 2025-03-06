var express = require("express");
var router = express.Router();
const bcrypt = require("bcrypt");
const User = require("../models/User");
const { authenticateToken } = require("../middleware/auth");
const jwt = require("jsonwebtoken");
const { sendRegistrationEmail } = require("../modules/mailer");

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
    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    await sendRegistrationEmail(email, username)
      .then(() => console.log("Email sent successfully"))
      .catch((error) => console.error("Email failed:", error));

    //   res.status(201).json({
    //     message: "Utilisateur créé avec succès.",
    //     user: { email: "email", username: "username" },
    //     token: "token_code",
    //   });
    // })
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

    await user.update({ lastAccessDate: new Date() });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "5h",
    });

    res.status(200).json({ message: "Connexion réussie.", token, user });
  })
);

module.exports = router;
