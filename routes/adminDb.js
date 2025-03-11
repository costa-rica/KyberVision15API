var express = require("express");
var router = express.Router();
const User = require("../models/User");
const Video = require("../models/Video");
const Action = require("../models/Action");
const CompetitionContract = require("../models/CompetitionContract");
const Complex = require("../models/Complex");
const GroupContract = require("../models/GroupContract");
const League = require("../models/League");
const Match = require("../models/Match");
const OpponentServeTimestamp = require("../models/OpponentServeTimestamp");
const Player = require("../models/Player");
const PlayerContract = require("../models/PlayerContract");
const Point = require("../models/Point");
const Script = require("../models/Script");
const SyncContract = require("../models/SyncContract");
const Team = require("../models/Team");

const models = {
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
};

const fs = require("fs");
const path = require("path");
const { promisify } = require("util");
const archiver = require("archiver");
const { Parser } = require("json2csv");
// Promisify fs functions
const mkdirAsync = promisify(fs.mkdir);
// const writeFileAsync = promisify(fs.writeFile);
const { authenticateToken } = require("../middleware/auth");
const { checkBodyReturnMissing } = require("../modules/common");

const {
  readAndAppendDbTables,
  createDatabaseBackupZipFile,
} = require("../modules/adminDb");

// upload data to database
const multer = require("multer");
const unzipper = require("unzipper");
// const csvParser = require("csv-parser");
// const upload = multer({ dest: "uploads/" }); // Temporary storage for file uploads
const upload = multer({
  // dest: path.join(process.env.PATH_PROJECT_RESOURCES, "uploads/"),
  dest: path.join(process.env.PATH_PROJECT_RESOURCES, "uploads-delete-ok/"),
}); // Temporary storage for file uploads

