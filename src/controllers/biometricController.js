const Biometric = require("../models/Biometric");
const Measurement = require("../models/Measurement");
const asyncHandler = require("express-async-handler");

// @desc    Log biometrics and measurements
// @route   POST /api/biometrics/log
// @access  Private
const logMetrics = asyncHandler(async (req, res) => {
    const { weight, bodyFat, muscleMass, chest, waist, hips, biceps, thighs } = req.body;

    try {
        let biometric = null;
        let measurement = null;

        // Log general biometrics if provided
        if (weight || bodyFat || muscleMass) {
            biometric = await Biometric.create({
                member: req.user._id,
                gym: req.user.gym,
                weightInKg: weight,
                bodyFat,
                muscleMass,
            });
        }

        // Log specific body measurements if provided
        if (chest || waist || hips || biceps || thighs) {
            measurement = await Measurement.create({
                member: req.user._id,
                gym: req.user.gym,
                chest,
                waist,
                hips,
                biceps,
                thighs,
            });
        }

        if (!biometric && !measurement) {
            return res.status(400).json({ message: "No metric data provided to log" });
        }

        res.status(201).json({
            message: "Metrics logged successfully",
            biometric,
            measurement,
        });
    } catch (error) {
        res.status(400);
        throw new Error("Invalid biometric data");
    }
});

// @desc    Get member's biometric history
// @route   GET /api/biometrics/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
    const bioHistory = await Biometric.find({ member: req.user._id, gym: req.user.gym })
        .sort({ date: -1 })
        .lean();

    const measurementHistory = await Measurement.find({ member: req.user._id, gym: req.user.gym }) 
        .sort({ date: -1 })
        .lean();
        
    res.json({
        biometrics: bioHistory,
        measurements: measurementHistory
    });
});

module.exports = {
    logMetrics,
    getHistory,
};
