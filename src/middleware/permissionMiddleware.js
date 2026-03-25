/**
 * Centralised permission map.
 * Instead of scattering role checks across controllers, all capability
 * definitions live here. Add new permissions by extending this map.
 */
const PERMISSIONS = {
    admin: [
        "manage_members",
        "manage_plans",
        "manage_payments",
        "view_analytics",
        "manage_programs",
        "manage_trainer_assignments",
        "view_audit_logs",
        "view_workouts",
        "manage_attendance",
    ],
    trainer: [
        "create_programs",
        "manage_programs",
        "manage_trainer_assignments",
        "view_workouts",
        "manage_attendance",
    ],
    member: [
        "view_workouts",
        "view_own_attendance",
        "view_own_payments",
        "view_own_membership",
    ],
};

/**
 * Express middleware factory. Usage:
 *   router.get("/secret", protect, requirePermission("view_analytics"), handler)
 */
const requirePermission = (permission) => (req, res, next) => {
    const role = req.user?.role;
    const allowed = PERMISSIONS[role] || [];

    if (allowed.includes(permission)) {
        return next();
    }

    return res.status(403).json({ message: `Forbidden: requires '${permission}' permission` });
};

module.exports = { PERMISSIONS, requirePermission };