router.get("/table/:tableName", async (req, res) => {
  try {
    const { tableName } = req.params;
    console.log(`- in GET /admin-db/table/${tableName}`);

    // Check if the requested table exists in the models
    if (!models[tableName]) {
      return res
        .status(400)
        .json({ result: false, message: `Table '${tableName}' not found.` });
    }

    // Fetch all records from the table
    const tableData = await models[tableName].findAll();

    res.json({ result: true, data: tableData });
  } catch (error) {
    console.error("Error fetching table data:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/create-database-backup", authenticateToken, async (req, res) => {
  console.log(`- in GET /admin-db/create-database-backup`);

  try {
    const zipFilePath = await createDatabaseBackupZipFile();
    console.log(`Backup zip created: ${zipFilePath}`);

    res.json({
      result: true,
      message: "Database backup completed",
      backupFile: zipFilePath,
    });
  } catch (error) {
    console.error("Error creating database backup:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

// 🔹 Get Database Backup List (GET /admin-db/backup-database-list)
router.get("/backup-database-list", authenticateToken, async (req, res) => {
  console.log(`- in GET /admin-db/backup-database-list`);

  try {
    const backupDir = process.env.PATH_DB_BACKUPS;
    if (!backupDir) {
      return res
        .status(500)
        .json({ result: false, message: "Backup directory not configured." });
    }

    // Read files in the backup directory
    const files = await fs.promises.readdir(backupDir);

    // Filter only .zip files
    const zipFiles = files.filter((file) => file.endsWith(".zip"));

    // console.log(`Found ${zipFiles.length} backup files.`);

    res.json({ result: true, backups: zipFiles });
  } catch (error) {
    console.error("Error retrieving backup list:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.get("/send-db-backup/:filename", authenticateToken, async (req, res) => {
  console.log(`- in GET /admin-db/send-db-backup/${req.params.filename}`);

  try {
    const { filename } = req.params;
    const backupDir = process.env.PATH_DB_BACKUPS;

    if (!backupDir) {
      return res
        .status(500)
        .json({ result: false, message: "Backup directory not configured." });
    }

    const filePath = path.join(backupDir, filename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res
        .status(404)
        .json({ result: false, message: "File not found." });
    }

    console.log(`Sending file: ${filePath}`);
    res.download(filePath, filename, (err) => {
      if (err) {
        console.error("Error sending file:", err);
        res.status(500).json({ result: false, message: "Error sending file." });
      }
    });
  } catch (error) {
    console.error("Error processing request:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.delete(
  "/delete-db-backup/:filename",
  authenticateToken,
  async (req, res) => {
    console.log(
      `- in DELETE /admin-db/delete-db-backup/${req.params.filename}`
    );

    try {
      const { filename } = req.params;
      const backupDir = process.env.PATH_DB_BACKUPS;

      if (!backupDir) {
        return res
          .status(500)
          .json({ result: false, message: "Backup directory not configured." });
      }

      const filePath = path.join(backupDir, filename);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return res
          .status(404)
          .json({ result: false, message: "File not found." });
      }

      // Delete the file
      await fs.promises.unlink(filePath);
      console.log(`Deleted file: ${filePath}`);

      res.json({ result: true, message: "Backup file deleted successfully." });
    } catch (error) {
      console.error("Error deleting backup file:", error);
      res.status(500).json({
        result: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

router.get("/db-row-counts-by-table", authenticateToken, async (req, res) => {
  console.log(`- in GET /admin-db/db-row-counts-by-table`);

  try {
    let arrayRowCountsByTable = [];

    for (const tableName in models) {
      if (models.hasOwnProperty(tableName)) {
        // console.log(`Checking table: ${tableName}`);

        // Count rows in the table
        const rowCount = await models[tableName].count();

        arrayRowCountsByTable.push({
          tableName,
          rowCount: rowCount || 0, // Ensure it's 0 if empty
        });
      }
    }

    // console.log(`Database row counts by table:`, arrayRowCountsByTable);
    res.json({ result: true, arrayRowCountsByTable });
  } catch (error) {
    console.error("Error retrieving database row counts:", error);
    res.status(500).json({
      result: false,
      message: "Internal server error",
      error: error.message,
    });
  }
});

router.post(
  "/import-db-backup",
  authenticateToken,
  upload.single("backupFile"),
  async (req, res) => {
    console.log("- in POST /admin-db/import-db-backup");

    try {
      if (!req.file) {
        return res
          .status(400)
          .json({ result: false, message: "No file uploaded." });
      }

      const backupDir = process.env.PATH_PROJECT_RESOURCES;
      if (!backupDir) {
        console.log("*** no file ***");
        return res.status(500).json({
          result: false,
          message: "Temporary directory not configured.",
        });
      }

      const tempExtractPath = path.join(backupDir, "temp_db_import");

      // Ensure the temp_db_import folder is clean before extracting
      if (fs.existsSync(tempExtractPath)) {
        console.log("Previous temp_db_import folder found. Deleting...");
        await fs.promises.rm(tempExtractPath, { recursive: true });
        console.log("Old temp_db_import folder deleted.");
      }

      await mkdirAsync(tempExtractPath, { recursive: true });

      console.log(`Extracting backup to: ${tempExtractPath}`);

      // Unzip the uploaded file
      await fs
        .createReadStream(req.file.path)
        .pipe(unzipper.Extract({ path: tempExtractPath }))
        .promise();

      console.log("Backup extracted successfully.");

      // Read all subfolders inside tempExtractPath
      const extractedFolders = await fs.promises.readdir(tempExtractPath);

      // Find the correct folder that starts with "db_backup_"
      let backupFolder = extractedFolders.find(
        (folder) => folder.startsWith("db_backup_") && folder !== "__MACOSX"
      );

      // Determine the path where CSV files should be searched
      let backupFolderPath = backupFolder
        ? path.join(tempExtractPath, backupFolder)
        : tempExtractPath;

      console.log(`Using backup folder: ${backupFolderPath}`);

      // Call the new function to read and append database tables
      const status = await readAndAppendDbTables(backupFolderPath);

      // Clean up temporary files
      await fs.promises.rm(tempExtractPath, { recursive: true });
      await fs.promises.unlink(req.file.path);
      // await fs.promises.rm(
      //   path.join(process.env.PATH_PROJECT_RESOURCES, "uploads/"),
      //   { recursive: true }
      // );
      console.log("Temporary files deleted.");

      console.log(status);
      if (status?.failedOnTableName) {
        res.status(500).json({
          result: false,
          error: status.error,
          failedOnTableName: status.failedOnTableName,
        });
      } else {
        res.json({
          result: status.success,
          message: status.message,
        });
      }
    } catch (error) {
      console.error("Error importing database backup:", error);
      res.status(500).json({
        result: false,
        message: "Internal server error",
        error: error.message,
      });
    }
  }
);

// router.post(
//   "/import-db-backup",
//   authenticateToken,
//   upload.single("backupFile"),
//   async (req, res) => {
//     console.log("- in POST /admin-db/import-db-backup");

//     try {
//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ result: false, message: "No file uploaded." });
//       }

//       const backupDir = process.env.PATH_PROJECT_RESOURCES;
//       if (!backupDir) {
//         console.log("*** no file ***");
//         return res.status(500).json({
//           result: false,
//           message: "Temporary directory not configured.",
//         });
//       }
//       //   console.log("** there is a file");

//       const tempExtractPath = path.join(backupDir, "temp_db_import");

//       // Ensure the temp_db_import folder is clean before extracting
//       if (fs.existsSync(tempExtractPath)) {
//         console.log("Previous temp_db_import folder found. Deleting...");
//         await fs.promises.rm(tempExtractPath, { recursive: true });
//         console.log("Old temp_db_import folder deleted.");
//       }

//       await mkdirAsync(tempExtractPath, { recursive: true });

//       console.log(`Extracting backup to: ${tempExtractPath}`);

//       // Unzip the uploaded file
//       await fs
//         .createReadStream(req.file.path)
//         .pipe(unzipper.Extract({ path: tempExtractPath }))
//         .promise();

//       console.log("Backup extracted successfully.");

//       // Read all subfolders inside tempExtractPath
//       const extractedFolders = await fs.promises.readdir(tempExtractPath);

//       // --- New check for .csv files

//       // Find the correct folder that starts with "db_backup_"
//       let backupFolder = extractedFolders.find(
//         (folder) => folder.startsWith("db_backup_") && folder !== "__MACOSX"
//       );

//       // Determine the path where CSV files should be searched
//       let backupFolderPath;
//       if (backupFolder) {
//         backupFolderPath = path.join(tempExtractPath, backupFolder);
//         console.log(`Found backup folder: ${backupFolderPath}`);
//       } else {
//         // If no "db_backup_" folder, assume CSVs are in the root
//         backupFolderPath = tempExtractPath;
//         console.log("No 'db_backup_' folder found. Using root directory.");
//       }

//       /// Move to function
//       // // Get the actual .csv files inside the determined directory
//       // const csvFiles = await fs.promises.readdir(backupFolderPath);

//       // for (const file of csvFiles) {
//       //   if (!file.endsWith(".csv")) continue; // Skip non-CSV files

//       //   const tableName = file.replace(".csv", "");
//       //   if (!models[tableName]) {
//       //     console.log(`Skipping ${file}, no matching table found.`);
//       //     continue;
//       //   }

//       //   console.log(`Importing data into table: ${tableName}`);
//       //   const filePath = path.join(backupFolderPath, file);
//       //   const records = [];

//       //   // Read CSV file
//       //   await new Promise((resolve, reject) => {
//       //     fs.createReadStream(filePath)
//       //       .pipe(csvParser())
//       //       .on("data", (row) => records.push(row))
//       //       .on("end", resolve)
//       //       .on("error", reject);
//       //   });

//       //   if (records.length > 0) {
//       //     await models[tableName].bulkCreate(records, {
//       //       ignoreDuplicates: true,
//       //     });
//       //     console.log(`Imported ${records.length} records into ${tableName}`);
//       //   } else {
//       //     console.log(`No records found in ${file}`);
//       //   }

//       const status = await readAndAppendDbTables(backupFolderPath)
//       }

//       //   Clean up temporary files
//       await fs.promises.rm(tempExtractPath, { recursive: true });
//       await fs.promises.unlink(req.file.path);
//       console.log("Temporary files deleted.");

//       res.json({
//         result: true,
//         message: "Database backup imported successfully.",
//       });
//     } catch (error) {
//       console.error("Error importing database backup:", error);
//       res.status(500).json({
//         result: false,
//         message: "Internal server error",
//         error: error.message,
//       });
//     }
//   }
// );

module.exports = router;
