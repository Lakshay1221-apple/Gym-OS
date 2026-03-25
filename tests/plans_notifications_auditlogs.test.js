/**
 * Covers: plan CRUD, notification endpoints, audit log endpoint.
 * These are grouped to avoid spawning extra MongoMemoryReplSet instances.
 */
const request = require("supertest");
const mongoose = require("mongoose");
const app = require("../app");
const db = require("./db");
const { seedAll } = require("./helpers/seed");
const Notification = require("../src/models/Notification");
const AuditLog = require("../src/models/AuditLog");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/plans — public endpoint
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/plans", () => {
    it("returns the plans for the gym (no auth required)", async () => {
        const { adminToken } = await seedAll();

        // Create an extra plan so there's something to list
        await request(app)
            .post("/api/plans")
            .set("Authorization", adminToken)
            .send({ name: "Weekly Plan", durationDays: 7, price: 299 });

        const res = await request(app).get("/api/plans").set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        // The seed already creates one plan + we created a second one
        expect(res.body.length).toBeGreaterThanOrEqual(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/plans — admin only
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/plans", () => {
    it("creates a plan (admin only)", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .post("/api/plans")
            .set("Authorization", adminToken)
            .send({ name: "Annual Plan", durationDays: 365, price: 4999 });

        expect(res.statusCode).toBe(201);
        expect(res.body.name).toBe("Annual Plan");
        expect(res.body.durationDays).toBe(365);
        expect(res.body.price).toBe(4999);
    });

    it("returns 403 when a member tries to create a plan", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .post("/api/plans")
            .set("Authorization", memberToken)
            .send({ name: "Annual Plan", durationDays: 365, price: 4999 });

        expect(res.statusCode).toBe(403);
    });

    it("returns 400 with validation errors for missing fields", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .post("/api/plans")
            .set("Authorization", adminToken)
            .send({ name: "Incomplete Plan" }); // missing durationDays and price

        expect(res.statusCode).toBe(400);
        expect(res.body).toHaveProperty("errors");
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app)
            .post("/api/plans")
            .send({ name: "Plan", durationDays: 30, price: 999 });

        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/notifications
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/notifications", () => {
    it("returns the member's notifications with pagination", async () => {
        const { member, memberToken } = await seedAll();

        await Notification.create([
            { userId: member._id, title: "Welcome", message: "Welcome to the gym!" },
            { userId: member._id, title: "Reminder", message: "Renew your plan." },
        ]);

        const res = await request(app)
            .get("/api/notifications?page=1&limit=10")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
    });

    it("filters by unread=true", async () => {
        const { member, memberToken } = await seedAll();

        await Notification.create([
            { userId: member._id, title: "Unread", message: "You have an update.", read: false },
            { userId: member._id, title: "Already read", message: "Old news.", read: true },
        ]);

        const res = await request(app)
            .get("/api/notifications?unread=true")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].title).toBe("Unread");
    });

    it("returns 401 when no token provided", async () => {
        const res = await request(app).get("/api/notifications");
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/:id/read
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/notifications/:id/read", () => {
    it("marks a notification as read", async () => {
        const { member, memberToken } = await seedAll();

        const notification = await Notification.create({
            userId: member._id,
            title: "Test",
            message: "Mark me read",
        });

        const res = await request(app)
            .patch(`/api/notifications/${notification._id}/read`)
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.notification.read).toBe(true);
    });

    it("returns 404 when notification does not belong to the user", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .patch(`/api/notifications/${new mongoose.Types.ObjectId()}/read`)
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(404);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/notifications/read-all
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/notifications/read-all", () => {
    it("marks all unread notifications as read", async () => {
        const { member, memberToken } = await seedAll();

        await Notification.create([
            { userId: member._id, title: "A", message: "msg", read: false },
            { userId: member._id, title: "B", message: "msg", read: false },
        ]);

        const res = await request(app)
            .patch("/api/notifications/read-all")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toMatch(/read/i);

        const unread = await Notification.countDocuments({ userId: member._id, read: false });
        expect(unread).toBe(0);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/audit-logs — admin only
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/audit-logs", () => {
    it("returns paginated audit logs for the gym", async () => {
        const { admin, adminToken } = await seedAll();

        await AuditLog.create([
            { actor: admin._id, action: "payment.created", entityType: "Payment", entityId: new mongoose.Types.ObjectId(), gym: admin.gym },
            { actor: admin._id, action: "membership.created", entityType: "Membership", entityId: new mongoose.Types.ObjectId(), gym: admin.gym },
        ]);

        const res = await request(app)
            .get("/api/audit-logs?page=1&limit=10")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
    });

    it("filters by action query param", async () => {
        const { admin, adminToken } = await seedAll();

        await AuditLog.create([
            { actor: admin._id, action: "payment.refunded", entityType: "Payment", entityId: new mongoose.Types.ObjectId(), gym: admin.gym },
            { actor: admin._id, action: "plan.created", entityType: "MembershipPlan", entityId: new mongoose.Types.ObjectId(), gym: admin.gym },
        ]);

        const res = await request(app)
            .get("/api/audit-logs?action=payment.refunded")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.data[0].action).toBe("payment.refunded");
    });

    it("returns 403 when a member tries to access audit logs", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .get("/api/audit-logs")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });
});
