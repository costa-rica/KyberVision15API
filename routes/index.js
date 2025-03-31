var express = require("express");
var router = express.Router();

const { authenticateToken } = require("../middleware/auth");

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { title: "Express" });
});
/* GET /test */
router.get("/test", function (req, res, next) {
  res.json({ result: true, message: "this works" });
});
/* GET /test-auth */
router.get("/test-auth", authenticateToken, function (req, res, next) {
  console.log("in test-auth route");
  console.log(req.user);
  res.json({ result: true, message: "this works" });
});

module.exports = router;
