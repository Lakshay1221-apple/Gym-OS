const Notification = require("../models/Notification");
const asyncHandler = require("express-async-handler");

// @desc    Get current user's notifications
// @route   GET /api/notifications?page=1&limit=20&unread=true
// @access  Private
const getMyNotifications = asyncHandler(async (req, res) => {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter = { userId: req.user._id };
    if (req.query.unread === "true") filter.read = false;

    const [notifications, total] = await Promise.all([
        Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        Notification.countDocuments(filter),
    ]);

    res.json({
        data: notifications,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

// @desc    Mark a notification as read
// @route   PATCH /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOne({ _id: req.params.id, userId: req.user._id });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    notification.read = true;
    await notification.save();

    res.json({ message: "Notification marked as read", notification });
});

// @desc    Mark all notifications as read
// @route   PATCH /api/notifications/read-all
// @access  Private
const markAllAsRead = asyncHandler(async (req, res) => {
    await Notification.updateMany({ userId: req.user._id, read: false }, { $set: { read: true } });
    res.json({ message: "All notifications marked as read" });
});

module.exports = { getMyNotifications, markAsRead, markAllAsRead };
