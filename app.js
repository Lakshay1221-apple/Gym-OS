const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./src/config/swagger");
const { errorHandler } = require("./src/middleware/errorMiddleware");

const app = express();

app.use(express.json());
app.use(cors());

// HTTP request logging — silenced in test env to keep output clean
if (process.env.NODE_ENV !== "test") {
    const morgan = require("morgan");
    const logger = require("./src/utils/logger");
    app.use(morgan("dev", { stream: logger.stream }));
}

// ── Routes ────────────────────────────────────────────────────────────────────
const authRoutes = require("./src/routes/authRoutes");
const membershipRoutes = require("./src/routes/membershipRoutes");
const planRoutes = require("./src/routes/planRoutes");
const attendanceRoutes = require("./src/routes/attendanceRoutes");
const workoutRoutes = require("./src/routes/workoutRoutes");
const biometricRoutes = require("./src/routes/biometricRoutes");
const paymentRoutes = require("./src/routes/paymentRoutes");
const programRoutes = require("./src/routes/programRoutes");
const analyticsRoutes = require("./src/routes/analyticsRoutes");
const notificationRoutes = require("./src/routes/notificationRoutes");
const auditLogRoutes = require("./src/routes/auditLogRoutes");

// ── Rate Limiters ─────────────────────────────────────────────────────────────
// Disabled in test env — repeated fixture calls would hit limits
const isTest = process.env.NODE_ENV === "test";

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 1000 : 10,
    message: { message: "Too many login/register attempts from this IP, please try again after 15 minutes" },
});

const checkInLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 1000 : 3,
    message: { message: "Too many check-in requests, please wait a minute" },
});

const generalLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 10000 : 100,
    message: { message: "Too many requests from this IP, please try again later" },
});

app.use("/api", generalLimiter);

// ── Route Mounting ────────────────────────────────────────────────────────────
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/attendance/checkin", checkInLimiter);

app.use("/api/memberships", membershipRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/workout", workoutRoutes);
app.use("/api/programs", programRoutes);
app.use("/api/biometrics", biometricRoutes);

app.use("/api/admin/metrics", analyticsRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/audit-logs", auditLogRoutes);

// ── API Documentation ─────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// ── Health Check ──────────────────────────────────────────────────────────────
app.get("/health", (req, res) => {
    const mongoose = require("mongoose");
    const dbState = mongoose.connection.readyState;
    res.json({
        status: "ok",
        database: dbState === 1 ? "connected" : "disconnected",
        uptime: Math.floor(process.uptime()),
    });
});

app.get("/", (req, res) => res.send("GymOS API Running"));

app.use(errorHandler);

module.exports = app;
