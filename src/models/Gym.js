const mongoose = require("mongoose");

const gymSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        location: {
            type: String,
            required: true,
        },
        owner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
    },
    { timestamps: true }
);

const Gym = mongoose.models.Gym || mongoose.model("Gym", gymSchema);

module.exports = Gym;
