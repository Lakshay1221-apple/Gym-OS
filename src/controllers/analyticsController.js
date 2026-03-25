const Payment = require("../models/Payment");
const Attendance = require("../models/Attendance");
const Membership = require("../models/Membership");
const TrainerAssignment = require("../models/TrainerAssignment");

// @desc    Get aggregate revenue metrics
// @route   GET /api/admin/metrics/revenue
// @access  Private (Admin Only)
const getRevenueMetrics = async (req, res) => {
    try {
        const gymId = req.user.gym;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(startOfToday.getFullYear(), startOfToday.getMonth(), 1);

        // Last 30 days window for the daily breakdown chart
        const thirtyDaysAgo = new Date(startOfToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        const metrics = await Payment.aggregate([
            { $match: { gym: gymId, status: "completed" } },
            {
                $facet: {
                    todayRevenue: [
                        { $match: { createdAt: { $gte: startOfToday } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    monthlyRevenue: [
                        { $match: { createdAt: { $gte: startOfMonth } } },
                        { $group: { _id: null, total: { $sum: "$amount" } } }
                    ],
                    totalRevenue: [
                        { $group: { _id: null, total: { $sum: "$amount" }, averageValue: { $avg: "$amount" } } }
                    ],
                    // Daily breakdown — feeds the revenue chart on the dashboard
                    revenueByDay: [
                        { $match: { createdAt: { $gte: thirtyDaysAgo } } },
                        {
                            $group: {
                                _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                                total: { $sum: "$amount" },
                            }
                        },
                        { $sort: { _id: 1 } },
                    ],
                }
            }
        ]);

        res.json({
            today: metrics[0].todayRevenue[0]?.total || 0,
            month: metrics[0].monthlyRevenue[0]?.total || 0,
            total: metrics[0].totalRevenue[0]?.total || 0,
            averagePlanValue: metrics[0].totalRevenue[0]?.averageValue || 0,
            revenueByDay: metrics[0].revenueByDay,  // [{ _id: "2026-03-01", total: 4500 }, ...]
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get aggregate attendance metrics
// @route   GET /api/admin/metrics/attendance
// @access  Private (Admin Only)
const getAttendanceMetrics = async (req, res) => {
    try {
        const gymId = req.user.gym;

        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);

        // Last 30 days for the peak-hours breakdown
        const thirtyDaysAgo = new Date(startOfToday);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 29);

        const metrics = await Attendance.aggregate([
            { $match: { gym: gymId } },
            {
                $facet: {
                    todayTotal: [
                        { $match: { checkInTime: { $gte: startOfToday } } },
                        { $count: "count" }
                    ],
                    activeNow: [
                        { $match: { checkOutTime: { $exists: false } } },
                        { $count: "count" }
                    ],
                    // Peak hours — how many check-ins happened at each hour of the day
                    // Useful for staffing and class scheduling decisions
                    peakHours: [
                        { $match: { checkInTime: { $gte: thirtyDaysAgo } } },
                        {
                            $group: {
                                _id: { $hour: "$checkInTime" },
                                visits: { $sum: 1 },
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $project: { _id: 0, hour: "$_id", visits: 1 } }
                    ],
                }
            }
        ]);

        res.json({
            todayTotal: metrics[0].todayTotal[0]?.count || 0,
            activeNow: metrics[0].activeNow[0]?.count || 0,
            peakHours: metrics[0].peakHours,  // [{ hour: 7, visits: 42 }, { hour: 8, visits: 91 }, ...]
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get aggregate membership metrics
// @route   GET /api/admin/metrics/memberships
// @access  Private (Admin Only)
const getMembershipMetrics = async (req, res) => {
    try {
        const gymId = req.user.gym;

        const metrics = await Membership.aggregate([
            { $match: { gym: gymId } },
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Transform the array into a friendly object
        const transformed = metrics.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { active: 0, grace: 0, expired: 0, cancelled: 0, pending: 0 });

        res.json(transformed);

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get trainer workload metrics
// @route   GET /api/admin/metrics/trainers
// @access  Private (Admin Only)
const getTrainerMetrics = async (req, res) => {
    try {
        const gymId = req.user.gym;

        const metrics = await TrainerAssignment.aggregate([
            { $match: { gym: gymId } },
            {
                $facet: {
                    byStatus: [
                        { $group: { _id: "$status", count: { $sum: 1 } } }
                    ],
                    topTrainers: [
                        { $match: { status: "active" } },
                        { $group: { _id: "$trainer", activeClients: { $sum: 1 } } },
                        { $sort: { activeClients: -1 } },
                        { $limit: 10 },
                        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "trainer" } },
                        { $unwind: "$trainer" },
                        { $project: { "trainer.name": 1, "trainer.email": 1, activeClients: 1 } }
                    ]
                }
            }
        ]);

        const statusMap = metrics[0].byStatus.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
        }, { active: 0, completed: 0, cancelled: 0 });

        res.json({
            byStatus: statusMap,
            topTrainers: metrics[0].topTrainers,
        });

    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    getRevenueMetrics,
    getAttendanceMetrics,
    getMembershipMetrics,
    getTrainerMetrics,
};
