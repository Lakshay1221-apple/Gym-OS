const ClassSchedule = require("../models/ClassSchedule");
const ClassBooking = require("../models/ClassBooking");
const Membership = require("../models/Membership");
const asyncHandler = require("express-async-handler");

const createClass = asyncHandler(async (req, res) => {
    const { name, description, trainer, startTime, endTime, capacity, waitlistCapacity } = req.body;
    const newClass = await ClassSchedule.create({
        name, description, trainer, startTime, endTime, capacity, waitlistCapacity,
        gym: req.user.gym
    });
    res.status(201).json(newClass);
});

const getClasses = asyncHandler(async (req, res) => {
    const classes = await ClassSchedule.find({ gym: req.user.gym, startTime: { $gte: new Date() } })
        .sort({ startTime: 1 })
        .populate("trainer", "name");
    res.json(classes);
});

const bookClass = asyncHandler(async (req, res) => {
    const classId = req.params.id;
    const schedule = await ClassSchedule.findOne({ _id: classId, gym: req.user.gym });
    
    if (!schedule) {
        res.status(404);
        throw new Error("Class not found");
    }

    const membership = await Membership.findOne({ member: req.user._id, status: "active", gym: req.user.gym });
    if (!membership) {
        res.status(403);
        throw new Error("Active membership required to book classes");
    }

    const existingBooking = await ClassBooking.findOne({ classId, member: req.user._id });
    if (existingBooking && existingBooking.status !== "cancelled") {
        res.status(400);
        throw new Error("Already booked or waitlisted");
    }

    const bookedCount = await ClassBooking.countDocuments({ classId, status: "booked" });
    let status = "booked";

    if (bookedCount >= schedule.capacity) {
        const waitlistCount = await ClassBooking.countDocuments({ classId, status: "waitlisted" });
        if (waitlistCount >= schedule.waitlistCapacity) {
            res.status(400);
            throw new Error("Class and waitlist are full");
        }
        status = "waitlisted";
    }

    let booking;
    if (existingBooking && existingBooking.status === "cancelled") {
        existingBooking.status = status;
        await existingBooking.save();
        booking = existingBooking;
    } else {
        booking = await ClassBooking.create({
            classId, member: req.user._id, gym: req.user.gym, status
        });
    }

    res.status(201).json({ message: `Successfully ${status}`, booking });
});

const cancelBooking = asyncHandler(async (req, res) => {
    const booking = await ClassBooking.findOne({ classId: req.params.id, member: req.user._id });
    if (!booking || booking.status === "cancelled") {
        res.status(400);
        throw new Error("No active booking found");
    }

    const oldStatus = booking.status;
    booking.status = "cancelled";
    await booking.save();

    if (oldStatus === "booked") {
        const nextInLine = await ClassBooking.findOne({ classId: req.params.id, status: "waitlisted" }).sort({ createdAt: 1 });
        if (nextInLine) {
            nextInLine.status = "booked";
            await nextInLine.save();
        }
    }

    res.json({ message: "Booking cancelled successfully" });
});

module.exports = { createClass, getClasses, bookClass, cancelBooking };
