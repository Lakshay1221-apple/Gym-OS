const mongoose = require("mongoose");

const measurementSchema = new mongoose.Schema(
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
        date: {
            type: Date,
            default: Date.now,
        },
        chest: {
            type: Number,
        },
        waist: {
            type: Number,
        },
        hips: {
            type: Number,
        },
        biceps: {
            type: Number,
        },
        thighs: {
            type: Number,
        },
        date: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

const Measurement = mongoose.model("Measurement", measurementSchema);

module.exports = Measurement;
