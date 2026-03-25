const rateLimit = require("express-rate-limit");

const isTest = process.env.NODE_ENV === "test";

const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isTest ? 10000 : 100,
    message: { success: false, message: "Too many requests, try again later" },
});

const authLoginLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 1000 : 5,
    message: { success: false, message: "Too many login attempts, please try again after a minute" },
});

const authRegisterLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 1000 : 5,
    message: { success: false, message: "Too many registration attempts, please wait a minute" },
});

const authResetLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 1000 : 3,
    message: { success: false, message: "Too many reset attempts, try again later" },
});

const checkInLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: isTest ? 1000 : 3,
    message: { success: false, message: "Too many check-in requests, please wait a minute" },
});

module.exports = {
    generalLimiter,
    authLoginLimiter,
    authRegisterLimiter,
    authResetLimiter,
    checkInLimiter,
};
