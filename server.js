require("dotenv").config();

const app = require("./app");
const connectDB = require("./src/config/db");
const logger = require("./src/utils/logger");

// Background automation jobs
require("./src/jobs/membershipExpirationJob");
require("./src/jobs/renewalReminderJob");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        logger.info(`Server running on port ${PORT}`);
    });
};

startServer();
