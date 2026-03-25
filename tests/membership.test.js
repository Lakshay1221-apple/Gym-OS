const request = require("supertest");
const app = require("../app");
const db = require("./db");
const { seedAll, seedActiveMembership } = require("./helpers/seed");
const Membership = require("../src/models/Membership");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/memberships/purchase
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/memberships/purchase", () => {
    it("creates an active membership for a member (admin only)", async () => {
        const { member, plan, adminToken } = await seedAll();

        const res = await request(app)
            .post("/api/memberships/purchase")
            .set("Authorization", adminToken)
            .send({ memberId: member._id.toString(), planId: plan._id.toString() });

        expect(res.statusCode).toBe(201);
        expect(res.body.status).toBe("active");
        expect(res.body.member.toString()).toBe(member._id.toString());
        expect(res.body.plan.toString()).toBe(plan._id.toString());
    });

    it("cancels the prior active membership before issuing a new one", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        // Second purchase — should cancel the first
        const res = await request(app)
            .post("/api/memberships/purchase")
            .set("Authorization", adminToken)
            .send({ memberId: member._id.toString(), planId: plan._id.toString() });

        expect(res.statusCode).toBe(201);

        const all = await Membership.find({ member: member._id });
        expect(all).toHaveLength(2);

        const statuses = all.map((m) => m.status).sort();
        expect(statuses).toEqual(["active", "cancelled"]);
    });

    it("returns 401 when no token is provided", async () => {
        const { member, plan } = await seedAll();

        const res = await request(app)
            .post("/api/memberships/purchase")
            .send({ memberId: member._id.toString(), planId: plan._id.toString() });

        expect(res.statusCode).toBe(401);
    });

    it("returns 403 when a member (non-admin) tries to purchase", async () => {
        const { member, plan, memberToken } = await seedAll();

        const res = await request(app)
            .post("/api/memberships/purchase")
            .set("Authorization", memberToken)
            .send({ memberId: member._id.toString(), planId: plan._id.toString() });

        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/memberships/member/:memberId
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/memberships/member/:memberId", () => {
    it("returns memberships for the requesting member", async () => {
        const { admin, member, plan, memberToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .get(`/api/memberships/member/${member._id}`)
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(1);
        expect(res.body[0].status).toBe("active");
    });

    it("returns 403 when a member tries to view another member's history", async () => {
        const { admin, plan, memberToken } = await seedAll();
        // Create a second member in the same gym
        const { seedMember } = require("./helpers/seed");
        const otherMember = await seedMember(admin.gym, "other@test.com");

        const res = await request(app)
            .get(`/api/memberships/member/${otherMember._id}`)
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });

    it("admin can view any member's memberships", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .get(`/api/memberships/member/${member._id}`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveLength(1);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/memberships — paginated list (admin only)
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/memberships", () => {
    it("returns paginated memberships for the gym", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .get("/api/memberships?page=1&limit=10")
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.data).toHaveLength(1);
        expect(res.body.pagination).toMatchObject({ page: 1, total: 1 });
    });

    it("returns 403 when a member tries to list all memberships", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .get("/api/memberships")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(403);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/memberships/:id/cancel
// ─────────────────────────────────────────────────────────────────────────────
describe("PATCH /api/memberships/:id/cancel", () => {
    it("cancels an active membership", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        const membership = await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .patch(`/api/memberships/${membership._id}/cancel`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.membership.status).toBe("cancelled");

        const updated = await Membership.findById(membership._id);
        expect(updated.status).toBe("cancelled");
    });

    it("returns 400 when the membership is already cancelled", async () => {
        const { admin, member, plan, adminToken } = await seedAll();
        const membership = await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);
        membership.status = "cancelled";
        await membership.save();

        const res = await request(app)
            .patch(`/api/memberships/${membership._id}/cancel`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(400);
    });

    it("returns 404 when the membership does not exist", async () => {
        const mongoose = require("mongoose");
        const { adminToken } = await seedAll();

        const res = await request(app)
            .patch(`/api/memberships/${new mongoose.Types.ObjectId()}/cancel`)
            .set("Authorization", adminToken);

        expect(res.statusCode).toBe(404);
    });
});
