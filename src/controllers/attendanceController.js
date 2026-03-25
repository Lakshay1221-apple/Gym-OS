const Attendance = require("../models/Attendance");
const Membership = require("../models/Membership");
const asyncHandler = require("express-async-handler");

// @desc    User Check-in
// @route   POST /api/attendance/checkin
// @access  Private
const checkIn = asyncHandler(async (req, res) => {
    const { method } = req.body;

    const activeMembership = await Membership.findOne({
        member: req.user._id,
        status: "active",
    });

    if (!activeMembership) {
        res.status(403);
        throw new Error("Access Denied: No active membership found");
    }

    if (new Date() > activeMembership.endDate) {
        res.status(403);
        throw new Error("Access Denied: Membership has expired");
    }

    const activeAttendance = await Attendance.findOne({
        member: req.user._id,
        checkOutTime: { $exists: false },
    });

    if (activeAttendance) {
        res.status(400);
        throw new Error("User is already checked in");
    }

    const attendance = await Attendance.create({
        member: req.user._id,
        membership: activeMembership._id,
        gym: req.user.gym,
        checkInTime: new Date(),
        method: method || "manual",
    });

    res.status(201).json(attendance);
});

// @desc    User Check-out
// @route   POST /api/attendance/checkout
// @access  Private
const checkOut = asyncHandler(async (req, res) => {
    const attendance = await Attendance.findOne({
        member: req.user._id,
        checkOutTime: { $exists: false },
    });

    if (!attendance) {
        res.status(400);
        throw new Error("User is not currently checked in");
    }

    attendance.checkOutTime = new Date();
    await attendance.save();

    res.json({ message: "Checked out successfully", attendance });
});

// @desc    Get Specific Member's Attendance History
// @route   GET /api/attendance/member/:id?page=1&limit=20
// @access  Private
const getMemberAttendance = asyncHandler(async (req, res) => {
    const { id } = req.params;

    if (req.user._id.toString() !== id && req.user.role !== "admin") {
        res.status(403);
        throw new Error("Not authorized to view this attendance history");
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
        Attendance.find({ member: id })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .populate("membership", "startDate endDate status")
            .lean(),
        Attendance.countDocuments({ member: id }),
    ]);

    res.json({
        data: history,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
});

// @desc    Get Global Daily Attendance
// @route   GET /api/attendance/today
// @access  Private/Admin/Trainer
const getDailyAttendance = asyncHandler(async (req, res) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const dailyLogs = await Attendance.find({
        gym: req.user.gym,
        checkInTime: {
            $gte: today,
            $lt: tomorrow
        }
    })
    .sort({ checkInTime: -1 })
    .populate("member", "name email")
    .lean();

    res.json(dailyLogs);
});

module.exports = {
    checkIn,
    checkOut,
    getMemberAttendance,
    getDailyAttendance,
};
