const NutritionLog = require("../models/NutritionLog");
const RecoveryLog = require("../models/RecoveryLog");
const asyncHandler = require("express-async-handler");

const logNutrition = asyncHandler(async (req, res) => {
    const { date, foodName, calories, protein, carbs, fat } = req.body;
    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    const log = await NutritionLog.create({
        member: req.user._id, gym: req.user.gym, date: logDate, foodName, calories, protein, carbs, fat
    });
    res.status(201).json(log);
});

const getDailyNutrition = asyncHandler(async (req, res) => {
    const { date } = req.query;
    const queryDate = date ? new Date(date) : new Date();
    queryDate.setHours(0, 0, 0, 0);

    const logs = await NutritionLog.find({ member: req.user._id, date: queryDate });
    const summary = logs.reduce((acc, log) => {
        acc.calories += log.calories;
        acc.protein += log.protein;
        acc.carbs += log.carbs;
        acc.fat += log.fat;
        return acc;
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });

    res.json({ logs, summary });
});

const logRecovery = asyncHandler(async (req, res) => {
    const { date, sleepHours, steps, fatigueScore } = req.body;
    const logDate = date ? new Date(date) : new Date();
    logDate.setHours(0, 0, 0, 0);

    const existingLog = await RecoveryLog.findOne({ member: req.user._id, date: logDate });
    if (existingLog) {
        existingLog.sleepHours = sleepHours ?? existingLog.sleepHours;
        existingLog.steps = steps ?? existingLog.steps;
        existingLog.fatigueScore = fatigueScore ?? existingLog.fatigueScore;
        await existingLog.save();
        return res.json(existingLog);
    }

    const log = await RecoveryLog.create({
        member: req.user._id, gym: req.user.gym, date: logDate, sleepHours, steps, fatigueScore
    });
    res.status(201).json(log);
});

const getRecoveryTrends = asyncHandler(async (req, res) => {
    const logs = await RecoveryLog.find({ member: req.user._id }).sort({ date: -1 }).limit(7);
    res.json(logs);
});

module.exports = { logNutrition, getDailyNutrition, logRecovery, getRecoveryTrends };
