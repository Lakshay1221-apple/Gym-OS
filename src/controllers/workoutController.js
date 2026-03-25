const WorkoutSession = require("../models/WorkoutSession");
const WorkoutSet = require("../models/WorkoutSet");
const Exercise = require("../models/Exercise");
const asyncHandler = require("express-async-handler");

const TrainerAssignment = require("../models/TrainerAssignment");

// @desc    Start a new workout session
// @route   POST /api/workout/start
// @access  Private
const startSession = async (req, res) => {
    try {
        const { assignmentId } = req.body;

        // Check if there's already an active session
        const activeSession = await WorkoutSession.findOne({
            member: req.user._id, // Notice we use member here, previously code used userId
            endTime: { $exists: false },
        });

        if (activeSession) {
            return res.status(400).json({ message: "An active workout session already exists" });
        }

        let programId = null;

        if (assignmentId) {
            const assignment = await TrainerAssignment.findOne({ _id: assignmentId, member: req.user._id, gym: req.user.gym });
            if (!assignment) {
                return res.status(404).json({ message: "Assignment not found" });
            }
            programId = assignment.program;
        }

        const session = await WorkoutSession.create({
            member: req.user._id,
            gym: req.user.gym,
            assignment: assignmentId || null,
            program: programId || null,
            startTime: new Date(),
        });

        res.status(201).json(session);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Add a set to a workout session
// @route   POST /api/workout/add-set
// @access  Private
const addSet = async (req, res) => {
    const { sessionId, exerciseId, setNumber, reps, weight, rpe, restTime } = req.body;

    try {
        const session = await WorkoutSession.findOne({
            _id: sessionId,
            member: req.user._id,
            endTime: { $exists: false },
        });

        if (!session) {
            return res.status(404).json({ message: "Active workout session not found" });
        }

        const workoutSet = await WorkoutSet.create({
            sessionId,
            exerciseId,
            setNumber,
            reps,
            weight,
            rpe,
            restTime,
        });

        res.status(201).json(workoutSet);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Finish a workout session
// @route   POST /api/workout/finish
// @access  Private
const finishSession = async (req, res) => {
    const { sessionId, caloriesBurned } = req.body;

    try {
        const session = await WorkoutSession.findOne({
            _id: sessionId,
            member: req.user._id,
            endTime: { $exists: false },
        });

        if (!session) {
            return res.status(404).json({ message: "Active workout session not found" });
        }

        const endTime = new Date();
        const durationMs = endTime - session.startTime;
        const durationMinutes = Math.floor(durationMs / 60000);

        session.endTime = endTime;
        session.duration = durationMinutes;

        if (caloriesBurned) {
            session.caloriesBurned = caloriesBurned;
        }

        await session.save();

        res.json({ message: "Workout session finished", session });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

// @desc    Get member's workout history
// @route   GET /api/workout/history
// @access  Private
const getHistory = asyncHandler(async (req, res) => {
    const sessions = await WorkoutSession.find({ member: req.user._id, gym: req.user.gym })
        .sort({ startTime: -1 })
        .populate("program", "name")
        .lean();

    const sessionIds = sessions.map(s => s._id);
    const allSets = await WorkoutSet.find({ sessionId: { $in: sessionIds } })
        .populate("exerciseId", "exerciseName muscleGroup equipment")
        .lean();

    const setsBySession = {};
    for (const set of allSets) {
        const key = set.sessionId.toString();
        if (!setsBySession[key]) setsBySession[key] = [];
        setsBySession[key].push(set);
    }

    const history = sessions.map(s => ({
        ...s,
        sets: setsBySession[s._id.toString()] || [],
    }));

    res.json(history);
});

// @desc    Get all exercises
// @route   GET /api/workout/exercises
// @access  Private
const getExercises = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.muscleGroup) filter.muscleGroup = req.query.muscleGroup;
    if (req.query.equipment) filter.equipment = req.query.equipment;

    const exercises = await Exercise.find(filter).sort({ exerciseName: 1 }).lean();
    res.json(exercises);
});

module.exports = {
    startSession,
    addSet,
    finishSession,
    getHistory,
    getExercises,
};
