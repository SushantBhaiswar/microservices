const httpStatus = require("http-status");
const ApiError = require("../error-manager/apiError");
const servicesConfig = require("../config/services.info");
const { restRequest } = require("./rest/index");
const crypto = require("crypto");
const { promisify } = require("util");
const randomBytes = promisify(crypto.randomBytes);
const config = require("../config/index");

const generateServiceToken = async () => {
  const timestamp = Date.now();
  const nonce = (await randomBytes(8)).toString("hex");
  const data = `${timestamp}:${nonce}`;

  const hmac = crypto.createHmac("sha256", config.service_token_secret);
  hmac.update(data);
  const signature = hmac.digest("hex");

  return Buffer.from(`${data}:${signature}`).toString("base64");
};

module.exports = async (serviceName, apiRoute, data = {}) => {
  try {
    // Validate input parameters
    if (!apiRoute || !Object.keys(apiRoute).length) {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid api routing parameter"
      );
    }

    if (!serviceName || typeof serviceName !== "string") {
      throw new ApiError(
        httpStatus.BAD_REQUEST,
        "Invalid service name parameter"
      );
    }

    // Get service configuration
    const serviceConfig = servicesConfig[serviceName];
    if (!serviceConfig) {
      throw new ApiError(
        httpStatus.NOT_FOUND,
        `Service '${serviceName}' not found in configuration`
      );
    }

    // Destructure with validation
    const { communication, url } = serviceConfig;

    if (!communication) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Missing communication type for service '${serviceName}'`
      );
    }

    if (!url) {
      throw new ApiError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Missing URL configuration for service '${serviceName}'`
      );
    }

    // Handle different communication protocols
    switch (communication.toLowerCase()) {
      case "rest":
        const response = await restRequest(
          url,
          apiRoute,
          { "x-service-token": await generateServiceToken() },
          data
        );
        return response.data;
      case "grpc":
        throw new ApiError(
          httpStatus.NOT_IMPLEMENTED,
          `gRPC communication not implemented for service '${serviceName}'`
        );

      default:
        throw new ApiError(
          httpStatus.INTERNAL_SERVER_ERROR,
          `Unsupported communication type '${communication}' for service '${serviceName}'`
        );
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errorKey) {
      throw new ApiError(
        error.response.data.code || 400,
        error.response.data.errorKey,
        false,
        error.response.data.message
      );
    }
    throw new ApiError(503, "SERVICE_UNAVAILABLE", false, error);
  }
};
