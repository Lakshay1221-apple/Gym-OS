const Membership = require("../models/Membership");
const MembershipPlan = require("../models/MembershipPlan");

/**
 * Pure DB write — creates a membership document.
 * Side effects (audit, notification) are intentionally left to the caller
 * so they never fire inside a retrying transaction.
 *
 * @param {string}        memberId
 * @param {string}        planId
 * @param {string}        gymId
 * @param {string}        createdById
 * @param {ClientSession} [session]   — pass when called inside a Mongo transaction
 * @returns {{ membership, plan }}
 */
const createMembershipFromPlan = async (memberId, planId, gymId, createdById, session = null) => {
    const plan = await MembershipPlan.findById(planId).session(session);
    if (!plan) throw new Error("Membership plan not found");

    const startDate = new Date();
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + plan.durationDays);

    // When a session is active, create() requires an array to get back an array
    const docs = await Membership.create(
        [{ member: memberId, plan: planId, gym: gymId, startDate, endDate, status: "active", createdBy: createdById }],
        session ? { session } : {}
    );
    const membership = docs[0];

    return { membership, plan };
};

/**
 * Sweeps all Active Memberships and downgrades them to Grace if past End Date.
 */
const expireMemberships = async () => {
    const now = new Date();
    const graceEnd = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000); // 3-day grace period

    const graceResult = await Membership.updateMany(
        { status: "active", endDate: { $lt: now } },
        { $set: { status: "grace", graceUntil: graceEnd } }
    );
    return graceResult.modifiedCount;
};

/**
 * Sweeps all Grace Memberships and downgrades them to Expired if past Grace Date.
 */
const markGraceExpired = async () => {
    const now = new Date();

    const expireResult = await Membership.updateMany(
        { status: "grace", graceUntil: { $lt: now } },
        { $set: { status: "expired" } }
    );
    return expireResult.modifiedCount;
};

module.exports = {
    createMembershipFromPlan,
    expireMemberships,
    markGraceExpired,
};
