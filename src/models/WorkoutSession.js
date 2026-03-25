const mongoose = require("mongoose");

const workoutSessionSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        gym: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkoutProgram",
        },
        assignment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "TrainerAssignment",
        },
        startTime: {
            type: Date,
            default: Date.now,
        },
        endTime: {
            type: Date,
        },
        duration: {
            type: Number, // in minutes
        },
        caloriesBurned: {
            type: Number,
        },
    },
    {
        timestamps: true,
    }
);

const WorkoutSession = mongoose.model("WorkoutSession", workoutSessionSchema);

module.exports = WorkoutSession;
