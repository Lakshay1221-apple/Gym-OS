const mongoose = require("mongoose");

const workoutProgramSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        description: {
            type: String,
        },
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        gym: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        durationWeeks: {
            type: Number,
            required: true,
            default: 4,
        },
        workouts: [
            {
                dayName: { type: String, required: true }, // e.g., "Push Day", "Day 1"
                exercises: [
                    {
                        exerciseId: {
                            type: mongoose.Schema.Types.ObjectId,
                            ref: "Exercise",
                            required: true,
                        },
                        targetSets: {
                            type: Number,
                            required: true,
                        },
                        targetReps: {
                            type: Number,
                            required: true,
                        },
                        restTime: {
                            type: Number, // in seconds
                        },
                    },
                ],
            },
        ],
    },
    {
        timestamps: true,
    }
);

workoutProgramSchema.index({ gym: 1, trainer: 1 });

const WorkoutProgram = mongoose.models.WorkoutProgram || mongoose.model("WorkoutProgram", workoutProgramSchema);

module.exports = WorkoutProgram;
