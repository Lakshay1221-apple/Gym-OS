const AuditLog = require("../models/AuditLog");

/**
 * Records an audit event. Fire-and-forget — never throws so it never
 * breaks the caller's request flow.
 *
 * @param {Object} opts
 * @param {ObjectId} opts.actor    - User who performed the action
 * @param {string}   opts.action   - Dot-namespaced event  e.g. "payment.refunded"
 * @param {string}   opts.entityType - Model name e.g. "Payment"
 * @param {ObjectId} opts.entityId
 * @param {ObjectId} [opts.gym]
 * @param {Object}   [opts.metadata]
 */
const logAction = async ({ actor, action, entityType, entityId, gym, metadata = {} }) => {
    try {
        await AuditLog.create({ actor, action, entityType, entityId, gym, metadata });
    } catch (err) {
        // Audit failures must never crash the main flow
        console.error("[AuditLog] Failed to write log:", err.message);
    }
};

module.exports = { logAction };
