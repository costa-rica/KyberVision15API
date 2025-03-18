// middleware/auth.js
const jwt = require("jsonwebtoken");

const authenticateToken = (req, res, next) => {
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
