const mongoose = require("mongoose");

const nutritionLogSchema = new mongoose.Schema({
    member: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    gym: { type: mongoose.Schema.Types.ObjectId, ref: "Gym", required: true },
    date: { type: Date, required: true },
    foodName: { type: String, required: true },
    calories: { type: Number, required: true },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 }
}, { timestamps: true });

nutritionLogSchema.index({ member: 1, date: 1 });

module.exports = mongoose.model("NutritionLog", nutritionLogSchema);
