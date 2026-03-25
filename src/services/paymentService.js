const mongoose = require("mongoose");
const Payment = require("../models/Payment");
const { createMembershipFromPlan } = require("./membershipService");
const { logAction } = require("./auditService");
const { notify } = require("./notificationService");

/**
 * Atomically records the payment and provisions a membership in one transaction.
 * If either write fails the whole operation rolls back — no orphaned payments,
 * no memberships without a backing payment.
 *
 * Requires MongoDB replica set (transactions are not supported on standalone nodes).
 */
const processPaymentAndSubscribe = async (memberId, planId, amount, currency, method, gymId, createdById) => {
    const session = await mongoose.startSession();

    let payment;
    let planMeta; // plan + membership stored for post-commit side effects

    try {
        await session.withTransaction(async () => {
            // 1. Record the payment
            const [created] = await Payment.create(
                [{ member: memberId, amount, currency: currency || "INR", method, gym: gymId, status: "completed", createdBy: createdById }],
                { session }
            );
            payment = created;

            // 2. Provision access when a plan is being purchased
            if (planId) {
                const { membership, plan } = await createMembershipFromPlan(memberId, planId, gymId, createdById, session);
                payment.membership = membership._id;
                await payment.save({ session });
                planMeta = { plan, membership };
            }
        });
    } finally {
        session.endSession();
    }

    // ── Post-commit side effects ──────────────────────────────────────────────
    // Fire AFTER the transaction commits so they never run on a rollback
    // and never duplicate on a Mongo driver retry.

    logAction({
        actor: createdById,
        action: "payment.created",
        entityType: "Payment",
        entityId: payment._id,
        gym: gymId,
        metadata: { amount, method, currency: currency || "INR" },
    });

    notify({
        userId: memberId,
        title: "Payment Received",
        message: `Your payment of ${currency || "INR"} ${amount} via ${method} has been recorded successfully.`,
    });

    if (planMeta) {
        const { plan, membership } = planMeta;

        logAction({
            actor: createdById,
            action: "membership.created",
            entityType: "Membership",
            entityId: membership._id,
            gym: gymId,
            metadata: { planId, planName: plan.name, durationDays: plan.durationDays },
        });

        notify({
            userId: memberId,
            title: "Membership Activated",
            message: `Your "${plan.name}" membership is now active until ${membership.endDate.toDateString()}.`,
        });
    }

    return payment;
};

module.exports = { processPaymentAndSubscribe };
