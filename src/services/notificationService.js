const Notification = require("../models/Notification");

/**
 * Creates an in-app notification for a user.
 * Fire-and-forget — never throws so it never breaks the caller's flow.
 *
 * @param {Object} opts
 * @param {ObjectId} opts.userId
 * @param {string}   opts.title
 * @param {string}   opts.message
 */
const notify = async ({ userId, title, message }) => {
    try {
        await Notification.create({ userId, title, message });
    } catch (err) {
        console.error("[Notification] Failed to create notification:", err.message);
    }
};

module.exports = { notify };
