const express = require("express");
const router = express.Router();
const {
    createPayment,
    getMemberPayments,
    getAllPayments,
    refundPayment,
} = require("../controllers/paymentController");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/roleMiddleware");

// Admin financial auditing endpoints
router.route("/")
    .post(protect, admin, createPayment)
    .get(protect, admin, getAllPayments);

router.post("/:id/refund", protect, admin, refundPayment);

// Standard Member fetching personal statements
router.get("/member/:id", protect, getMemberPayments);

module.exports = router;
