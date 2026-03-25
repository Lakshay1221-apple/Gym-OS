const crypto = require("crypto");

const generateRefreshToken = () => {
    return crypto.randomBytes(40).toString("hex");
};

module.exports = generateRefreshToken;
