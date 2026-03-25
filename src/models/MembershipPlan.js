const mongoose = require("mongoose");

const membershipPlanSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  durationDays: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  description: String,
  gym: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Gym",
    required: true,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  }
}, { timestamps: true });

// Check if model already exists to prevent "OverwriteModelError" if mongoose re-registers it
const MembershipPlan = mongoose.models.MembershipPlan || mongoose.model("MembershipPlan", membershipPlanSchema);
module.exports = MembershipPlan;
