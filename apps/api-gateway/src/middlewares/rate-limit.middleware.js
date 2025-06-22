// apps/api-gateway/src/middleware/rate-limit.middleware.js
const rateLimit = require("express-rate-limit");
const { Logger } = require("/usr/src/libs");
const httpStatus = require("http-status");

const createRateLimiter = (options) => {
  Logger.debug(
    `[Rate Limit Middleware] Creating rate limiter with max: ${options.max}, windowMs: ${options.windowMs}`
  );
  return rateLimit({
    windowMs: options.windowMs || 60 * 1000, // Default: 1 minute
    max: options.max || 100, // Default: 100 requests per window
    message: (req, res) => {
      Logger.warn(
        `[Rate Limit Middleware] Too many requests from IP: ${req.ip}`
      );
      res.status(httpStatus.TOO_MANY_REQUESTS).sendJSONResponse({
        code: httpStatus.TOO_MANY_REQUESTS,
        message: "Too many requests, please try again later.",
        isShowMessage: true,
      });
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    // keyGenerator: (req) => req.user ? req.user.id : req.ip, // Use user ID if authenticated, else IP
    // store: new RedisStore({ // Example for Redis store (requires 'rate-limit-redis' package)
    //     redis: new RedisClient({ host: 'redis', port: 6379 }),
    // }),
  });
};

module.exports = createRateLimiter;
