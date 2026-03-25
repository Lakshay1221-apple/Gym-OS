const mongoose = require("mongoose");

const paymentSchema = new mongoose.Schema(
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
        },
        amount: {
            type: Number,
            required: true,
        },
        currency: {
            type: String,
            default: "INR",
        },
        method: {
            type: String,
            enum: ["cash", "upi", "card", "online"],
            required: true,
        },
        status: {
            type: String,
            enum: ["pending", "completed", "failed", "refunded"],
            default: "completed",
        },
        transactionId: {
            type: String,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    },
    {
        timestamps: true,
    }
);

// Add indices for fast financial querying
paymentSchema.index({ member: 1 });
paymentSchema.index({ createdAt: -1 });
paymentSchema.index({ membership: 1 });

const Payment = mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

module.exports = Payment;
