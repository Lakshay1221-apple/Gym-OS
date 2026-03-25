const express = require("express");
const router = express.Router();

const {
    getRevenueMetrics,
    getAttendanceMetrics,
    getMembershipMetrics,
    getTrainerMetrics,
} = require("../controllers/analyticsController");

const { protect, admin } = require("../middleware/authMiddleware");

// All metrics are implicitly highly-secure business assets and require Admin capabilities
router.use(protect, admin);

router.get("/revenue", getRevenueMetrics);
router.get("/attendance", getAttendanceMetrics);
router.get("/memberships", getMembershipMetrics);
router.get("/trainers", getTrainerMetrics);

module.exports = router;
