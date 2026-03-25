module.exports = {
    testEnvironment: "node",
    testTimeout: 30000, // MongoMemoryReplSet needs time to elect a primary
    testMatch: ["**/tests/**/*.test.js"],
    forceExit: true,    // prevent hanged connections from blocking exit
    collectCoverageFrom: [
        "src/**/*.js",
        "!src/config/swagger.js",   // static OpenAPI spec, not business logic
        "!src/config/db.js",        // DB connection setup, exercised by MongoMemoryReplSet
        "!src/utils/logger.js",     // disabled in test env (morgan/winston)
        "!src/jobs/**",             // cron scheduler wrappers; underlying service logic
                                    // is covered by cron.test.js directly
    ],
    coverageThreshold: {
        global: {
            lines: 70,
            functions: 55,
            branches: 50,
            statements: 70,
        },
    },
};
