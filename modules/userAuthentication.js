const jwt = require("jsonwebtoken");
const User = require("../models/User");

// function createToken(user) {
//   const secretKey = process.env.SECRET_KEY;
//   return jwt.sign({ user }, secretKey, { expiresIn: "7d" });
// }

function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token == null) {
    return res.status(401).json({ message: "Token is required" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    const { user } = decoded;
    console.log("in authThoken func()");
    console.log("user: ");
    console.log(user);

    req.user = user.user; // Set the decoded payload directly to req.user
    next();
  });
}

async function findUserByEmail(email) {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.log("User not found");
    }
    console.log(user);
    return user;
  } catch (error) {
    console.error("Error finding user by email:", error);
  }
}

// for ACCEPTED_EMAILS in .env just add "," to each new email (i.e. do not use [])
const restrictEmails = (email) => {
  const acceptedEmailsEnv = process.env.ACCEPTED_EMAILS;

  // If ACCEPTED_EMAILS is not defined or empty, return false
  if (!acceptedEmailsEnv) {
    return true;
  }

  // Convert the comma-separated string into an array of emails
  const acceptedEmails = acceptedEmailsEnv.split(",");

  // Check if the provided email exists in the list of accepted emails
  return acceptedEmails.includes(email);
};

module.exports = {
  // createToken,
  authenticateToken,
  findUserByEmail,
  restrictEmails,
};
