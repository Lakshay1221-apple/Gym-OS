const request = require("supertest");
const app = require("../app");
const db = require("./db");
const { seedAll, seedActiveMembership } = require("./helpers/seed");
const Payment = require("../src/models/Payment");
const Attendance = require("../src/models/Attendance");
const Membership = require("../src/models/Membership");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/metrics/revenue
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/metrics/revenue", () => {
    it("returns revenue metrics including revenueByDay array", async () => {
        const { admin, member, adminToken } = await seedAll();

        await Payment.create([
            { member: member._id, amount: 1000, method: "cash", gym: admin.gym, status: "completed", createdBy: admin._id },
            { member: member._id, amount: 500,  method: "upi",  gym: admin.gym, status: "completed", createdBy: admin._id },
        ]);

        const res = await request(app)
            .get("/api/admin/metrics/revenue")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(1500);
        expect(res.body.today).toBe(1500);
        expect(res.body.month).toBe(1500);
        expect(Array.isArray(res.body.revenueByDay)).toBe(true);
        expect(res.body.revenueByDay.length).toBeGreaterThan(0);
        expect(res.body.revenueByDay[0]).toHaveProperty("total");
    });

    it("returns zeros when no payments exist", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/revenue")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.total).toBe(0);
        expect(res.body.today).toBe(0);
        expect(res.body.revenueByDay).toHaveLength(0);
    });

    it("returns 403 when a member tries to access revenue metrics", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/revenue")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app).get("/api/admin/metrics/revenue");
        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/metrics/attendance
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/metrics/attendance", () => {
    it("returns attendance metrics including peakHours array", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        const membership = await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        // Seed two attendance records for the gym
        await Attendance.create([
            { member: member._id, gym: admin.gym, membership: membership._id, checkInTime: new Date(), method: "manual" },
            { member: member._id, gym: admin.gym, membership: membership._id, checkInTime: new Date(), method: "manual", checkOutTime: new Date() },
        ]);

        const res = await request(app)
            .get("/api/admin/metrics/attendance")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.todayTotal).toBe(2);
        expect(res.body.activeNow).toBe(1); // only the record without checkOutTime
        expect(Array.isArray(res.body.peakHours)).toBe(true);
        expect(res.body.peakHours.length).toBeGreaterThan(0);
        expect(res.body.peakHours[0]).toHaveProperty("hour");
        expect(res.body.peakHours[0]).toHaveProperty("visits");
    });

    it("returns zeros when no attendance records exist", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/attendance")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.todayTotal).toBe(0);
        expect(res.body.activeNow).toBe(0);
        expect(res.body.peakHours).toHaveLength(0);
    });

    it("returns 403 when a member accesses attendance metrics", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/attendance")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/metrics/memberships
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/metrics/memberships", () => {
    it("returns membership status counts", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .get("/api/admin/metrics/memberships")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.active).toBe(1);
        expect(res.body.grace).toBe(0);
        expect(res.body.expired).toBe(0);
        expect(res.body.cancelled).toBe(0);
    });

    it("returns all-zero counts when no memberships exist", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/memberships")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({ active: 0, grace: 0, expired: 0, cancelled: 0, pending: 0 });
    });

    it("correctly counts multiple statuses", async () => {
        const mongoose = require("mongoose");
        const { admin, member, plan, adminToken } = await seedAll();

        const gymId = admin.gym;
        const memberId = member._id;
        const planId = plan._id;
        const createdBy = admin._id;

        await Membership.create([
            { member: memberId, plan: planId, gym: gymId, endDate: new Date(), status: "active",    createdBy },
            { member: memberId, plan: planId, gym: gymId, endDate: new Date(), status: "grace",     createdBy },
            { member: memberId, plan: planId, gym: gymId, endDate: new Date(), status: "expired",   createdBy },
            { member: memberId, plan: planId, gym: gymId, endDate: new Date(), status: "cancelled", createdBy },
        ]);

        const res = await request(app)
            .get("/api/admin/metrics/memberships")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.active).toBe(1);
        expect(res.body.grace).toBe(1);
        expect(res.body.expired).toBe(1);
        expect(res.body.cancelled).toBe(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/admin/metrics/trainers
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/admin/metrics/trainers", () => {
    it("returns trainer metrics with byStatus and topTrainers", async () => {
        const { adminToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/trainers")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("byStatus");
        expect(res.body).toHaveProperty("topTrainers");
        expect(Array.isArray(res.body.topTrainers)).toBe(true);
        expect(res.body.byStatus).toMatchObject({ active: 0, completed: 0, cancelled: 0 });
    });

    it("returns 403 when a member accesses trainer metrics", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .get("/api/admin/metrics/trainers")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });
});
