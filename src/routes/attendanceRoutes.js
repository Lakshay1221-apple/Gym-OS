const express = require("express");
const router = express.Router();
const {
    checkIn,
    checkOut,
    getMemberAttendance,
    getDailyAttendance,
} = require("../controllers/attendanceController");
const { protect } = require("../middleware/authMiddleware");
const { admin, trainer } = require("../middleware/roleMiddleware");

// Staff Routes (Admin/Trainer)
// We write a quick inline middleware or simply allow both. 
// For now, if either passes, they can view daily global metrics.
const staffOnly = (req, res, next) => {
    if (req.user && (req.user.role === "admin" || req.user.role === "trainer")) {
        next();
    } else {
        res.status(403).json({ message: "Not authorized as staff" });
    }
};

router.get("/today", protect, staffOnly, getDailyAttendance);

// Standard Member Flows
router.post("/checkin", protect, checkIn);
router.post("/checkout", protect, checkOut);
router.get("/member/:id", protect, getMemberAttendance);

// Legacy routing backward compatibility map
router.get("/history", protect, (req, res) => {
    res.redirect(301, `/api/attendance/member/${req.user._id}`);
});

module.exports = router;
