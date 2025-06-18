const mongoose = require("mongoose");
const httpStatus = require("http-status");
const config = require("../config/config");
const logger = require("../config/logger");
const ApiError = require("../");
const { v4: uuidv4 } = require("uuid");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error
        ? httpStatus.BAD_REQUEST
        : httpStatus.INTERNAL_SERVER_ERROR;
    const message = error.message || httpStatus[statusCode];
    error = new ApiError(statusCode, message, false, err.stack);
  }
  next(error);
};

// eslint-disable-next-line no-unused-vars
const errorHandler = async (err, req, res, next) => {
  let { statusCode, message } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (statusCode == 500) response.message = "Internal Server Error!";
  logger.error(err);
  res.sendJSONResponse({
    code: statusCode,
    status: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

const requestLogger = (req, res, next) => {
  const incomingTraceId = req.headers["x-trace-id"];
  const incomingSpanId = req.headers["x-span-id"];

  req.traceContext = {
    traceId: incomingTraceId || uuidv4(),
    parentSpanId: incomingSpanId || null,
    spanId: uuidv4(),
  };

  req.headers["x-trace-id"] = req.traceContext.traceId;
  req.headers["x-span-id"] = req.traceContext.spanId;

  const startTime = Date.now();
  const { method, originalUrl, ip } = req;

  //publish log
  // rabbitMQManager.publish(
  //   "log.request.exc",
  //   "log",
  //   JSON.stringify(req.traceContext)
  // );

  // Log on arrival
  logger.info(`[Request] ${method} ${originalUrl} from ${ip}`);

  res.on("finish", () => {
    const endTime = Date.now();
    const duration = endTime - startTime;
    const { statusCode } = res;

    // Log on departure
    logger.info(
      `[Response] ${method} ${originalUrl} - Status: ${statusCode}, Duration: ${duration}ms`
    );
  });

  next();
};
module.exports = {
  errorConverter,
  requestLogger,
  errorHandler,
};
