const express = require("express");
const { ServicesInfo, Logger } = require("/usr/src/libs");
const proxy = require("./proxy");
const createRateLimiter = require("../middlewares/rate-limit.middleware");
const createCircuitBreaker = require("../middlewares/circuit-breaker.middleware");
const createCacheMiddleware = require("../middlewares/cache.middleware");

const router = express.Router();

// Centralized middleware mapping
const gatewayMiddlewares = {
  rateLimit: createRateLimiter,
  cache: createCacheMiddleware,
  circuitBreaker: createCircuitBreaker,
};

/**
 * Helper function to dynamically apply middlewares and circuit breakers
 * based on service configuration.
 * @param {object} versionConfig - The configuration for the specific service version.
 * @param {object} servicesConfig - The overall configuration for the service.
 * @returns {Array<Function>} An array of middleware functions to apply.
 */
const buildMiddlewareChain = (ServicesInfo, versionConfig) => {
  const middlewares = [];

  // Apply gateway-level middlewares
  (`versionConfig`.middleware || []).forEach((middlewareName) => {
    if (gatewayMiddlewares[middlewareName]) {
      let middlewareInstance;
      if (middlewareName === "rateLimit") {
        middlewareInstance = gatewayMiddlewares[middlewareName](
          versionConfig.rateLimit
        );
      } else if (middlewareName === "cache") {
        middlewareInstance = gatewayMiddlewares[middlewareName](
          versionConfig.cache
        );
      } else {
        middlewareInstance = gatewayMiddlewares[middlewareName];
      }
      middlewares.push(middlewareInstance);
    } else {
      Logger.warn(
        `[Router Setup] Middleware "${middlewareName}" not found for ${ServicesInfo.prefix} ${versionConfig.version}.`
      );
    }
  });

  // Prepare the core proxy action with timeout
  const proxyAction = proxy.proxyRequest(ServicesInfo, versionConfig);

  // Apply circuit breaker if enabled for the service
  let finalHandler = proxyAction;
  // if (ServicesInfo.circuitBreaker && ServicesInfo.circuitBreaker.enabled) {
  //     const breakerWrapper = gatewayMiddlewares.circuitBreaker(ServicesInfo.name, ServicesInfo.circuitBreaker);
  //     finalHandler = breakerWrapper(proxyAction); // Wrap the proxy action with the circuit breaker
  //     logger.debug(`[Router Setup] Circuit breaker enabled for ${ServicesInfo.name}.`);
  // }

  middlewares.push(finalHandler);
  return middlewares;
};

for (const serviceName in ServicesInfo) {
  const service = ServicesInfo[serviceName];
  const serviceRouter = express.Router();

  if (service.versions) {
    Object.entries(service.versions).forEach(([version, versionConfig]) => {
      if (versionConfig.enabled) {
        const middlewareChain = buildMiddlewareChain(service, {
          ...versionConfig,
          version,
        });
        serviceRouter.all(`/${version}/*`, ...middlewareChain);
      } else {
        serviceRouter.all(`/${version}/*`, (req, res) => {
          res.status(410).send({
            error: `API version ${version} for ${serviceName} is disabled.`,
          });
        });
        Logger.info(
          `[Router Setup] Version ${version} for ${serviceName} is disabled.`
        );
      }
    });
    serviceRouter.all("/", (req, res) => {
      res
        .sendJsonResponse({})
        .status(404)
        .send({
          error: `Please specify an API version for ${serviceName} (e.g., ${service.prefix}/v1/...).`,
        });
    });
  } else {
    const middlewareChain = buildMiddlewareChain(service, {});
    serviceRouter.all("/*", ...middlewareChain);
  }
  router.use(service.prefix, serviceRouter);
}

module.exports = router;
