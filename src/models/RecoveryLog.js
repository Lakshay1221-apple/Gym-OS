const mongoose = require("mongoose");

const recoveryLogSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    date: { type: Date, required: true },
    sleepHours: { type: Number, required: true },
    steps: { type: Number, default: 0 },
    fatigueScore: { type: Number, min: 1, max: 10, required: true }
}, { timestamps: true });

recoveryLogSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("RecoveryLog", recoveryLogSchema);
