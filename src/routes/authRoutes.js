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
    refreshTokenUser,
    requestPasswordReset,
    confirmPasswordReset,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLoginLimiter, authRegisterLimiter, authResetLimiter } = require("../middleware/rateLimiter");

router.post("/register", authRegisterLimiter, validateRequest(registerSchema), registerUser);
router.post("/register-gym", authRegisterLimiter, registerTenant);
router.post("/login", authLoginLimiter, validateRequest(loginSchema), loginUser);
router.post("/refresh", refreshTokenUser);
router.post("/password-reset-request", authResetLimiter, requestPasswordReset);
router.post("/password-reset-confirm", authResetLimiter, confirmPasswordReset);
router.post("/logout", protect, logoutUser);
router.route("/profile").get(protect, getUserProfile);

module.exports = router;
