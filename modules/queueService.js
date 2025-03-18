const { spawn } = require("child_process");
const path = require("path");

// NOTE: for som reason I cannot load env vars so we accept KV_VIDEO_PROCESSOR_PATH as a parameter

class JobQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Add a job to the queue
  addJob(videoFilePathAndName, timestampArray, KV_VIDEO_PROCESSOR_PATH) {
    this.queue.push({
      videoFilePathAndName,
      timestampArray,
      KV_VIDEO_PROCESSOR_PATH,
    });
    this.processQueue(); // Process jobs asynchronously
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { videoFilePathAndName, timestampArray, KV_VIDEO_PROCESSOR_PATH } =
      this.queue.shift(); // Get next job

    console.log(`🎬 Processing job for: ${videoFilePathAndName}`);

    // const jobScriptPath =
    //   "/Users/nick/Documents/KyberVisionVideoProcessor/videoProcessor.js";
    // const jobScriptPath = path.join(
    //   process.env.PATH_KV_VIDEO_PROCESSOR,
    //   process.env.NAME_KV_VIDEO_PROCESSOR
    // );

    // Spawn the KyberVisionVideoProcessor with arguments
    const process = spawn("node", [
      KV_VIDEO_PROCESSOR_PATH,
      videoFilePathAndName,
      JSON.stringify(timestampArray),
    ]);

    // Log outputs
    process.stdout.on("data", (data) => console.log(`Job Output: ${data}`));
    process.stderr.on("data", (data) => console.error(`Job Error: ${data}`));

    process.on("close", (code) => {
      console.log(`✅ Job finished with code ${code}`);
      this.isProcessing = false;
      this.processQueue(); // Start the next job if available
    });

    process.on("error", (err) => {
      console.error("❌ Error running job:", err);
      this.isProcessing = false;
      this.processQueue(); // Ensure queue continues processing
    });
  }
}

// Create a global job queue instance
const jobQueue = new JobQueue();
module.exports = jobQueue;
