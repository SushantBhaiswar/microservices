const winston = require("winston");
const config = require("./config");

const enumerateErrorFormat = winston.format((info) => {
  if (info instanceof Error) {
    Object.assign(info, { message: info.stack });
  }
  return info;
});

const baseFormat = winston.format.combine(
  enumerateErrorFormat(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss.SSS" }),
  winston.format.errors({ stack: true }),
  winston.format.splat()
);

const consoleFormat = winston.format.combine(
  baseFormat,
  winston.format.colorize(),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    return `${timestamp} [${level}] [${meta.service || "unknown"}] ${message}`;
  })
);

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: baseFormat,
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ["error"],
    }),
  ],
});

module.exports = logger;
