const express = require("express");
const router = express.Router();
const { logMetrics, getHistory } = require("../controllers/biometricController");
const { protect } = require("../middleware/authMiddleware");

router.post("/log", protect, logMetrics);
router.get("/history", protect, getHistory);

module.exports = router;
