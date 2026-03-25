const mongoose = require("mongoose");

const classBookingSchema = new mongoose.Schema({
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "ClassSchedule", required: true },
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    status: { type: String, enum: ["booked", "waitlisted", "cancelled"], required: true }
}, { timestamps: true });

classBookingSchema.index({ classId: 1, status: 1 });
classBookingSchema.index({ member: 1, classId: 1 }, { unique: true });

module.exports = mongoose.model("ClassBooking", classBookingSchema);
