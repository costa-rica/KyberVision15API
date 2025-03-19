const express = require("express");
const { authenticateToken } = require("../middleware/auth");
// const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();
const Video = require("../models/Video");
// const Match = require("../models/Match");
const Script = require("../models/Script");
const SyncContract = require("../models/SyncContract");
const User = require("../models/User");
const {
  upload,
  deleteVideo,
  createVideoMontage04,
} = require("../modules/videoProcessing");
const path = require("path");
const fs = require("fs");
const { getMatchWithTeams } = require("../modules/match");
const ffmpeg = require("fluent-ffmpeg");
// const { spawn } = require("child_process");
const jobQueue = require("../modules/queueService");
const {
  sendVideoMontageCompleteNotificationEmail,
} = require("../modules/mailer");
const jwt = require("jsonwebtoken");
const { writeRequestArgs } = require("../modules/common");

// 🔹 Upload Video (POST /videos/upload)
router.post(
  "/upload",
  authenticateToken,
  upload.single("video"), // Expecting a file with field name "video"
  async (req, res) => {
    try {
      console.log("📌 - in POST /videos/upload");

      const { matchId } = req.body;

      // Validate required fields
      if (!matchId) {
        return res
          .status(400)
          .json({ result: false, message: "matchId is required" });
      }

      if (!req.file) {
        return res
          .status(400)
          .json({ result: false, message: "No video file uploaded" });
      }

      // Step 1: Get video file size in MB
      const fileSizeBytes = req.file.size;
      const fileSizeMb = (fileSizeBytes / (1024 * 1024)).toFixed(2);

      console.log(`📁 Video File Size: ${fileSizeMb} MB`);

      // Step 2: Create video entry with placeholder URL & file size
      const newVideo = await Video.create({
        matchId: parseInt(matchId, 10),
        filename: req.file.filename,
        url: "placeholder",
        videoFileSizeInMb: fileSizeMb,
      });

      // Step 3: Generate and update video URL
      const videoURL = `https://${req.get("host")}/videos/${newVideo.id}`;
      await newVideo.update({ url: videoURL });

      // Step 4: Find all scripts with the matching matchId
      const scripts = await Script.findAll({
        where: { matchId },
      });

      if (scripts.length === 0) {
        console.log(`⚠️ No scripts found for matchId: ${matchId}`);
      } else {
        console.log(
          `📜 Found ${scripts.length} script(s) for matchId: ${matchId}`
        );
      }

      let syncContractUpdates = 0;

      // Step 5: Loop through all scripts and update SyncContracts
      for (const script of scripts) {
        const syncContracts = await SyncContract.findAll({
          where: { scriptId: script.id },
        });

        if (syncContracts.length > 0) {
          console.log(
            `🔄 Updating ${syncContracts.length} SyncContract(s) for scriptId: ${script.id}`
          );

          for (const syncContract of syncContracts) {
            await syncContract.update({ videoId: newVideo.id });
            syncContractUpdates++;
          }
        } else {
          console.log(`⚠️ No SyncContracts found for scriptId: ${script.id}`);
        }
      }

      // Step 6: Send success response
      res.status(201).json({
        result: true,
        message: "Video uploaded successfully",
        video: newVideo,
      });
    } catch (error) {
      console.error("❌ Error uploading video:", error);
      res.status(500).json({
        result: false,
        message: "Internal Server Error",
        error: error.message,
      });
    }
  }
);

