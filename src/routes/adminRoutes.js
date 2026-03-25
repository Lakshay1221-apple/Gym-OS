const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { createAdminUserSchema } = require("../validations/auth.schemas");
const { createAdminUser } = require("../controllers/authController");
const { protect, admin } = require("../middleware/authMiddleware");

router.post("/create-user", protect, admin, validateRequest(createAdminUserSchema), createAdminUser);

module.exports = router;
