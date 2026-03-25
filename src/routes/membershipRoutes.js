const express = require("express");
const router = express.Router();
const {
    purchaseMembership,
    getMemberMembership,
    getAllMemberships,
    cancelMembership,
} = require("../controllers/membershipController");
const { protect, admin } = require("../middleware/authMiddleware");

router.get("/", protect, admin, getAllMemberships);
router.post("/purchase", protect, admin, purchaseMembership);
router.get("/member/:memberId", protect, getMemberMembership);
router.patch("/:id/cancel", protect, admin, cancelMembership);

module.exports = router;
