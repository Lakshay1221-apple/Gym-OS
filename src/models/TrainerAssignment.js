const mongoose = require("mongoose");

const trainerAssignmentSchema = new mongoose.Schema(
    {
        member: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        trainer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        program: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "WorkoutProgram",
            required: true,
        },
        gym: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Gym",
            required: true,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ["active", "completed", "cancelled"],
            default: "active",
        },
    },
    {
        timestamps: true,
    }
);

trainerAssignmentSchema.index({ gym: 1, member: 1 });
trainerAssignmentSchema.index({ gym: 1, trainer: 1 });

const TrainerAssignment = mongoose.models.TrainerAssignment || mongoose.model("TrainerAssignment", trainerAssignmentSchema);

module.exports = TrainerAssignment;
