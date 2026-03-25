const WorkoutProgram = require("../models/WorkoutProgram");
const TrainerAssignment = require("../models/TrainerAssignment");
const User = require("../models/User");

// @desc    Create a new workout program template
// @route   POST /api/programs
// @access  Private (Trainer/Admin)
const createProgram = async (req, res) => {
    try {
        const { name, description, durationWeeks, workouts } = req.body;

        const program = await WorkoutProgram.create({
            name,
            description,
            durationWeeks,
            workouts,
            trainer: req.user._id,
            gym: req.user.gym,
        });

        res.status(201).json(program);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get all programs for the gym
// @route   GET /api/programs
// @access  Private
const getPrograms = async (req, res) => {
    try {
        const programs = await WorkoutProgram.find({ gym: req.user.gym })
            .select("-__v")
            .populate("trainer", "name");
        res.json(programs);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Assign a workout program to a member
// @route   POST /api/programs/assign
// @access  Private (Trainer/Admin)
const assignProgram = async (req, res) => {
    try {
        const { memberId, programId } = req.body;

        const program = await WorkoutProgram.findOne({ _id: programId, gym: req.user.gym });
        if (!program) return res.status(404).json({ message: "Program not found" });

        const member = await User.findOne({ _id: memberId, gym: req.user.gym });
        if (!member) return res.status(404).json({ message: "Member not found" });

        // End any active assignments for this member
        await TrainerAssignment.updateMany(
            { member: memberId, status: "active" },
            { $set: { status: "completed" } }
        );

        const assignment = await TrainerAssignment.create({
            member: memberId,
            trainer: req.user._id,
            program: programId,
            gym: req.user.gym,
        });

        res.status(201).json(assignment);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get authenticated member's active assignments
// @route   GET /api/programs/my-assignments
// @access  Private
const getMyAssignments = async (req, res) => {
    try {
        const assignments = await TrainerAssignment.find({ member: req.user._id, status: "active", gym: req.user.gym })
            .populate({
                path: "program",
                populate: {
                    path: "workouts.exercises.exerciseId",
                    select: "exerciseName muscleGroup equipment"
                }
            })
            .populate("trainer", "name");
        
        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

// @desc    Get trainer's assigned clients
// @route   GET /api/programs/my-clients
// @access  Private (Trainer/Admin)
const getTrainerClients = async (req, res) => {
    try {
        const assignments = await TrainerAssignment.find({ trainer: req.user._id, gym: req.user.gym })
            .populate("member", "name email")
            .populate("program", "name")
            .sort({ createdAt: -1 });

        res.json(assignments);
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

module.exports = {
    createProgram,
    getPrograms,
    assignProgram,
    getMyAssignments,
    getTrainerClients,
};
