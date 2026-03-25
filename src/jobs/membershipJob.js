const cron = require("node-cron");
const Membership = require("../models/Membership");

// Run daily at midnight
cron.schedule("0 0 * * *", async () => {
    try {
        const expired = await Membership.find({
            status: "active",
            endDate: { $lt: new Date() },
        });

        for (const membership of expired) {
            membership.status = "expired";
            await membership.save();
        }

        console.log(`[Job] Membership Job: processed ${expired.length} expirations.`);
    } catch (error) {
        console.error("[Job Error] Membership Job Failed:", error);
    }
});
