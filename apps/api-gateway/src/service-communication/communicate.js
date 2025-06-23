const httpStatus = require("http-status");
const APIError = require("../utils/ApiError");
const servicesConfig = require("../");
const { restRequest } = require("../utils/rest");
const config = require("../config/config");

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
  // Validate input parameters
  if (!apiRoute || !Object.keys(apiRoute).length) {
    throw new APIError(httpStatus.BAD_REQUEST, "Invalid api routing parameter");
  }

  if (!serviceName || typeof serviceName !== "string") {
    throw new APIError(
      httpStatus.BAD_REQUEST,
      "Invalid service name parameter"
    );
  }

  // Get service configuration
  const serviceConfig = servicesConfig[serviceName];
  if (!serviceConfig) {
    throw new APIError(
      httpStatus.NOT_FOUND,
      `Service '${serviceName}' not found in configuration`
    );
  }

  const { communication, url } = serviceConfig;

  // Destructure with validation
  if (!communication) {
    throw new APIError(
      httpStatus.INTERNAL_SERVER_ERROR,
      `Missing communication type for service '${serviceName}'`
    );
  }

  if (!url) {
    throw new APIError(
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
      throw new APIError(
        httpStatus.NOT_IMPLEMENTED,
        `gRPC communication not implemented for service '${serviceName}'`
      );

    case "queue":
      throw new APIError(
        httpStatus.NOT_IMPLEMENTED,
        `Queue-based communication not implemented for service '${serviceName}'`
      );

    default:
      throw new APIError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Unsupported communication type '${communication}' for service '${serviceName}'`
      );
  }
};
