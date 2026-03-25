const express = require("express");
const router = express.Router();
const {
    startSession,
    addSet,
    finishSession,
    getHistory,
    getExercises,
} = require("../controllers/workoutController");
const { protect } = require("../middleware/authMiddleware");

router.post("/start", protect, startSession);
router.post("/add-set", protect, addSet);
router.post("/finish", protect, finishSession);
router.get("/history", protect, getHistory);
router.get("/exercises", protect, getExercises);

module.exports = router;
