const Membership = require("../models/Membership");
const MembershipPlan = require("../models/MembershipPlan");
const User = require("../models/User");
const { createMembershipFromPlan } = require("../services/membershipService");
const { logAction } = require("../services/auditService");
const { notify } = require("../services/notificationService");

// --- MEMBERSHIP PLANS (STEP 2) ---

const getPlans = async (req, res) => {
    try {
        const query = req.user ? { gym: req.user.gym } : {}; // Allow isolated scope if logged in
        const plans = await MembershipPlan.find(query);
        res.json(plans);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const createPlan = async (req, res) => {
    const { name, durationDays, price, description } = req.body;
    try {
        const plan = await MembershipPlan.create({ name, durationDays, price, description, gym: req.user.gym, createdBy: req.user._id });
        logAction({ actor: req.user._id, action: "plan.created", entityType: "MembershipPlan", entityId: plan._id, gym: req.user.gym, metadata: { name, price } });
        res.status(201).json(plan);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const updatePlan = async (req, res) => {
    try {
        const plan = await MembershipPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        logAction({ actor: req.user._id, action: "plan.updated", entityType: "MembershipPlan", entityId: plan._id, gym: req.user.gym, metadata: req.body });
        res.json(plan);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const deletePlan = async (req, res) => {
    try {
        const plan = await MembershipPlan.findByIdAndDelete(req.params.id);
        if (!plan) return res.status(404).json({ message: "Plan not found" });
        res.json({ message: "Plan removed successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// --- MEMBER SUBSCRIPTIONS (STEP 3) ---

// @desc    Member purchases or is assigned a subscription
// @route   POST /api/memberships/purchase
// @access  Private
const purchaseMembership = async (req, res) => {
    const { memberId, planId } = req.body;
    try {
        const user = await User.findById(memberId);
        if (!user) return res.status(404).json({ message: "Member not found" });

        // Invalidate any current active/grace memberships before issuing a new one
        await Membership.updateMany(
            { member: memberId, status: { $in: ["active", "grace"] } },
            { $set: { status: "cancelled" } }
        );

        const { membership, plan } = await createMembershipFromPlan(memberId, planId, req.user.gym, req.user._id);

        logAction({
            actor: req.user._id,
            action: "membership.created",
            entityType: "Membership",
            entityId: membership._id,
            gym: req.user.gym,
            metadata: { planId, planName: plan.name, durationDays: plan.durationDays },
        });

        notify({
            userId: memberId,
            title: "Membership Activated",
            message: `Your "${plan.name}" membership is now active until ${membership.endDate.toDateString()}.`,
        });

        res.status(201).json(membership);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getMemberMembership = async (req, res) => {
    const { memberId } = req.params;
    try {
        if (req.user._id.toString() !== memberId && req.user.role !== "admin") {
            return res.status(403).json({ message: "Not authorized to view this membership" });
        }
        const memberships = await Membership.find({ member: memberId }).sort({ createdAt: -1 }).populate("plan");
        res.json(memberships);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const getAllMemberships = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const query = { gym: req.user.gym };

        const [memberships, total] = await Promise.all([
            Membership.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).populate("member", "name email").populate("plan", "name price"),
            Membership.countDocuments(query),
        ]);

        res.json({
            data: memberships,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

const cancelMembership = async (req, res) => {
    try {
        const membership = await Membership.findById(req.params.id);
        if (!membership) return res.status(404).json({ message: "Membership not found" });
        if (membership.status === "cancelled") return res.status(400).json({ message: "Membership is already cancelled" });

        membership.status = "cancelled";
        await membership.save();

        logAction({ actor: req.user._id, action: "membership.cancelled", entityType: "Membership", entityId: membership._id, gym: membership.gym });

        res.json({ message: "Membership cancelled successfully", membership });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    // Plans
    getPlans, createPlan, updatePlan, deletePlan,

    // Subscriptions
    purchaseMembership, getMemberMembership, getAllMemberships, cancelMembership
};
