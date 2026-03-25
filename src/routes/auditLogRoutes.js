const express = require("express");
const router = express.Router();
const AuditLog = require("../models/AuditLog");
const asyncHandler = require("express-async-handler");
const { protect, admin } = require("../middleware/authMiddleware");

router.use(protect, admin);

// @desc    Get paginated audit logs for the gym
// @route   GET /api/audit-logs?page=1&limit=20&action=payment.refunded
// @access  Private/Admin
router.get("/", asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { gym: req.user.gym };
    if (req.query.action) filter.action = req.query.action;
    if (req.query.entityType) filter.entityType = req.query.entityType;

    const [logs, total] = await Promise.all([
        AuditLog.find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("actor", "name email role")
            .lean(),
        AuditLog.countDocuments(filter),
    ]);

    res.json({
        data: logs,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
}));

module.exports = router;
