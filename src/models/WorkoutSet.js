const mongoose = require("mongoose");

const workoutSetSchema = new mongoose.Schema(
    {
        sessionId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkoutSession",
            required: true,
        },
        exerciseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Exercise",
            required: true,
        },
        setNumber: {
            type: Number,
            required: true,
        },
        reps: {
            type: Number,
            required: true,
        },
        weight: {
            type: Number,
            required: true,
        },
        rpe: {
            type: Number,
            min: 1,
            max: 10,
        },
        restTime: {
            type: Number, // in seconds
        },
    },
    {
        timestamps: true,
    }
);

const WorkoutSet = mongoose.model("WorkoutSet", workoutSetSchema);

module.exports = WorkoutSet;
