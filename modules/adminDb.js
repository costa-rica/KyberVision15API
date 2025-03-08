const csvParser = require("csv-parser");
const fs = require("fs");
const path = require("path");

// Import models directly
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

async function readAndAppendDbTables(backupFolderPath) {
  console.log(`Processing CSV files from: ${backupFolderPath}`);
  let currentTable = null;
  try {
    // Read all CSV files from the backup directory
    const csvFiles = await fs.promises.readdir(backupFolderPath);
    let totalRecordsImported = 0;

    // Separate contract-related tables from regular tables
    const priorityTables = [];
    const contractTables = [];

    csvFiles.forEach((file) => {
      if (!file.endsWith(".csv")) return; // Skip non-CSV files

      if (
        file.includes("Contract") ||
        file.includes("Match") ||
        file.includes("Video")
      ) {
        contractTables.push(file);
      } else {
        priorityTables.push(file);
      }
    });

    console.log(`Priority Tables: ${priorityTables}`);
    console.log(`Contract Tables: ${contractTables}`);

    // Helper function to process CSV files
    async function processCSVFiles(files) {
      let recordsImported = 0;

      for (const file of files) {
        const tableName = file.replace(".csv", "");
        if (!models[tableName]) {
          console.log(`Skipping ${file}, no matching table found.`);
          continue;
        }

        console.log(`Importing data into table: ${tableName}`);
        currentTable = tableName;
        const filePath = path.join(backupFolderPath, file);
        const records = [];

        // Read CSV file
        await new Promise((resolve, reject) => {
          fs.createReadStream(filePath)
            .pipe(csvParser())
            .on("data", (row) => records.push(row))
            .on("end", resolve)
            .on("error", reject);
        });

        if (records.length > 0) {
          await models[tableName].bulkCreate(records, {
            ignoreDuplicates: true,
          });
          recordsImported += records.length;
          console.log(`Imported ${records.length} records into ${tableName}`);
        } else {
          console.log(`No records found in ${file}`);
        }
      }

      return recordsImported;
    }

    // Process priority tables first
    totalRecordsImported += await processCSVFiles(priorityTables);

    // Process contract tables last
    totalRecordsImported += await processCSVFiles(contractTables);

    return {
      success: true,
      message: `Successfully imported ${totalRecordsImported} records.`,
    };
  } catch (error) {
    console.error("Error processing CSV files:", error);
    return {
      success: false,
      error: error.message,
      failedOnTableName: currentTable,
    };
  }
}

module.exports = {
  readAndAppendDbTables,
};

// const csvParser = require("csv-parser");
// const fs = require("fs");
// const path = require("path");
// // const models = require("../models/_associations"); // Import models

// const User = require("../models/User");
// const Video = require("../models/Video");
// const Action = require("../models/Action");
// const CompetitionContract = require("../models/CompetitionContract");
// const Complex = require("../models/Complex");
// const GroupContract = require("../models/GroupContract");
// const League = require("../models/League");
// const Match = require("../models/Match");
// const OpponentServeTimestamp = require("../models/OpponentServeTimestamp");
// const Player = require("../models/Player");
// const PlayerContract = require("../models/PlayerContract");
// const Point = require("../models/Point");
// const Script = require("../models/Script");
// const SyncContract = require("../models/SyncContract");
// const Team = require("../models/Team");

// const models = {
//   User,
//   Video,
//   Action,
//   CompetitionContract,
//   Complex,
//   GroupContract,
//   League,
//   Match,
//   OpponentServeTimestamp,
//   Player,
//   PlayerContract,
//   Point,
//   Script,
//   SyncContract,
//   Team,
// };

// async function readAndAppendDbTables(backupFolderPath) {
//   console.log(`Processing CSV files from: ${backupFolderPath}`);

//   try {
//     // Get the actual .csv files inside the determined directory
//     const csvFiles = await fs.promises.readdir(backupFolderPath);
//     let recordsImported = 0;

//     for (const file of csvFiles) {
//       if (!file.endsWith(".csv")) continue; // Skip non-CSV files

//       const tableName = file.replace(".csv", "");
//       if (!models[tableName]) {
//         console.log(`Skipping ${file}, no matching table found.`);
//         continue;
//       }

//       console.log(`Importing data into table: ${tableName}`);
//       const filePath = path.join(backupFolderPath, file);
//       const records = [];

//       // Read CSV file
//       await new Promise((resolve, reject) => {
//         fs.createReadStream(filePath)
//           .pipe(csvParser())
//           .on("data", (row) => records.push(row))
//           .on("end", resolve)
//           .on("error", reject);
//       });

//       if (records.length > 0) {
//         await models[tableName].bulkCreate(records, {
//           ignoreDuplicates: true,
//         });
//         recordsImported += records.length;
//         console.log(`Imported ${records.length} records into ${tableName}`);
//       } else {
//         console.log(`No records found in ${file}`);
//       }
//     }

//     return {
//       success: true,
//       message: `Successfully imported ${recordsImported} records.`,
//     };
//   } catch (error) {
//     console.error("Error processing CSV files:", error);
//     return { success: false, error: error.message };
//   }
// }

// module.exports = {
//   readAndAppendDbTables,
// };
