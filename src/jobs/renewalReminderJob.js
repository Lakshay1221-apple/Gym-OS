const cron = require("node-cron");
const Membership = require("../models/Membership");
const { notify } = require("../services/notificationService");

/*
 * Job: Daily Renewal Reminders
 * Schedule: Runs every day at 8:00 AM server-time ("0 8 * * *")
 * Action: Finds all 'active' memberships expiring exactly 3 days from now and triggers notifications.
 */

cron.schedule("0 8 * * *", async () => {
    console.log("[Job] Running daily renewal reminders...");

    try {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Calculate timebounds precisely for 3 days from today
        const threeDaysFromNowStart = new Date(today);
        threeDaysFromNowStart.setDate(threeDaysFromNowStart.getDate() + 3);

        const threeDaysFromNowEnd = new Date(threeDaysFromNowStart);
        threeDaysFromNowEnd.setDate(threeDaysFromNowEnd.getDate() + 1);

        const expiringMemberships = await Membership.find({
            status: "active",
            expirationEmailSent: false,
            endDate: {
                $gte: threeDaysFromNowStart,
                $lt: threeDaysFromNowEnd
            }
        }).populate("member", "name email");

        if (expiringMemberships.length > 0) {
            console.log(`[Job] Found ${expiringMemberships.length} memberships expiring in exactly 3 days.`);

            for (const sub of expiringMemberships) {
                console.log(` > NOTIFICATION: Sending reminder to ${sub.member.name} (${sub.member.email}) expiring on ${sub.endDate.toLocaleDateString()}`);

                notify({
                    userId: sub.member._id,
                    title: "Membership Expiring Soon",
                    message: `Your membership expires on ${sub.endDate.toDateString()}. Renew now to keep your access.`,
                });

                // Idempotency: Lock the flag so this can never be sent again
                sub.expirationEmailSent = true;
                await sub.save();
            }
        } else {
            console.log("[Job] No memberships found expiring in exactly 3 days needing reminder.");
        }
    } catch (error) {
        console.error("[Job] Failed to execute renewal reminder check:", error);
    }
});

module.exports = cron;
