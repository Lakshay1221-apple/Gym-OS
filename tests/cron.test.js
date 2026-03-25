/**
 * Cron tests — no HTTP layer involved.
 * We call the service functions directly and verify the DB state they produce.
 */
const mongoose = require("mongoose");
const db = require("./db");
const { expireMemberships, markGraceExpired } = require("../src/services/membershipService");
const Membership = require("../src/models/Membership");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

/** Factory — creates a minimal Membership document skipping service-layer side effects. */
const createMembership = (overrides = {}) =>
    Membership.create({
        member: new mongoose.Types.ObjectId(),
        plan: new mongoose.Types.ObjectId(),
        gym: new mongoose.Types.ObjectId(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // defaults to future
        status: "active",
        createdBy: new mongoose.Types.ObjectId(),
        ...overrides,
    });

// ─────────────────────────────────────────────────────────────────────────────
// expireMemberships() — active → grace
// ─────────────────────────────────────────────────────────────────────────────
describe("expireMemberships()", () => {
    it("downgrades active memberships whose endDate has passed to 'grace'", async () => {
        await createMembership({ endDate: new Date(Date.now() - 1000) }); // 1 second ago

        const modified = await expireMemberships();

        expect(modified).toBe(1);
        const membership = await Membership.findOne({});
        expect(membership.status).toBe("grace");
        expect(membership.graceUntil).toBeDefined();
    });

    it("does not touch active memberships whose endDate is still in the future", async () => {
        await createMembership({ endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) });

        const modified = await expireMemberships();

        expect(modified).toBe(0);
        const membership = await Membership.findOne({});
        expect(membership.status).toBe("active");
    });

    it("does not touch memberships already in grace status", async () => {
        await createMembership({
            endDate: new Date(Date.now() - 1000),
            status: "grace",
            graceUntil: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        });

        const modified = await expireMemberships();

        expect(modified).toBe(0);
        const membership = await Membership.findOne({});
        expect(membership.status).toBe("grace");
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// markGraceExpired() — grace → expired
// ─────────────────────────────────────────────────────────────────────────────
describe("markGraceExpired()", () => {
    it("marks grace memberships whose graceUntil has passed as 'expired'", async () => {
        await createMembership({
            endDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),  // ended 5 days ago
            status: "grace",
            graceUntil: new Date(Date.now() - 1000),                   // grace period over
        });

        const modified = await markGraceExpired();

        expect(modified).toBe(1);
        const membership = await Membership.findOne({});
        expect(membership.status).toBe("expired");
    });

    it("does not expire grace memberships whose graceUntil is still in the future", async () => {
        await createMembership({
            endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
            status: "grace",
            graceUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days left
        });

        const modified = await markGraceExpired();

        expect(modified).toBe(0);
        const membership = await Membership.findOne({});
        expect(membership.status).toBe("grace");
    });
});
