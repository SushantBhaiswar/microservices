const serviceName = require("./serviceNames");
const GATEWAY_MIDDLEWARE = {
  RATE_LIMIT: "rateLimit",
  CACHE: "cache",
};

module.exports = {
  [serviceName["logging-service"]]: {
    prefix: "/logs",
    url: process.env.LOGGING_SERVICE_URL || "http://logging-service:3001",
    communication: "rest",
    versions: {
      v1: {
        enabled: true,
        middleware: [GATEWAY_MIDDLEWARE.RATE_LIMIT],
        rateLimit: { windowMs: 60 * 1000, max: 500 },
      },
    },

    circuitBreaker: { enabled: false },
  },

  [serviceName["user-service"]]: {
    prefix: "/user",
    url: process.env.AUTH_SERVICE_URL || "http://localhost:3003",
    communication: "rest",
    versions: {
      v1: {
        enabled: true,
        // middleware: [
        //   GATEWAY_MIDDLEWARE.AUTHENTICATION,
        //   GATEWAY_MIDDLEWARE.RATE_LIMIT,
        // ],
        rateLimit: { windowMs: 60 * 1000, max: 100 },
        timeout: 5000,
      },
    },
  },

  [serviceName["auth-service"]]: {
    prefix: "/auth",
    url: process.env.AUTH_SERVICE_URL || "http://localhost:3001",
    communication: "rest",
    versions: {
      v1: {
        enabled: true,
        // middleware: [
        //   GATEWAY_MIDDLEWARE.AUTHENTICATION,
        //   GATEWAY_MIDDLEWARE.RATE_LIMIT,
        // ],
        rateLimit: { windowMs: 60 * 1000, max: 100 },
        timeout: 5000,
      },
    },
  },
};
