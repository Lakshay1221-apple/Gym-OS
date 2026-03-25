const express = require("express");
const router = express.Router();
const { createClass, getClasses, bookClass, cancelBooking } = require("../controllers/classController");
const { protect, trainerOrAdmin } = require("../middleware/authMiddleware");

router.route("/")
    .get(protect, getClasses)
    .post(protect, trainerOrAdmin, createClass);

router.post("/:id/book", protect, bookClass);
router.post("/:id/cancel", protect, cancelBooking);

module.exports = router;
