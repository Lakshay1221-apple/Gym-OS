const mongoose = require("mongoose");

const auditLogSchema = new mongoose.Schema(
    {
        actor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        action: {
            type: String,
            required: true,
            // e.g. "membership.created", "payment.refunded", "plan.updated"
        },
        entityType: {
            type: String,
            required: true,
            // e.g. "Membership", "Payment", "MembershipPlan"
        },
        entityId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
        },
        gym: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
        },
        metadata: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
    },
    {
        timestamps: true,
    }
);

auditLogSchema.index({ gym: 1, createdAt: -1 });
auditLogSchema.index({ actor: 1 });
auditLogSchema.index({ entityType: 1, entityId: 1 });

const AuditLog = mongoose.models.AuditLog || mongoose.model("AuditLog", auditLogSchema);

module.exports = AuditLog;
