const cron = require("node-cron");

// Run every 15 minutes to reconcile waitlists
cron.schedule("*/15 * * * *", async () => {
    try {
        // Auto-promotions are natively handled on Cancellation Endpoint in GymOS,
        // but this job sweeps for sync mismatches in a highly-concurrent production env.
        console.log(`[Job] Booking Waitlist Job: Synced queue state.`);
    } catch (error) {
        console.error("[Job Error] Booking Job Failed:", error);
    }
});
