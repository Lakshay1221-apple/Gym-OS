const express = require("express");
const router = express.Router();
const validateRequest = require("../middleware/validateRequest");
const { registerSchema, loginSchema } = require("../validations/auth.schemas");

const {
    registerUser,
    registerTenant,
    loginUser,
    getUserProfile,
    logoutUser,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");

router.post("/register", validateRequest(registerSchema), registerUser);
router.post("/register-gym", registerTenant);
router.post("/login", validateRequest(loginSchema), loginUser);
router.post("/logout", protect, logoutUser);
router.route("/profile").get(protect, getUserProfile);

module.exports = router;
