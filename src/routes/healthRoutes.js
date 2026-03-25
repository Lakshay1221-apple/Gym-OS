const express = require("express");
const router = express.Router();
const { logNutrition, getDailyNutrition, logRecovery, getRecoveryTrends } = require("../controllers/healthController");
const { protect } = require("../middleware/authMiddleware");

router.post("/nutrition", protect, logNutrition);
router.get("/nutrition/daily", protect, getDailyNutrition);

router.post("/recovery", protect, logRecovery);
router.get("/recovery/trends", protect, getRecoveryTrends);

module.exports = router;