// 🔹 Get All Videos with Match Data (GET /videos/)
router.get("/", authenticateToken, async (req, res) => {
  console.log(`- in GET /api/videos`);
  try {
    // Fetch all videos with associated match data
    const videos = await Video.findAll();

    // Process videos to include match & team details
    const formattedVideos = await Promise.all(
      videos.map(async (video) => {
        const matchData = await getMatchWithTeams(video.matchId);
        return {
          ...video.get(), // Extract raw video data
          match: matchData.success ? matchData.match : null, // Include match data if successful
        };
      })
    );

    res.json({ result: true, videos: formattedVideos });
  } catch (error) {
    console.error("Error fetching videos:", error);
    res.status(500).json({
      result: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// 🔹 Get Video by ID (GET /:videoId) downloads /shows actual video
router.get("/:videoId", authenticateToken, async (req, res) => {
  console.log(" in GET /videos/:videoIs");
  console.log(req.params.filename);
  const videoId = req.params.videoId;
  const videoObj = await Video.findByPk(videoId);
  if (!videoObj) {
    return res.status(404).json({ result: false, message: "Video not found" });
  }

  const videoPath = path.join(process.env.PATH_VIDEOS, videoObj.filename);
  console.log(`videoPath: ${videoPath}`);
  // Check if the file exists
  if (!fs.existsSync(videoPath)) {
    return res.status(404).json({ error: "Video not found" });
  }

  // Set headers and stream the video
  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    const file = fs.createReadStream(videoPath, { start, end });
    const headers = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, headers);
    file.pipe(res);
  } else {
    const headers = {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(200, headers);
    fs.createReadStream(videoPath).pipe(res);
  }
});

router.delete("/:videoId", authenticateToken, async (req, res) => {
  try {
    const { videoId } = req.params;

    const { success, message, error } = await deleteVideo(videoId);

    if (!success) {
      return res.status(404).json({ error });
    }

    res.status(200).json({ message });
  } catch (error) {
    console.error("Error in DELETE /videos/:videoId:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// 🔹 Update Video by ID (POST /videos/update/:videoId) intended to update the videoFileCreatedDateTimeEstimate
router.post("/update/:videoId", authenticateToken, async (req, res) => {
  console.log("- in POST /update/:videoId");
  const { videoId } = req.params;
  const { videoFileCreatedDateTimeEstimate } = req.body;
  console.log(videoFileCreatedDateTimeEstimate);

  const videoObj = await Video.findByPk(videoId);
  if (!videoObj) {
    return res.status(404).json({ result: false, message: "Video not found" });
  }

  const updatedVideo = await videoObj.update({
    videoFileCreatedDateTimeEstimate,
  });
  res.json({ result: true, message: "Video updated successfully" });
});

// 🔹 (from 2025-03-10 effort) Stream Video by ID (GET /videos/stream/:videoId)
router.get("/stream/:videoId", async (req, res) => {
  const videoId = req.params.videoId;
  const videoObj = await Video.findByPk(videoId);
  if (!videoObj) {
    return res.status(404).json({ result: false, message: "Video not found" });
  }

  const videoPath = path.join(process.env.PATH_VIDEOS, videoObj.filename);
  console.log(`Streaming video: ${videoPath}`);

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunkSize = end - start + 1;

    console.log(`📡 Sending chunk: ${start}-${end} (${chunkSize} bytes)`);

    const file = fs.createReadStream(videoPath, { start, end });
    const head = {
      "Content-Range": `bytes ${start}-${end}/${fileSize}`,
      "Accept-Ranges": "bytes",
      "Content-Length": chunkSize,
      "Content-Type": "video/mp4",
    };

    res.writeHead(206, head);
    file.pipe(res);

    // Monitor data being sent
    let bytesSent = 0;
    file.on("data", (chunk) => {
      bytesSent += chunk.length;
      console.log(
        `✅ Chunk sent: ${chunk.length} bytes (Total: ${bytesSent} bytes)`
      );
    });

    file.on("end", () => console.log("🚀 Video streaming finished!"));
  } else {
    console.log("⚠️ No range request - sending full video.");

    res.writeHead(200, {
      "Content-Length": fileSize,
      "Content-Type": "video/mp4",
    });

    const file = fs.createReadStream(videoPath);
    file.pipe(res);

    let bytesSent = 0;
    file.on("data", (chunk) => {
      bytesSent += chunk.length;
      console.log(
        `✅ Chunk sent: ${chunk.length} bytes (Total: ${bytesSent} bytes)`
      );
    });

    file.on("end", () => console.log("🚀 Full video sent!"));
  }
});
// 🔹 (from 2025-03-10 effort) Stream Video by ID (GET /videos/stream-only/:videoId)
router.get("/stream-only/:videoId", async (req, res) => {
  console.log(`- in GET /stream-only/${req.params.videoId}`);
  const videoId = req.params.videoId;
  const videoObj = await Video.findByPk(videoId);

  if (!videoObj) {
    return res.status(404).json({ result: false, message: "Video not found" });
  }

  const videoPath = path.join(process.env.PATH_VIDEOS, videoObj.filename);
  console.log(`Streaming video: ${videoPath}`);

  const stat = fs.statSync(videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (!range) {
    console.log("❌ No range request - refusing full response.");
    return res.status(416).send("Range header required for streaming");
  }

  console.log(`range: ${range}`);

  // Parse range header
  const parts = range.replace(/bytes=/, "").split("-");
  const start = parseInt(parts[0], 10);
  const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
  const chunkSize = end - start + 1;

  console.log(`📡 Sending chunk: ${start}-${end} (${chunkSize} bytes)`);

  const file = fs.createReadStream(videoPath, { start, end });

  const head = {
    "Content-Range": `bytes ${start}-${end}/${fileSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunkSize,
    "Content-Type": "video/mp4",
  };

  res.writeHead(206, head);
  file.pipe(res);

  // Monitor data being sent
  let bytesSent = 0;
  file.on("data", (chunk) => {
    bytesSent += chunk.length;
    console.log(
      `✅ Chunk sent: ${chunk.length} bytes (Total: ${bytesSent} bytes)`
    );
  });

  file.on("end", () => console.log("🚀 Streaming finished!"));
});

// // 🔹 recieve video actions for video montage POST /videos/montage/:videoId
// router.post("/montage/:videoId", authenticateToken, async (req, res) => {
//   console.log("- in POST /videos/montage/:videoId");
//   const { videoId } = req.params;
//   const { actionsArray } = req.body;
//   console.log(actionsArray);

//   const videoObj = await Video.findByPk(videoId);
//   if (!videoObj) {
//     return res.status(404).json({ result: false, message: "Video not found" });
//   }

//   res.json({
//     result: true,
//     message: `Video montage ${actionsArray.length} actions received`,
//   });
// });

// 🔹 Create a video montage from selected actions (POST /videos/montage/:videoId)
router.post("/montage/:videoId", authenticateToken, async (req, res) => {
  console.log("- in POST /videos/montage/:videoId");

  try {
    const { videoId } = req.params;
    const { actionsArray } = req.body;

    if (
      !actionsArray ||
      !Array.isArray(actionsArray) ||
      actionsArray.length === 0
    ) {
      return res
        .status(400)
        .json({ result: false, message: "Invalid actionsArray" });
    }

    // 🔹 Retrieve video file information
    const videoObj = await Video.findByPk(videoId);
    if (!videoObj) {
      return res
        .status(404)
        .json({ result: false, message: "Video not found" });
    }

    const videoFilePathAndName = path.join(
      process.env.PATH_VIDEOS,
      videoObj.filename
    );

    // 🔹 Extract timestamps from actionsArray
    const timestampArray = actionsArray.map((action) => action.timestamp);

    // // 🔹 Generate video montage V1
    // const outputFilePath = await createVideoMontage(
    //   videoFilePathAndName,
    //   timestampArray[0]
    // );
    // // 🔹 Generate video montage Single V2
    // const outputFilePath = await createVideoMontageSingleClip(
    //   videoFilePathAndName,
    //   timestampArray[0]
    // );
    // // 🔹 Generate video montage Two timestamps V3
    // const outputFilePath = await createVideoMontageClipFromTwoTimestamps(
    //   videoFilePathAndName,
    //   timestampArray
    // );
    // 🔹 Generate video montage Two timestamps V4
    const outputFilePath = await createVideoMontage04(
      videoFilePathAndName,
      timestampArray
    );

    res.json({
      result: true,
      message: "Video montage created successfully",
      montagePath: outputFilePath,
    });
  } catch (error) {
    console.error("Error creating video montage:", error);
    res.status(500).json({
      result: false,
      message: "Internal Server Error",
      error: error.message,
    });
  }
});

// 🔹 POST /videos/montage-service/queue-a-job: Queue a job to process a video montage
router.post(
  "/montage-service/queue-a-job",
  authenticateToken,
  async (req, res) => {
    console.log("Received request to queue a job...");
    // const { videoId, timestampArray } = req.body;
    const { videoId, actionsArray, token } = req.body;
    const user = req.user;
    // const timestampArray = [13, 19];
    const videoObj = await Video.findByPk(videoId);

    if (!videoObj) {
      return res
        .status(404)
        .json({ result: false, message: "Video not found" });
    }
    // const videoFilePathAndName = path.join(
    //   process.env.PATH_VIDEOS,
    //   videoObj.filename
    // );

    const KV_VIDEO_PROCESSOR_PATH = path.join(
      process.env.PATH_KV_VIDEO_PROCESSOR, // e.g., "/Users/nick/Documents/KyberVisionVideoProcessor"
      process.env.NAME_KV_VIDEO_PROCESSOR // e.g., "videoProcessor.js"
    );
    console.log(
      `- Create video montage step #1: in API GET /montage-service/queue-a-job -`
    );
    try {
      // Add job to the queue
      jobQueue.addJob(
        KV_VIDEO_PROCESSOR_PATH,
        videoObj.filename,
        actionsArray,
        user,
        token
      ); // Pass arguments to queue
      res.json({ message: "Job successfully queued and processed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to process job" });
    }
  }
);

// 🔹 POST /videos/montage-service/video-completed-notify-user: Video montage completed
router.post(
  "/montage-service/video-completed-notify-user",
  authenticateToken,
  async (req, res) => {
    console.log("- in POST /montage-service/video-completed-notify-user");
    const { filename } = req.body;
    const userId = req.user.id;
    console.log(`headers: ${JSON.stringify(req.headers)}`);
    writeRequestArgs(req.body, "-04-montage-service");
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ result: false, message: "User not found" });
    }
    console.log(`filename: ${filename}`);
    console.log(`userId: ${userId}`);

    // 🔹 Send email notification
    const tokenizedFilename = jwt.sign({ filename }, process.env.JWT_SECRET);
    // let montageUrl;
    // if (process.env.NODE_ENV === "workstation") {
    //   montageUrl = `http://${req.get(
    //     "host"
    //   )}/videos/montage-service/finished-video/${tokenizedFilename}`;
    // } else {
    //   montageUrl = `https://api.kv11.dashanddata.com/videos/montage-service/finished-video/${tokenizedFilename}`;
    // }
    await sendVideoMontageCompleteNotificationEmail(
      user.email,
      tokenizedFilename
    );
    // console.log(`-------> IT WORKED !!!!! --------`);
    res.json({ result: true, message: "Email sent successfully" });
  }
);
// 🔹 GET /videos/montage-service/play-video/:tokenizedMontageFilename: Play video montage in browser
router.get(
  "/montage-service/play-video/:tokenizedMontageFilename",
  (req, res) => {
    console.log(
      "- in GET /montage-service/play-video/:tokenizedMontageFilename"
    );
    const { tokenizedMontageFilename } = req.params;

    // 🔹 Verify token
    jwt.verify(
      tokenizedMontageFilename,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ result: false, message: "Invalid token" });
        }

        const { filename } = decoded; // Extract full path
        console.log(`📂 Decoded filename: ${filename}`);
        const videoFilePathAndName = path.join(
          process.env.PATH_VIDEOS_MONTAGE_COMPLETE,
          filename
        );
        console.log(`📂 Video file path: ${videoFilePathAndName}`);
        // 🔹 Check if the file exists
        if (!fs.existsSync(videoFilePathAndName)) {
          return res
            .status(404)
            .json({ result: false, message: "File not found" });
        }

        // 🔹 Send the file
        res.sendFile(videoFilePathAndName, (err) => {
          if (err) {
            console.error("❌ Error sending file:", err);
            res
              .status(500)
              .json({ result: false, message: "Error sending file" });
          } else {
            console.log("✅ Video sent successfully");
            res.setHeader("Content-Type", "video/mp4"); // No `Content-Disposition`
            res.sendFile(videoFilePathAndName);
          }
        });
      }
    );
  }
);

// 🔹 GET /videos/montage-service/download-video/:tokenizedMontageFilename: Download video montage
router.get(
  "/montage-service/download-video/:tokenizedMontageFilename",
  (req, res) => {
    console.log(
      "- in GET /montage-service/download-video/:tokenizedMontageFilename"
    );

    const { tokenizedMontageFilename } = req.params;

    // 🔹 Verify token
    jwt.verify(
      tokenizedMontageFilename,
      process.env.JWT_SECRET,
      (err, decoded) => {
        if (err) {
          return res
            .status(401)
            .json({ result: false, message: "Invalid token" });
        }

        const { filename } = decoded; // Extract full path
        console.log(`📂 Decoded filename: ${filename}`);

        const videoFilePathAndName = path.join(
          process.env.PATH_VIDEOS_MONTAGE_COMPLETE,
          filename
        );

        // 🔹 Check if the file exists
        if (!fs.existsSync(videoFilePathAndName)) {
          return res
            .status(404)
            .json({ result: false, message: "File not found" });
        }

        // ✅ **Force Download Instead of Playing**
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${path.basename(videoFilePathAndName)}"`
        );
        res.setHeader("Content-Type", "application/octet-stream");

        // ✅ **Send File**
        res.sendFile(videoFilePathAndName, (err) => {
          if (err) {
            console.error("❌ Error sending file:", err);
            if (!res.headersSent) {
              res
                .status(500)
                .json({ result: false, message: "Error sending file" });
            }
          } else {
            console.log("✅ Video sent successfully for download");
          }
        });
      }
    );
  }
);

