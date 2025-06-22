// apps/api-gateway/src/middleware/cache.middleware.js
const NodeCache = require("node-cache");
const Logger = require("/usr/src/libs");

// Initialize NodeCache (in a real app, you'd use Redis or similar)
const cache = new NodeCache();

const createCacheMiddleware = (options) => {
  const ttlSeconds = options?.ttl || 3600; // Default TTL of 1 hour

  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") {
      return next();
    }

    const key = `__apicache__${req.originalUrl}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      Logger.debug(`[Cache Middleware] Cache hit for ${req.originalUrl}`);
      // Send cached data directly
      return res.send(cachedResponse);
    }

    // Intercept res.send to cache the response before sending
    const originalSend = res.send.bind(res);
    res.send = (body) => {
      // Ensure body is a string or buffer before caching
      const dataToCache =
        typeof body === "object" ? JSON.stringify(body) : body;
      cache.set(key, dataToCache, ttlSeconds);
      Logger.debug(
        `[Cache Middleware] Cache set for ${req.originalUrl} with TTL ${ttlSeconds} seconds.`
      );
      originalSend(body);
    };

    next();
  };
};

module.exports = createCacheMiddleware;
