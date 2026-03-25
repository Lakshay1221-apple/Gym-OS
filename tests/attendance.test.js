const request = require("supertest");
const app = require("../app");
const db = require("./db");
const { seedAll, seedActiveMembership } = require("./helpers/seed");
const Attendance = require("../src/models/Attendance");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/checkin
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/attendance/checkin", () => {
    it("returns 403 when the member has no active membership", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .post("/api/attendance/checkin")
            .set("Authorization", memberToken)
            .send({ method: "manual" });

        expect(res.statusCode).toBe(403);
    });

    it("returns 201 and creates an attendance record for a member with an active membership", async () => {
        const { admin, member, plan, memberToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        const res = await request(app)
            .post("/api/attendance/checkin")
            .set("Authorization", memberToken)
            .send({ method: "manual" });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("_id");
        expect(res.body.checkOutTime).toBeUndefined();

        const record = await Attendance.findById(res.body._id);
        expect(record).not.toBeNull();
        expect(record.member.toString()).toBe(member._id.toString());
    });

    it("returns 400 when the member is already checked in", async () => {
        const { admin, member, plan, memberToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        // First check-in should succeed
        await request(app)
            .post("/api/attendance/checkin")
            .set("Authorization", memberToken)
            .send({ method: "manual" });

        // Second check-in should be blocked
        const res = await request(app)
            .post("/api/attendance/checkin")
            .set("Authorization", memberToken)
            .send({ method: "manual" });

        expect(res.statusCode).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/attendance/checkout
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/attendance/checkout", () => {
    it("closes the open attendance session and records checkOutTime", async () => {
        const { admin, member, plan, memberToken } = await seedAll();
        await seedActiveMembership(member._id, plan._id, admin.gym, admin._id);

        await request(app)
            .post("/api/attendance/checkin")
            .set("Authorization", memberToken)
            .send({ method: "manual" });

        const res = await request(app)
            .post("/api/attendance/checkout")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(200);
        expect(res.body.attendance).toHaveProperty("checkOutTime");

        const record = await Attendance.findOne({ member: member._id });
        expect(record.checkOutTime).not.toBeNull();
    });

    it("returns 400 when the member is not currently checked in", async () => {
        const { memberToken } = await seedAll();

        const res = await request(app)
            .post("/api/attendance/checkout")
            .set("Authorization", memberToken);

        expect(res.statusCode).toBe(400);
    });
});
