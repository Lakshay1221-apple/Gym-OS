const request = require("supertest");
const app = require("../app");
const db = require("./db");
const { seedAll } = require("./helpers/seed");
const Payment = require("../src/models/Payment");
const Membership = require("../src/models/Membership");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments — create a payment (admin only)
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/payments", () => {
    it("creates a payment AND a membership in one atomic transaction", async () => {
        const { admin, member, plan, adminToken } = await seedAll();

        const res = await request(app)
            .post("/api/payments")
            .set("Authorization", adminToken)
            .send({
                memberId: member._id.toString(),
                planId: plan._id.toString(),
                amount: 999,
                method: "cash",
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.status).toBe("completed");

        // Verify the membership was provisioned in the same transaction
        const membership = await Membership.findOne({ member: member._id });
        expect(membership).not.toBeNull();
        expect(membership.status).toBe("active");
        expect(membership.plan.toString()).toBe(plan._id.toString());
    });

    it("creates a payment without planId (no membership provisioned)", async () => {
        const { member, adminToken } = await seedAll();

        const res = await request(app)
            .post("/api/payments")
            .set("Authorization", adminToken)
            .send({ memberId: member._id.toString(), amount: 500, method: "upi" });

        expect(res.statusCode).toBe(201);
        expect(res.body.membership).toBeUndefined();

        const count = await Membership.countDocuments({ member: member._id });
        expect(count).toBe(0);
    });

    it("returns 401 when no token is provided", async () => {
        const res = await request(app).post("/api/payments").send({ amount: 100, method: "cash" });
        expect(res.statusCode).toBe(401);
    });

    it("returns 403 when a member (non-admin) tries to create a payment", async () => {
        const { member, plan, memberToken } = await seedAll();

        const res = await request(app)
            .post("/api/payments")
            .set("Authorization", memberToken)
            .send({ memberId: member._id.toString(), planId: plan._id.toString(), amount: 999, method: "cash" });

        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/payments/:id/refund
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/payments/:id/refund", () => {
    it("marks a completed payment as refunded", async () => {
        const { admin, member, adminToken } = await seedAll();

        const payment = await Payment.create({
            member: member._id,
            amount: 999,
            method: "cash",
            gym: admin.gym,
            status: "completed",
            createdBy: admin._id,
        });

        const res = await request(app)
            .post(`/api/payments/${payment._id}/refund`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.payment.status).toBe("refunded");

        const updated = await Payment.findById(payment._id);
        expect(updated.status).toBe("refunded");
    });

    it("returns 400 when the payment has already been refunded", async () => {
        const { admin, member, adminToken } = await seedAll();

        const payment = await Payment.create({
            member: member._id,
            amount: 999,
            method: "cash",
            gym: admin.gym,
            status: "refunded",
            createdBy: admin._id,
        });

        const res = await request(app)
            .post(`/api/payments/${payment._id}/refund`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/payments — paginated list
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/payments", () => {
    it("returns paginated payments for the gym", async () => {
        const { admin, member, adminToken } = await seedAll();

        await Payment.create([
            { member: member._id, amount: 100, method: "cash", gym: admin.gym, status: "completed", createdBy: admin._id },
            { member: member._id, amount: 200, method: "upi",  gym: admin.gym, status: "completed", createdBy: admin._id },
        ]);

        const res = await request(app)
            .get("/api/payments?page=1&limit=10")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(2);
        expect(res.body.pagination).toMatchObject({ page: 1, total: 2 });
    });
});
