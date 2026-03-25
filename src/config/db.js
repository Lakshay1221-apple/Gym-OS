const mongoose = require("mongoose");
const logger = require("../utils/logger");

const connectDB = async () => {
    try {
        if (!process.env.MONGO_URI) {
            logger.error("MongoDB connection error: MONGO_URI is not defined in .env");
            process.exit(1);
        }

        const conn = await mongoose.connect(process.env.MONGO_URI);

        logger.info(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        logger.error("MongoDB connection failed:", error);
        process.exit(1);
    }
};

module.exports = connectDB;
