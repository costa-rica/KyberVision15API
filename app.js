require("dotenv").config();
const sequelize = require("./models/_connection");
// const associations = require("./models/_associations");
require("./models/_associations");
var express = require("express");
var path = require("path");
var cookieParser = require("cookie-parser");
var logger = require("morgan");

var indexRouter = require("./routes/index");
var usersRouter = require("./routes/users");
var actionsRouter = require("./routes/actions");
var videosRouter = require("./routes/videos");
var groupsRouter = require("./routes/groups");
var matchesRouter = require("./routes/matches");
var playersRouter = require("./routes/players");
var scriptsRouter = require("./routes/scripts");
var syncContractsRouter = require("./routes/syncContracts");
var teamsRouter = require("./routes/teams");
var leaguesRouter = require("./routes/leagues");
var adminDbRouter = require("./routes/adminDb");
var playerContractsRouter = require("./routes/playerContracts");

var app = express();
const cors = require("cors");
app.use(cors());

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.use("/", indexRouter);
app.use("/users", usersRouter);
app.use("/actions", actionsRouter);
app.use("/videos", videosRouter);
app.use("/groups", groupsRouter);
app.use("/matches", matchesRouter);
app.use("/players", playersRouter);
app.use("/scripts", scriptsRouter);
app.use("/sync-contracts", syncContractsRouter);
app.use("/teams", teamsRouter);
app.use("/leagues", leaguesRouter);
app.use("/admin-db", adminDbRouter);
app.use("/player-contracts", playerContractsRouter);

// Increase payload size for large files
app.use(express.json({ limit: "6gb" }));
app.use(express.urlencoded({ limit: "6gb", extended: true }));

const { onStartUpCreateEnvUsers } = require("./modules/onStartUp");

// Sync database and then create environment users
sequelize
  .sync()
  .then(async () => {
    console.log("✅ Database connected & synced");
    await onStartUpCreateEnvUsers(); // <-- Call function here
  })
  .catch((error) => console.error("❌ Error syncing database:", error));

// // Sync database and start server
// sequelize
//   .sync()
//   .then(() => {
//     console.log("✅ Database connected & synced");
//     await onAppLaunchCreateEnvUsers(); // <-- Call function here
//   })
//   .catch((error) => console.error("Error syncing database:", error));

module.exports = app;
