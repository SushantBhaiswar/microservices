const CircuitBreaker = require("opossum");
const Logger = require("/usr/src/libs");
const httpStatus = require("http-status");

// This function creates a circuit breaker instance for a given service.
// It will wrap the actual proxy request function.
const createCircuitBreaker = (serviceName, options) => {
  if (!options || !options.enabled) {
    Logger.info(
      `[Circuit Breaker] Circuit breaker disabled for ${serviceName}`
    );
    // Return a no-op function if disabled, so it doesn't interfere
    return (action) => action;
  }

  const breakerOptions = {
    timeout: options.timeout || 3000, // If the action takes longer than this, it's a failure
    errorThresholdPercentage: options.threshold || 50, // Percentage of failures to trip the circuit
    resetTimeout: options.resetTimeout || 10000, // Time to wait before attempting to close the circuit
    // volumeThreshold: 10, // Minimum number of requests in a rolling window to trip the circuit
    // ... more options from opossum documentation
  };

  const breaker = new CircuitBreaker(async (proxyAction, req, res) => {
    // The action passed to the circuit breaker is the actual proxy call
    return proxyAction(req, res);
  }, breakerOptions);

  breaker.on("open", () => {
    Logger.error(
      `[Circuit Breaker] Circuit for ${serviceName} OPENED. Service is likely unhealthy.`
    );
  });
  breaker.on("halfOpen", () => {
    Logger.warn(
      `[Circuit Breaker] Circuit for ${serviceName} HALF-OPEN. Testing service health.`
    );
  });
  breaker.on("close", () => {
    Logger.info(
      `[Circuit Breaker] Circuit for ${serviceName} CLOSED. Service has recovered.`
    );
  });
  breaker.on("fallback", (result) => {
    Logger.warn(
      `[Circuit Breaker] Fallback executed for ${serviceName}. Result: ${result}`
    );
  });
  breaker.on("reject", () => {
    Logger.warn(
      `[Circuit Breaker] Request to ${serviceName} REJECTED (circuit open).`
    );
  });

  // Return a middleware-like function that wraps the proxy action
  return (proxyAction) => async (req, res, next) => {
    try {
      await breaker.fire(proxyAction, req, res);
    } catch (err) {
      // If the circuit is open or request rejected, handle the error gracefully
      if (breaker.opened || breaker.halfOpen) {
        return res.status(httpStatus.SERVICE_UNAVAILABLE).sendJSONResponse({
          code: httpStatus.SERVICE_UNAVAILABLE,
          message: `${serviceName} is currently unavailable. Please try again later.`,
          developerMessage: "Circuit breaker is open/half-open.",
          isShowMessage: true,
        });
      }
      // If it's another error, pass it to the next error handler
      next(err);
    }
  };
};

module.exports = createCircuitBreaker;
