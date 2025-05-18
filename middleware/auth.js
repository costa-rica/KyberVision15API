// middleware/auth.js
const jwt = require("jsonwebtoken");
const User = require("kybervision15db");

const authenticateToken = async (req, res, next) => {
  if (process.env.AUTHENTIFICATION_TURNED_OFF === "true") {
    const user = await User.findOne({ where: { email: "nrodrig1@gmail.com" } });
    req.user = { id: user.id };
    return next();
  }

  const token =
    req.headers["authorization"] && req.headers["authorization"].split(" ")[1];

  if (!token) {
    return res
      .status(401)
      .json({ error: "Accès refusé : aucun token fourni." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log("Decoded: ", decoded);
      console.log(err);
      return res.status(403).json({ error: "Token invalide ou expiré." });
    }

    req.user = decoded;

    next();
  });
};

module.exports = { authenticateToken };
