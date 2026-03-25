const express = require("express");
const router = express.Router();
const {
    getPlans,
    createPlan
} = require("../controllers/membershipController");
const { protect, admin } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { createPlanSchema } = require("../validations/plan.schemas");

// Public
router.route("/").get(getPlans);

// Admin Only
router.route("/").post(protect, admin, validateRequest(createPlanSchema), createPlan);

module.exports = router;
