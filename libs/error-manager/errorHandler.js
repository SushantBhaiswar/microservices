const  ResponseMessages  = require("../lang/en/responseMessages.json");
const logger = require("../logger");

const errorHandler = (err, req, res, next) => {
  let { statusCode, message, errorKey, details, service } = err;
  const serviceName = process.env.SERVICE_NAME || "unknown";
    logger.error(err);
  // If message is a key, map to actual message
  const userMessage = ResponseMessages[message] || message || "Unknown error";

    res.sendJSONResponse({
    code: statusCode || 500,
    status: false,
    message: userMessage,
    errorKey: errorKey || message,
    details: details || {},
    service: service || serviceName,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack })
    });
};

module.exports = errorHandler;
