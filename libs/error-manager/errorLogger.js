const { v4: uuidv4 } = require("uuid");
const logger = require("../logger/index");
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

module.exports = requestLogger;
