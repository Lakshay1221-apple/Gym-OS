const mongoose = require("mongoose");
const User = require("../models/User");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("express-async-handler");

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, gymId } = req.body;

    if (!gymId) {
        res.status(400);
        throw new Error("A specific Gym ID must be provided to register");
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        res.status(400);
        throw new Error("User already exists");
    }

    const user = await User.create({
        name,
        email,
        password,
        role,
        gym: gymId,
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gym: user.gym,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error("Invalid user data");
    }
});

// @desc    Register a new Gym Tenant Configuration
// @route   POST /api/auth/register-gym
// @access  Public (for MVP bootstrapping)
const registerTenant = asyncHandler(async (req, res) => {
    const { gymName, location, ownerName, ownerEmail, ownerPassword } = req.body;

    const Gym = require("../models/Gym");

    const existingUser = await User.findOne({ email: ownerEmail });
    if (existingUser) {
        res.status(400);
        throw new Error("Owner email already exists");
    }

    // Temporarily map to a fake ObjectId so it passes validation, then update
    const owner = await User.create({
        name: ownerName,
        email: ownerEmail,
        password: ownerPassword,
        role: "admin",
        gym: new mongoose.Types.ObjectId()
    });

    const gym = await Gym.create({
        name: gymName,
        location: location,
        owner: owner._id,
    });

    // Retroactively anchor the owner to the new tenant space
    owner.gym = gym._id;
    await owner.save();

    res.status(201).json({
        message: "Tenant environment successfully provisioned",
        gymId: gym._id,
        owner: {
            _id: owner._id,
            email: owner.email,
            token: generateToken(owner._id)
        }
    });
});
// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gym: user.gym,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error("Invalid email or password");
    }
});

// @desc    Get user profile
// @route   GET /api/auth/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).lean();

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            gym: user.gym,
        });
    } else {
        res.status(404);
        throw new Error("User not found");
    }
});

// @desc    Logout user / clear token
// @route   POST /api/auth/logout
// @access  Private
const logoutUser = (req, res) => {
    // In JWT approach without cookies, client deletes token.
    res.json({ message: "Logout successful" });
};

module.exports = {
    registerUser,
    registerTenant,
    loginUser,
    getUserProfile,
    logoutUser,
};
