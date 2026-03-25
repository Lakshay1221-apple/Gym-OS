/**
 * OpenAPI 3.0 specification for the GymOS REST API.
 * Served as interactive docs at GET /api/docs
 */
const swaggerSpec = {
    openapi: "3.0.3",
    info: {
        title: "GymOS API",
        version: "1.0.0",
        description:
            "Multi-tenant gym management SaaS backend. Handles authentication, membership billing, attendance, workouts, biometrics, notifications, and analytics.",
        contact: { name: "GymOS" },
    },
    servers: [
        { url: "http://localhost:5000", description: "Development" },
    ],
    components: {
        securitySchemes: {
            bearerAuth: {
                type: "http",
                scheme: "bearer",
                bearerFormat: "JWT",
                description: "JWT token obtained from POST /api/auth/login",
            },
        },
        schemas: {
            // ── Shared ────────────────────────────────────────────────────────
            Pagination: {
                type: "object",
                properties: {
                    page:  { type: "integer", example: 1 },
                    limit: { type: "integer", example: 20 },
                    total: { type: "integer", example: 125 },
                    pages: { type: "integer", example: 7 },
                },
            },
            Error: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Server error" },
                    error:   { type: "string", example: "Details of the error" },
                },
            },
            ValidationError: {
                type: "object",
                properties: {
                    message: { type: "string", example: "Validation Error" },
                    errors: {
                        type: "array",
                        items: {
                            type: "object",
                            properties: {
                                path:    { type: "string", example: "body.email" },
                                message: { type: "string", example: "Invalid email address" },
                            },
                        },
                    },
                },
            },
            // ── Auth ──────────────────────────────────────────────────────────
            UserResponse: {
                type: "object",
                properties: {
                    _id:   { type: "string", example: "64a1b2c3d4e5f6g7h8i9j0k1" },
                    name:  { type: "string", example: "John Doe" },
                    email: { type: "string", example: "john@example.com" },
                    role:  { type: "string", enum: ["member", "trainer", "admin"] },
                    gym:   { type: "string", example: "64a1b2c3d4e5f6g7h8i9j0k2" },
                    token: { type: "string", description: "JWT token (present on register/login only)" },
                },
            },
            // ── Gym ───────────────────────────────────────────────────────────
            Gym: {
                type: "object",
                properties: {
                    _id:      { type: "string" },
                    name:     { type: "string", example: "FitZone Gym" },
                    location: { type: "string", example: "Mumbai, India" },
                    owner:    { type: "string", description: "ObjectId of the admin owner" },
                },
            },
            // ── Plan ─────────────────────────────────────────────────────────
            MembershipPlan: {
                type: "object",
                properties: {
                    _id:          { type: "string" },
                    name:         { type: "string",  example: "Monthly Classic" },
                    durationDays: { type: "integer", example: 30 },
                    price:        { type: "number",  example: 999 },
                    description:  { type: "string",  example: "Full gym access for 30 days" },
                    gym:          { type: "string" },
                },
            },
            // ── Membership ────────────────────────────────────────────────────
            Membership: {
                type: "object",
                properties: {
                    _id:       { type: "string" },
                    member:    { type: "string" },
                    plan:      { type: "string" },
                    gym:       { type: "string" },
                    startDate: { type: "string", format: "date-time" },
                    endDate:   { type: "string", format: "date-time" },
                    status: {
                        type: "string",
                        enum: ["pending", "active", "grace", "expired", "cancelled"],
                    },
                },
            },
            // ── Payment ───────────────────────────────────────────────────────
            Payment: {
                type: "object",
                properties: {
                    _id:    { type: "string" },
                    member: { type: "string" },
                    amount: { type: "number", example: 999 },
                    currency: { type: "string", example: "INR" },
                    method: { type: "string", enum: ["cash", "upi", "card", "online"] },
                    status: { type: "string", enum: ["pending", "completed", "failed", "refunded"] },
                    membership: { type: "string", description: "ObjectId of the provisioned membership (if any)" },
                    gym:    { type: "string" },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            // ── Attendance ────────────────────────────────────────────────────
            Attendance: {
                type: "object",
                properties: {
                    _id:          { type: "string" },
                    member:       { type: "string" },
                    membership:   { type: "string" },
                    gym:          { type: "string" },
                    checkInTime:  { type: "string", format: "date-time" },
                    checkOutTime: { type: "string", format: "date-time", nullable: true },
                    method:       { type: "string", example: "manual" },
                },
            },
            // ── Notification ─────────────────────────────────────────────────
            Notification: {
                type: "object",
                properties: {
                    _id:       { type: "string" },
                    userId:    { type: "string" },
                    title:     { type: "string", example: "Membership Activated" },
                    message:   { type: "string", example: "Your plan is active until ..." },
                    read:      { type: "boolean", default: false },
                    createdAt: { type: "string", format: "date-time" },
                },
            },
            // ── AuditLog ─────────────────────────────────────────────────────
            AuditLog: {
                type: "object",
                properties: {
                    _id:        { type: "string" },
                    actor:      { type: "string", description: "User who performed the action" },
                    action:     { type: "string", example: "payment.refunded" },
                    entityType: { type: "string", example: "Payment" },
                    entityId:   { type: "string" },
                    gym:        { type: "string" },
                    metadata:   { type: "object" },
                    createdAt:  { type: "string", format: "date-time" },
                },
            },
        },
    },

    // ── Global security (can be overridden per-operation) ─────────────────────
    security: [{ bearerAuth: [] }],

    tags: [
        { name: "Auth",          description: "Registration, login, and JWT profile" },
        { name: "Plans",         description: "Membership plan management (admin)" },
        { name: "Memberships",   description: "Member subscriptions lifecycle" },
        { name: "Payments",      description: "Payment ledger and refunds" },
        { name: "Attendance",    description: "Gym check-in / check-out" },
        { name: "Notifications", description: "In-app notification inbox" },
        { name: "Audit Logs",    description: "Immutable action trail (admin)" },
        { name: "Analytics",     description: "Business intelligence dashboard (admin)" },
        { name: "Health",        description: "Infrastructure health check" },
    ],

    paths: {
        // ══════════════════════════════════════════════════════════════════════
        // AUTH
        // ══════════════════════════════════════════════════════════════════════
        "/api/auth/register-gym": {
            post: {
                tags: ["Auth"], summary: "Bootstrap a new gym tenant",
                description: "Creates the Gym document and its admin owner in one call. Use this to provision a new tenant before registering any users.",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["gymName", "location", "ownerName", "ownerEmail", "ownerPassword"],
                        properties: {
                            gymName:       { type: "string", example: "FitZone Gym" },
                            location:      { type: "string", example: "Mumbai, India" },
                            ownerName:     { type: "string", example: "Rahul Sharma" },
                            ownerEmail:    { type: "string", example: "rahul@fitzone.com" },
                            ownerPassword: { type: "string", example: "SecurePass123" },
                        },
                    }}},
                },
                responses: {
                    201: { description: "Tenant provisioned", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            message: { type: "string", example: "Tenant environment successfully provisioned" },
                            gymId:   { type: "string" },
                            owner:   { $ref: "#/components/schemas/UserResponse" },
                        },
                    }}}},
                    400: { description: "Email already registered" },
                },
            },
        },
        "/api/auth/register": {
            post: {
                tags: ["Auth"], summary: "Register a new user",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["name", "email", "password", "gymId"],
                        properties: {
                            name:     { type: "string", example: "Jane Smith" },
                            email:    { type: "string", example: "jane@example.com" },
                            password: { type: "string", minLength: 6, example: "password123" },
                            role:     { type: "string", enum: ["member", "trainer", "admin"], default: "member" },
                            gymId:    { type: "string", description: "Target gym ObjectId" },
                        },
                    }}},
                },
                responses: {
                    201: { description: "User created + JWT issued", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
                    400: { description: "Validation error or duplicate email", content: { "application/json": { schema: { $ref: "#/components/schemas/ValidationError" } } } },
                },
            },
        },
        "/api/auth/login": {
            post: {
                tags: ["Auth"], summary: "Login and obtain a JWT",
                security: [],
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["email", "password"],
                        properties: {
                            email:    { type: "string", example: "jane@example.com" },
                            password: { type: "string", example: "password123" },
                        },
                    }}},
                },
                responses: {
                    200: { description: "JWT token returned", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
                    401: { description: "Invalid credentials" },
                },
            },
        },
        "/api/auth/profile": {
            get: {
                tags: ["Auth"], summary: "Get the authenticated user's profile",
                responses: {
                    200: { description: "User profile", content: { "application/json": { schema: { $ref: "#/components/schemas/UserResponse" } } } },
                    401: { description: "No or invalid JWT" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // PLANS
        // ══════════════════════════════════════════════════════════════════════
        "/api/plans": {
            get: {
                tags: ["Plans"], summary: "List membership plans for the gym",
                security: [],
                responses: { 200: { description: "Array of plans", content: { "application/json": { schema: { type: "array", items: { $ref: "#/components/schemas/MembershipPlan" } } } } } },
            },
            post: {
                tags: ["Plans"], summary: "Create a membership plan (admin)",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["name", "durationDays", "price"],
                        properties: {
                            name:         { type: "string",  example: "Monthly Classic" },
                            durationDays: { type: "integer", example: 30 },
                            price:        { type: "number",  example: 999 },
                            description:  { type: "string",  example: "Full access plan" },
                        },
                    }}},
                },
                responses: {
                    201: { description: "Plan created", content: { "application/json": { schema: { $ref: "#/components/schemas/MembershipPlan" } } } },
                    400: { description: "Validation error" },
                    403: { description: "Admin role required" },
                },
            },
        },
        "/api/plans/{id}": {
            put: {
                tags: ["Plans"], summary: "Update a plan (admin)",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                requestBody: { required: true, content: { "application/json": { schema: { $ref: "#/components/schemas/MembershipPlan" } } } },
                responses: {
                    200: { description: "Updated plan" },
                    404: { description: "Plan not found" },
                },
            },
            delete: {
                tags: ["Plans"], summary: "Delete a plan (admin)",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Plan removed" },
                    404: { description: "Plan not found" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // MEMBERSHIPS
        // ══════════════════════════════════════════════════════════════════════
        "/api/memberships": {
            get: {
                tags: ["Memberships"], summary: "List all memberships in the gym (admin, paginated)",
                parameters: [
                    { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                ],
                responses: {
                    200: { description: "Paginated memberships", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:       { type: "array", items: { $ref: "#/components/schemas/Membership" } },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                        },
                    }}}},
                },
            },
        },
        "/api/memberships/purchase": {
            post: {
                tags: ["Memberships"], summary: "Assign a plan to a member (admin)",
                description: "Cancels any existing active/grace membership and provisions a new active membership from the given plan.",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["memberId", "planId"],
                        properties: {
                            memberId: { type: "string" },
                            planId:   { type: "string" },
                        },
                    }}},
                },
                responses: {
                    201: { description: "Membership created", content: { "application/json": { schema: { $ref: "#/components/schemas/Membership" } } } },
                    404: { description: "Member or plan not found" },
                },
            },
        },
        "/api/memberships/member/{memberId}": {
            get: {
                tags: ["Memberships"], summary: "Get membership history for a member",
                parameters: [{ name: "memberId", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Array of memberships" },
                    403: { description: "Not authorized to view this membership" },
                },
            },
        },
        "/api/memberships/{id}/cancel": {
            patch: {
                tags: ["Memberships"], summary: "Cancel a membership (admin)",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Membership cancelled" },
                    400: { description: "Already cancelled" },
                    404: { description: "Not found" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // PAYMENTS
        // ══════════════════════════════════════════════════════════════════════
        "/api/payments": {
            post: {
                tags: ["Payments"], summary: "Record a payment (admin)",
                description: "Atomically creates the payment record and provisions a membership if `planId` is provided. Backed by a MongoDB transaction.",
                requestBody: {
                    required: true,
                    content: { "application/json": { schema: {
                        type: "object", required: ["memberId", "amount", "method"],
                        properties: {
                            memberId: { type: "string" },
                            amount:   { type: "number", example: 999 },
                            currency: { type: "string", default: "INR", example: "INR" },
                            method:   { type: "string", enum: ["cash", "upi", "card", "online"] },
                            planId:   { type: "string", description: "If provided, a membership is provisioned atomically" },
                        },
                    }}},
                },
                responses: {
                    201: { description: "Payment created", content: { "application/json": { schema: { $ref: "#/components/schemas/Payment" } } } },
                    403: { description: "Admin role required" },
                },
            },
            get: {
                tags: ["Payments"], summary: "List all payments in the gym (admin, paginated)",
                parameters: [
                    { name: "page",  in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
                ],
                responses: {
                    200: { description: "Paginated payment list", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:       { type: "array", items: { $ref: "#/components/schemas/Payment" } },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                        },
                    }}}},
                },
            },
        },
        "/api/payments/member/{id}": {
            get: {
                tags: ["Payments"], summary: "Get payment history for a specific member",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Array of payments" },
                    403: { description: "Not authorized" },
                },
            },
        },
        "/api/payments/{id}/refund": {
            post: {
                tags: ["Payments"], summary: "Refund a payment (admin)",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Payment status updated to refunded" },
                    400: { description: "Payment already refunded" },
                    404: { description: "Payment not found" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // ATTENDANCE
        // ══════════════════════════════════════════════════════════════════════
        "/api/attendance/checkin": {
            post: {
                tags: ["Attendance"], summary: "Check in to the gym",
                description: "Requires an active membership. Blocked if already checked in.",
                requestBody: {
                    required: false,
                    content: { "application/json": { schema: {
                        type: "object",
                        properties: { method: { type: "string", default: "manual", example: "manual" } },
                    }}},
                },
                responses: {
                    201: { description: "Attendance session opened", content: { "application/json": { schema: { $ref: "#/components/schemas/Attendance" } } } },
                    400: { description: "Already checked in" },
                    403: { description: "No active membership" },
                },
            },
        },
        "/api/attendance/checkout": {
            post: {
                tags: ["Attendance"], summary: "Check out from the gym",
                responses: {
                    200: { description: "Session closed with checkOutTime recorded" },
                    400: { description: "Not currently checked in" },
                },
            },
        },
        "/api/attendance/today": {
            get: {
                tags: ["Attendance"], summary: "Get today's attendance log (staff only)",
                responses: { 200: { description: "Array of today's attendance records" } },
            },
        },
        "/api/attendance/member/{id}": {
            get: {
                tags: ["Attendance"], summary: "Get attendance history for a member (paginated)",
                parameters: [
                    { name: "id",    in: "path",  required: true,  schema: { type: "string" } },
                    { name: "page",  in: "query", required: false, schema: { type: "integer", default: 1 } },
                    { name: "limit", in: "query", required: false, schema: { type: "integer", default: 20 } },
                ],
                responses: {
                    200: { description: "Paginated attendance history", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:       { type: "array", items: { $ref: "#/components/schemas/Attendance" } },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                        },
                    }}}},
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // NOTIFICATIONS
        // ══════════════════════════════════════════════════════════════════════
        "/api/notifications": {
            get: {
                tags: ["Notifications"], summary: "Get current user's notifications (paginated)",
                parameters: [
                    { name: "page",   in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit",  in: "query", schema: { type: "integer", default: 20 } },
                    { name: "unread", in: "query", schema: { type: "boolean" }, description: "Filter to unread only" },
                ],
                responses: {
                    200: { description: "Paginated notifications", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:       { type: "array", items: { $ref: "#/components/schemas/Notification" } },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                        },
                    }}}},
                },
            },
        },
        "/api/notifications/read-all": {
            patch: {
                tags: ["Notifications"], summary: "Mark all notifications as read",
                responses: { 200: { description: "All notifications marked as read" } },
            },
        },
        "/api/notifications/{id}/read": {
            patch: {
                tags: ["Notifications"], summary: "Mark a single notification as read",
                parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
                responses: {
                    200: { description: "Notification marked as read" },
                    404: { description: "Not found" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // AUDIT LOGS
        // ══════════════════════════════════════════════════════════════════════
        "/api/audit-logs": {
            get: {
                tags: ["Audit Logs"], summary: "Query the audit log (admin, paginated)",
                description: "Returns an immutable trail of all admin and system actions for the gym.",
                parameters: [
                    { name: "page",       in: "query", schema: { type: "integer", default: 1 } },
                    { name: "limit",      in: "query", schema: { type: "integer", default: 20 } },
                    { name: "action",     in: "query", schema: { type: "string" }, description: "e.g. payment.refunded" },
                    { name: "entityType", in: "query", schema: { type: "string" }, description: "e.g. Payment" },
                ],
                responses: {
                    200: { description: "Paginated audit log", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            data:       { type: "array", items: { $ref: "#/components/schemas/AuditLog" } },
                            pagination: { $ref: "#/components/schemas/Pagination" },
                        },
                    }}}},
                    403: { description: "Admin role required" },
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // ANALYTICS
        // ══════════════════════════════════════════════════════════════════════
        "/api/admin/metrics/revenue": {
            get: {
                tags: ["Analytics"], summary: "Revenue metrics for the gym",
                responses: {
                    200: { description: "Revenue summary + daily chart data", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            today:          { type: "number", example: 4500 },
                            month:          { type: "number", example: 48000 },
                            total:          { type: "number", example: 320000 },
                            averagePlanValue: { type: "number", example: 999 },
                            revenueByDay: {
                                type: "array",
                                description: "Last 30 days — suitable for a line/bar chart",
                                items: {
                                    type: "object",
                                    properties: {
                                        _id:   { type: "string", example: "2026-03-01" },
                                        total: { type: "number", example: 2997 },
                                    },
                                },
                            },
                        },
                    }}}},
                },
            },
        },
        "/api/admin/metrics/attendance": {
            get: {
                tags: ["Analytics"], summary: "Attendance metrics for the gym",
                responses: {
                    200: { description: "Today's totals + peak hours data", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            todayTotal: { type: "integer", example: 47 },
                            activeNow:  { type: "integer", example: 12 },
                            peakHours: {
                                type: "array",
                                description: "Check-ins per hour (0–23) over last 30 days",
                                items: {
                                    type: "object",
                                    properties: {
                                        hour:   { type: "integer", example: 8 },
                                        visits: { type: "integer", example: 91 },
                                    },
                                },
                            },
                        },
                    }}}},
                },
            },
        },
        "/api/admin/metrics/memberships": {
            get: {
                tags: ["Analytics"], summary: "Membership status breakdown",
                responses: {
                    200: { description: "Counts by status", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            active:    { type: "integer", example: 180 },
                            grace:     { type: "integer", example: 14 },
                            expired:   { type: "integer", example: 42 },
                            cancelled: { type: "integer", example: 30 },
                            pending:   { type: "integer", example: 5 },
                        },
                    }}}},
                },
            },
        },
        "/api/admin/metrics/trainers": {
            get: {
                tags: ["Analytics"], summary: "Trainer workload metrics",
                responses: {
                    200: { description: "Assignment status counts + top 10 trainers", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            byStatus: {
                                type: "object",
                                properties: {
                                    active:    { type: "integer" },
                                    completed: { type: "integer" },
                                    cancelled: { type: "integer" },
                                },
                            },
                            topTrainers: { type: "array", items: { type: "object" } },
                        },
                    }}}},
                },
            },
        },

        // ══════════════════════════════════════════════════════════════════════
        // HEALTH
        // ══════════════════════════════════════════════════════════════════════
        "/health": {
            get: {
                tags: ["Health"], summary: "Infrastructure health check",
                security: [],
                description: "Used by load balancers, Docker, and monitoring systems.",
                responses: {
                    200: { description: "System healthy", content: { "application/json": { schema: {
                        type: "object",
                        properties: {
                            status:   { type: "string", example: "ok" },
                            database: { type: "string", example: "connected" },
                            uptime:   { type: "integer", example: 14323, description: "Server uptime in seconds" },
                        },
                    }}}},
                },
            },
        },
    },
};

module.exports = swaggerSpec;
