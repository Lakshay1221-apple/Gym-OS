const { z } = require("zod");
const mongoose = require("mongoose");

// Helper to validate MongoDB Object IDs
const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});

const createPlanSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        durationDays: z.number().int().positive("Duration must be a positive integer"),
        price: z.number().nonnegative("Price cannot be negative"),
        description: z.string().optional(),
    }),
});

const purchaseMembershipSchema = z.object({
    body: z.object({
        memberId: objectIdSchema,
        planId: objectIdSchema,
    }),
});

module.exports = {
    createPlanSchema,
    purchaseMembershipSchema,
};
