const mongoose = require("mongoose");

const exerciseSchema = new mongoose.Schema(
    {
        exerciseName: {
            type: String,
            required: true,
        },
        muscleGroup: {
            type: String,
            required: true,
        },
        equipment: {
            type: String,
        },
        difficulty: {
            type: String,
            enum: ["beginner", "intermediate", "advanced"],
        },
    },
    {
        timestamps: true,
    }
);

const Exercise = mongoose.model("Exercise", exerciseSchema);

module.exports = Exercise;
