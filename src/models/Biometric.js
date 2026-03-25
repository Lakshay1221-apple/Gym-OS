const mongoose = require("mongoose");

const biometricSchema = new mongoose.Schema(
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
        weightInKg: {
            type: Number,
        },
        bodyFat: {
            type: Number,
        },
        muscleMass: {
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

const Biometric = mongoose.model("Biometric", biometricSchema);

module.exports = Biometric;
