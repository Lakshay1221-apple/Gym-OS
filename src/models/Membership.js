const mongoose = require("mongoose");

const membershipSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        gym: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        plan: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "MembershipPlan",
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
            required: true,
        },
        graceUntil: {
            type: Date,
        },
        expirationEmailSent: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["pending", "active", "grace", "expired", "cancelled"],
            default: "active",
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

membershipSchema.index({ member: 1 });
membershipSchema.index({ status: 1 });
membershipSchema.index({ endDate: 1 });

// Check if model already exists to prevent OverwriteModelError
const Membership = mongoose.models.Membership || mongoose.model("Membership", membershipSchema);

module.exports = Membership;
