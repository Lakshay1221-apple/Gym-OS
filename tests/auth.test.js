const request = require("supertest");
const app = require("../app");
const db = require("./db");
const { seedGym, seedAdmin, bearerToken } = require("./helpers/seed");

beforeAll(async () => await db.connect(), 30000);
afterEach(async () => await db.clearDB());
afterAll(async () => await db.disconnect(), 15000);

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/register
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
    let gymId;

    beforeEach(async () => {
        const gym = await seedGym();
        gymId = gym._id.toString();
    });

    it("creates a new user and returns a JWT token", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Test User",
            email: "user@test.com",
            password: "password123",
            gymId,
        });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty("token");
        expect(res.body.email).toBe("user@test.com");
        expect(res.body).not.toHaveProperty("password");
    });

    it("returns 400 when the email is already registered", async () => {
        // Seed a user directly so the email exists
        await seedAdmin(gymId, "taken@test.com");

        const res = await request(app).post("/api/auth/register").send({
            name: "Duplicate",
            email: "taken@test.com",
            password: "password123",
            gymId,
        });

        expect(res.statusCode).toBe(400);
    });

    it("returns 400 for an invalid email address (Zod)", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Bad Email",
            email: "not-an-email",
            password: "password123",
            gymId,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Validation Error");
    });

    it("returns 400 when the password is shorter than 6 characters (Zod)", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "Short Pass",
            email: "pass@test.com",
            password: "abc",
            gymId,
        });

        expect(res.statusCode).toBe(400);
        expect(res.body.message).toBe("Validation Error");
    });

    it("returns 400 when gymId is missing", async () => {
        const res = await request(app).post("/api/auth/register").send({
            name: "No Gym",
            email: "nogym@test.com",
            password: "password123",
        });

        expect(res.statusCode).toBe(400);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/auth/login
// ─────────────────────────────────────────────────────────────────────────────
describe("POST /api/auth/login", () => {
    let gymId;

    beforeEach(async () => {
        const gym = await seedGym();
        gymId = gym._id.toString();
        // Create a real user whose password is hashed by the pre-save hook
        await seedAdmin(gymId, "login@test.com");
    });

    it("returns a token on valid credentials", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "login@test.com",
            password: "Password123",
        });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty("token");
        expect(res.body.email).toBe("login@test.com");
    });

    it("returns 401 with the wrong password", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "login@test.com",
            password: "WrongPassword",
        });

        expect(res.statusCode).toBe(401);
    });

    it("returns 401 for an email that does not exist", async () => {
        const res = await request(app).post("/api/auth/login").send({
            email: "ghost@test.com",
            password: "Password123",
        });

        expect(res.statusCode).toBe(401);
    });
});

// ─────────────────────────────────────────────────────────────────────────────
// JWT protection — GET /api/auth/profile
// ─────────────────────────────────────────────────────────────────────────────
describe("GET /api/auth/profile — JWT protection", () => {
    it("returns 401 with no Authorization header", async () => {
        const res = await request(app).get("/api/auth/profile");
        expect(res.statusCode).toBe(401);
    });

    it("returns 401 with a malformed token", async () => {
        const res = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", "Bearer this.is.not.valid");

        expect(res.statusCode).toBe(401);
    });

    it("returns the user profile when token is valid", async () => {
        const gym = await seedGym();
        const admin = await seedAdmin(gym._id.toString());

        const res = await request(app)
            .get("/api/auth/profile")
            .set("Authorization", bearerToken(admin._id));

        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe("admin@test.com");
        expect(res.body).not.toHaveProperty("password");
    });
});
