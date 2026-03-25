const jwt = require("jsonwebtoken");

const generateToken = (id, gym) => {
    return jwt.sign({ id, gym }, process.env.JWT_SECRET || "fallback_secret", {
        expiresIn: "15m",
    });
};

module.exports = generateToken;
