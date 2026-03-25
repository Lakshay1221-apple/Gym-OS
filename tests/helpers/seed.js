const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../../src/models/User");
const Gym = require("../../src/models/Gym");
const MembershipPlan = require("../../src/models/MembershipPlan");
const Membership = require("../../src/models/Membership");

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

/** Generate a signed JWT for use in Authorization headers. */
const bearerToken = (userId) =>
    `Bearer ${jwt.sign({ id: userId }, JWT_SECRET, { expiresIn: "1h" })}`;

/** Creates a gym with a placeholder owner — update owner after creating the admin. */
const seedGym = async () =>
    Gym.create({
        name: "Test Gym",
        location: "Test City",
        owner: new mongoose.Types.ObjectId(),
    });

/** Creates an admin user (password is hashed by the User pre-save hook). */
const seedAdmin = async (gymId, email = "admin@test.com") =>
    User.create({ name: "Test Admin", email, password: "Password123", role: "admin", gym: gymId });

/** Creates a member user. */
const seedMember = async (gymId, email = "member@test.com") =>
    User.create({ name: "Test Member", email, password: "Password123", role: "member", gym: gymId });

/** Creates a 30-day plan. */
const seedPlan = async (gymId, createdById) =>
    MembershipPlan.create({ name: "Monthly Plan", durationDays: 30, price: 999, gym: gymId, createdBy: createdById });

/** Creates an active membership that expires in 30 days. */
const seedActiveMembership = async (memberId, planId, gymId, createdById) =>
    Membership.create({
        member: memberId,
        plan: planId,
        gym: gymId,
        startDate: new Date(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: "active",
        createdBy: createdById,
    });

/**
 * Seeds a full test environment: gym + admin + member + plan.
 * Returns all created docs plus pre-built Authorization header strings.
 */
const seedAll = async () => {
    const gym = await seedGym();
    const admin = await seedAdmin(gym._id);
    gym.owner = admin._id;
    await gym.save();
    const member = await seedMember(gym._id);
    const plan = await seedPlan(gym._id, admin._id);

    return {
        gym,
        admin,
        member,
        plan,
        adminToken: bearerToken(admin._id),
        memberToken: bearerToken(member._id),
    };
};

module.exports = { bearerToken, seedGym, seedAdmin, seedMember, seedPlan, seedActiveMembership, seedAll };
