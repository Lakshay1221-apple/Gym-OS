const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
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
        membership: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Membership",
            required: true,
        },
        checkInTime: {
            type: Date,
            default: Date.now,
        },
        checkOutTime: {
            type: Date,
        },
        method: {
            type: String,
            enum: ["qr", "nfc", "manual"],
            default: "manual",
        },
    },
    {
        timestamps: true,
    }
);

// Optimization: Compound index for quick member timeline generation
attendanceSchema.index({ member: 1, checkInTime: -1 });

const Attendance = mongoose.models.Attendance || mongoose.model("Attendance", attendanceSchema);

module.exports = Attendance;
