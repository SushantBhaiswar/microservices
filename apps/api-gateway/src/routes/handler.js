const express = require("express");
const httpStatus = require("http-status");
const { APIError, Logger } = require("/usr/src/libs");

module.exports = (serviceConfig, applyMiddlewares) => {
  const router = express.Router();

  if (!serviceConfig || !serviceConfig.versions) {
    Logger.error(
      `[Auth Routes] Invalid configuration for authentication-service.`
    );
    return router;
  }

  Object.entries(serviceConfig.versions).forEach(([version, versionConfig]) => {
    if (versionConfig.enabled) {
      const routePath = `/${version}/*`;
      const middlewares = applyMiddlewares(
        versionConfig,
        serviceConfig.name || "authentication-service"
      );
      router.all(routePath, ...middlewares);
      Logger.info(
        `[Auth Routes] Registered route ${serviceConfig.prefix}${routePath}`
      );
    } else {
      Logger.info(
        `[Auth Routes] Version ${version} for authentication-service is disabled.`
      );
      // Optionally, return a 410 Gone for disabled versions
      router.all(`/${version}/*`, (req, res) => {
        throw new APIError(
          httpStatus.GONE,
          `API version ${version} for authentication-service is no longer available.`
        );
      });
    }
  });

  // Handle requests to base prefix without a version (e.g., /auth)
  router.all("/", (req, res) => {
    throw new APIError(
      httpStatus.NOT_FOUND,
      "Please specify an API version (e.g., /auth/v1/...)."
    );
  });

  return router;
};
