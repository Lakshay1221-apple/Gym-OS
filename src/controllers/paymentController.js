const Payment = require("../models/Payment");
const Membership = require("../models/Membership");
const MembershipPlan = require("../models/MembershipPlan");
const { processPaymentAndSubscribe } = require("../services/paymentService");
const { logAction } = require("../services/auditService");

// @desc    Record a completed payment natively mapping to POS operations
// @route   POST /api/payments
// @access  Private/Admin
const createPayment = async (req, res) => {
    const { memberId, amount, method, planId, currency } = req.body;

    try {
        const payment = await processPaymentAndSubscribe(
            memberId,
            planId,
            amount,
            currency,
            method,
            req.user.gym,
            req.user._id
        );

        res.status(201).json(payment);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get member's individual payments
// @route   GET /api/payments/member/:id
// @access  Private
const getMemberPayments = async (req, res) => {
    const { id } = req.params;

    try {
        if (req.user._id.toString() !== id && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view these payments" });
        }

        const payments = await Payment.find({ member: id })
            .sort({ createdAt: -1 })
            .populate("membership", "startDate endDate status")
            .lean();

        res.json(payments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all payments globally
// @route   GET /api/payments?page=1&limit=20
// @access  Private/Admin
const getAllPayments = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [payments, total] = await Promise.all([
            Payment.find({ gym: req.user.gym })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .populate("member", "name email")
                .populate("membership")
                .lean(),
            Payment.countDocuments({ gym: req.user.gym }),
        ]);

        res.json({
            data: payments,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Refund a specific payment
// @route   POST /api/payments/:id/refund
// @access  Private/Admin
const refundPayment = async (req, res) => {
    try {
        const payment = await Payment.findById(req.params.id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }

        if (payment.status === "refunded") {
            return res.status(400).json({ message: "Payment already refunded" });
        }

        payment.status = "refunded";
        await payment.save();

        logAction({
            actor: req.user._id,
            action: "payment.refunded",
            entityType: "Payment",
            entityId: payment._id,
            gym: payment.gym,
            metadata: { amount: payment.amount, method: payment.method },
        });

        res.json({ message: "Payment status updated to refunded", payment });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createPayment,
    getMemberPayments,
    getAllPayments,
    refundPayment,
};
