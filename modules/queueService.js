const { spawn } = require("child_process");

class JobQueue {
  constructor() {
    this.queue = [];
    this.isProcessing = false;
  }

  // Add a job to the queue
  addJob(videoFilePathAndName, timestampArray) {
    this.queue.push({ videoFilePathAndName, timestampArray });
    this.processQueue(); // Process jobs asynchronously
  }

  async processQueue() {
    if (this.isProcessing || this.queue.length === 0) return;

    this.isProcessing = true;
    const { videoFilePathAndName, timestampArray } = this.queue.shift(); // Get next job

    console.log(`🎬 Processing job for: ${videoFilePathAndName}`);

    const jobScriptPath =
      "/Users/nick/Documents/KyberVisionVideoProcessor/videoProcessor.js";

    // Spawn the KyberVisionVideoProcessor with arguments
    const process = spawn("node", [
      jobScriptPath,
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

// const { spawn } = require("child_process");

// class JobQueue {
//   constructor() {
//     this.queue = [];
//     this.isProcessing = false;
//   }

//   // Add a job to the queue
//   addJob() {
//     return new Promise((resolve, reject) => {
//       this.queue.push({ resolve, reject });
//       this.processQueue();
//     });
//   }

//   async processQueue() {
//     if (this.isProcessing || this.queue.length === 0) return;

//     this.isProcessing = true;
//     const job = this.queue.shift(); // Get the first job in the queue

//     console.log("Starting job...");
//     const jobScriptPath =
//       "/Users/nick/Documents/ExampleQueueing01/jobAndRequestWithToken.js";

//     const process = spawn("node", [jobScriptPath]);

//     process.on("close", (code) => {
//       console.log(`Job finished with code ${code}`);
//       this.isProcessing = false;
//       job.resolve(); // Notify that the job is complete
//       this.processQueue(); // Start the next job if available
//     });

//     process.on("error", (err) => {
//       console.error("Error running job:", err);
//       job.reject(err);
//       this.isProcessing = false;
//       this.processQueue();
//     });
//   }
// }

// // Create a global queue instance
// const jobQueue = new JobQueue();

// module.exports = jobQueue;
