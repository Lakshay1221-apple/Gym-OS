const { createLogger, format, transports } = require("winston");
const { combine, timestamp, printf, colorize, errors } = format;

const isDev = process.env.NODE_ENV !== "production";

// Human-readable format for development
const devFormat = combine(
    colorize(),
    timestamp({ format: "HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) =>
        stack
            ? `${timestamp} ${level}: ${message}\n${stack}`
            : `${timestamp} ${level}: ${message}`
    )
);

// Structured JSON format for production (log shippers, Datadog, etc.)
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    format.json()
);

const logger = createLogger({
    level: process.env.LOG_LEVEL || "info",
    format: isDev ? devFormat : prodFormat,
    transports: [
        new transports.Console(),
    ],
    // Never crash the process on logger error
    exitOnError: false,
});

// Morgan stream adapter — routes morgan output through winston
logger.stream = {
    write: (message) => logger.http(message.trimEnd()),
};

module.exports = logger;
