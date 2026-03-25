const mongoose = require("mongoose");

const classScheduleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    trainer: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    capacity: { type: Number, required: true },
    waitlistCapacity: { type: Number, default: 0 }
}, { timestamps: true });

classScheduleSchema.index({ gym: 1, startTime: 1 });

module.exports = mongoose.model("ClassSchedule", classScheduleSchema);
