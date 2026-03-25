const cron = require("node-cron");
const Membership = require("../models/Membership");

/* 
 * Job: Daily Membership Lifecycle Check (2-Stage Cascade)
 * Schedule: Runs every day at midnight server-time ("0 0 * * *")
 * Action: 
 *   1) Finds 'active' memberships past endDate -> moves to 'grace', sets graceUntil = 3 days from now.
 *   2) Finds 'grace' memberships past graceUntil -> moves to 'expired'.
 */

cron.schedule("0 0 * * *", async () => {
    try {
        const { expireMemberships, markGraceExpired } = require("../services/membershipService");

        // 1. Stage 1: Active -> Grace
        const graceCount = await expireMemberships();

        // 2. Stage 2: Grace -> Expired
        const expireCount = await markGraceExpired();

        console.log(`[Job Admin] Cron executing Service Abstractions: ${graceCount} moved to grace. ${expireCount} permanently expired.`);
    } catch (error) {
        console.error("[Job Admin] Failed to execute membership lifecycle check natively through Service API:", error);
    }
});

module.exports = cron;