// // 🔹 GET /videos/montage-service/finished-video/:tokenizedMontageFilename: Video montage completed
// router.get(
//   "/montage-service/finished-video/:tokenizedMontageFilename",
//   (req, res) => {
//     console.log(
//       "- in GET /montage-service/finished-video/:tokenizedMontageFilename"
//     );

//     const { tokenizedMontageFilename } = req.params;

//     // 🔹 Verify token
//     jwt.verify(
//       tokenizedMontageFilename,
//       process.env.JWT_SECRET,
//       (err, decoded) => {
//         if (err) {
//           return res
//             .status(401)
//             .json({ result: false, message: "Invalid token" });
//         }

//         const { filename } = decoded; // Extract full path
//         console.log(`📂 Decoded filename: ${filename}`);

//         // 🔹 Check if the file exists
//         if (!fs.existsSync(filename)) {
//           return res
//             .status(404)
//             .json({ result: false, message: "File not found" });
//         }

//         // 🔹 Send the file
//         res.sendFile(filename, (err) => {
//           if (err) {
//             console.error("❌ Error sending file:", err);
//             res
//               .status(500)
//               .json({ result: false, message: "Error sending file" });
//           } else {
//             console.log("✅ Video sent successfully");
//           }
//         });
//       }
//     );
//   }
// );
// router.get(
//   "/montage-service/finished-video/:tokenizedMontageFilename",
//   (req, res) => {
//     console.log(
//       "- in GET /montage-service/finished-video/:tokenizedMontageFilename"
//     );
//     const { tokenizedMontageFilename } = req.params;

//     // 🔹 Verify token
//     jwt.verify(
//       tokenizedMontageFilename,
//       process.env.JWT_SECRET,
//       (err, decoded) => {
//         if (err) {
//           return res
//             .status(401)
//             .json({ result: false, message: "Invalid token" });
//         }
//         const { filename } = decoded;
//         console.log(`filename: ${filename}`);
//         res.json({
//           result: true,
//           message: "Video montage completed",
//           filename,
//         });
//       }
//     );
//   }
// );

module.exports = router;
