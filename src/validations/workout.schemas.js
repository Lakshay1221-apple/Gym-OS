const { z } = require("zod");
const mongoose = require("mongoose");

const objectIdSchema = z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
    message: "Invalid ObjectId format",
});

const createProgramSchema = z.object({
    body: z.object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        description: z.string().optional(),
        durationWeeks: z.number().int().positive().optional(),
        workouts: z.array(
            z.object({
                dayName: z.string().min(1, "Day name must be provided"),
                exercises: z.array(
                    z.object({
                        exerciseId: objectIdSchema,
                        targetSets: z.number().int().positive(),
                        targetReps: z.number().int().positive(),
                        restTime: z.number().int().nonnegative().optional(),
                    })
                ).min(1, "At least one exercise is required per workout day"),
            })
        ).min(1, "At least one workout day must be provided"),
    }),
});

const assignProgramSchema = z.object({
    body: z.object({
        memberId: objectIdSchema,
        programId: objectIdSchema,
    }),
});

const startSessionAssignmentSchema = z.object({
    body: z.object({
        assignmentId: objectIdSchema.optional(),
    }),
});

module.exports = {
    createProgramSchema,
    assignProgramSchema,
    startSessionAssignmentSchema,
};
