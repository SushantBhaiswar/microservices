const winston = require("winston");
const config = require("./config");

const serviceName = process.env.SERVICE_NAME || "logging-service";

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
  winston.format.printf(({ level, message, timestamp, service, ...meta }) => {
    return `${timestamp} [${level}] [${service || serviceName}] ${message}`;
  })
);

const logger = winston.createLogger({
  level: config.env === "development" ? "debug" : "info",
  format: baseFormat,
  defaultMeta: { service: serviceName },
  transports: [
    new winston.transports.Console({
      format: consoleFormat,
      stderrLevels: ["error"],
    }),
  ],
});

module.exports = logger;
