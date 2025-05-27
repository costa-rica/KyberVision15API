const express = require("express");
const { authenticateToken } = require("../modules/userAuthentication");
const router = express.Router();

// 🔹 POST /test-queuer/add-job
router.post("/add-job", authenticateToken, async (req, res) => {
  console.log("- in POST /test-queuer/add-job");

  try {
    const response = await fetch("http://localhost:8003/test-jobs/add", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      // body: JSON.stringify({ queueName: "KyberVisionTestJob03" }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("❌ Failed to queue job:", text);
      return res
        .status(500)
        .json({ result: false, message: "Failed to queue test job" });
    }

    const data = await response.json();
    console.log("✅ Queuer response:", data);

    res.json({
      result: true,
      message: "Job successfully queued",
      queuerResponse: data,
    });
  } catch (error) {
    console.error("❌ Error calling test job endpoint:", error);
    res.status(500).json({
      result: false,
      message: "Internal error triggering test job",
      error: error.message,
    });
  }
});

module.exports = router;
