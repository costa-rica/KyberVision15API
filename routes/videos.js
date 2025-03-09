const express = require("express");
const { authenticateToken } = require("../middleware/auth");
const router = express.Router();
const Video = require("../models/Video");
const Match = require("../models/Match");
const { upload, deleteVideo } = require("../modules/videoProcessing");
const path = require("path");
const fs = require("fs");
const { getMatchWithTeams } = require("../modules/match");
const ffmpeg = require("fluent-ffmpeg");

// // 🔹 Upload Video (POST /upload)
// router.post(
//   "/upload",
//   authenticateToken,
//   upload.single("video"),
//   async (req, res) => {
//     try {
//       console.log("- in POST /upload");

//       const user = req.user;
//       console.log(`User ID: ${user.id}`);

//       const { matchId } = req.body;

//       if (!matchId) {
//         return res
//           .status(400)
//           .json({ result: false, message: "matchId is required" });
//       }

//       if (!req.file) {
//         return res
//           .status(400)
//           .json({ result: false, message: "No video file uploaded" });
//       }

//       const videoPath = path.join(process.env.PATH_VIDEOS, req.file.filename);

//       // Step 1: Extract Metadata (video creation time)
//       const getVideoMetadata = async (filePath) => {
//         return new Promise((resolve, reject) => {
//           ffmpeg.ffprobe(filePath, (err, metadata) => {
//             if (err) return reject(err);

//             const creationTime = metadata?.format?.tags?.creation_time;
//             resolve(creationTime ? new Date(creationTime) : new Date());
//           });
//         });
//       };

//       const videoCreatedAt = await getVideoMetadata(videoPath);

//       // Step 2: Create video entry with extracted metadata
//       const newVideo = await Video.create({
//         matchId: parseInt(matchId, 10),
//         filename: req.file.filename,
//         url: "placeholder",
//         videoFileCreatedTimestamp: videoCreatedAt, // Store extracted timestamp
//       });

//       // Step 3: Generate correct video URL
//       const videoURL = `https://${req.get("host")}/videos/${newVideo.id}`;

//       // Step 4: Update video entry with final URL
//       await newVideo.update({ url: videoURL });

//       res.status(201).json({
//         result: true,
//         message: "Video uploaded successfully",
//         video: newVideo,
//       });
//     } catch (error) {
//       console.error("Error uploading video:", error);
//       res.status(500).json({
//         result: false,
//         message: "Internal Server Error",
//         error: error.message,
//       });
//     }
//   }
// );

// 🔹 Upload Video (POST /upload)
router.post(
  "/upload",
  authenticateToken,
  upload.single("video"), // Expecting a file with field name "video"
  async (req, res) => {
    try {
      console.log("- in POST /upload");

      const user = req.user;
      console.log(`User ID: ${user.id}`);

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

      // Step 1: Create video entry with placeholder URL
      const newVideo = await Video.create({
        matchId: parseInt(matchId, 10),
        filename: req.file.filename,
        url: "placeholder", // Temporary placeholder
      });

      // Step 2: Generate the correct URL
      const videoURL = `https://${req.get("host")}/videos/${newVideo.id}`;

      // Step 3: Update video entry with the correct URL
      await newVideo.update({ url: videoURL });

      res.status(201).json({
        result: true,
        message: "Video uploaded successfully",
        video: newVideo,
      });
    } catch (error) {
      console.error("Error uploading video:", error);
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

module.exports = router;
