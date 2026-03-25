const { z } = require("zod");

// Define Zod schemas for Auth Validation payloads

const registerSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        gymId: z.string().min(1, "A valid Gym ID must be provided"),
    }),
});

const createAdminUserSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        email: z.string().email("Invalid email address"),
        password: z.string().min(6, "Password must be at least 6 characters"),
        role: z.enum(["member", "trainer", "admin"]).optional(),
        gymId: z.string().optional(),
    }),
});

const loginSchema = z.object({
    body: z.object({
        email: z.string().email("Invalid email address"),
        password: z.string().min(1, "Password is required"),
    }),
});

module.exports = {
    registerSchema,
    loginSchema,
    createAdminUserSchema,
};
