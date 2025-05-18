const express = require("express");
const router = express.Router();
const { Video } = require("kybervision15db");
const path = require("path");
const fs = require("fs");
// const axios = require("axios");

router.get("/:videoId", async (req, res) => {
  console.log("- in GET /video-stream/:videoId");
  // Ensure there is a range given for the video
  const range = req.headers.range;
  if (!range) {
    return res.status(400).send("Requires Range header");
  }
  const videoId = req.params.videoId;
  const videoObj = await Video.findByPk(videoId);
  if (!videoObj) {
    return res.status(404).json({ result: false, message: "Video not found" });
  }
  // get video stats (about 61MB)
  //   const videoPath = "bigbuck.mp4";
  // const videoPath = path.join(process.env.PATH_VIDEOS, videoObj.filename);
  const videoPath = path.join(videoObj.pathToVideoFile, videoObj.filename);
  const videoSize = fs.statSync(videoPath).size;

  // Parse Range
  // Example: "bytes=32324-"
  const CHUNK_SIZE = 10 ** 6; // 1MB
  const start = Number(range.replace(/\D/g, ""));
  const end = Math.min(start + CHUNK_SIZE, videoSize - 1);

  // Create headers
  const contentLength = end - start + 1;
  const headers = {
    "Content-Range": `bytes ${start}-${end}/${videoSize}`,
    "Accept-Ranges": "bytes",
    "Content-Length": contentLength,
    "Content-Type": "video/mp4",
  };

  // HTTP Status 206 for Partial Content
  res.writeHead(206, headers);

  // create video read stream for this particular chunk
  const videoStream = fs.createReadStream(videoPath, { start, end });

  // Stream the video chunk to the client
  videoStream.pipe(res);
});

module.exports = router;
