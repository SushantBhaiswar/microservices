const restUtils = require("../utils/rest");

/**
 * Creates a middleware function that proxies the request to the target service
 * based on its communication type.
 * This function is called once during router setup to create the middleware.
 * The returned middleware is then executed for each incoming request.
 *
 * @param {object} serviceConfig - The configuration for the specific service.
 * @param {object} versionConfig - The configuration for the specific service version (optional, for REST/gRPC).
 * @returns {Function} An Express.js middleware function.
 */
const proxyRequest = (serviceConfig, versionConfig = {}) => {
  return async (req, res, next) => {
    const { communication, url } = serviceConfig;
    const timeout = versionConfig.timeout || 10000;

    try {
      // Clone headers to avoid mutating the original
      const headers = { ...req.headers };
      if (req.user && (req.user._id || req.user.id)) {
        headers["x-user-id"] = req.user._id || req.user.id;
      }
      switch (communication) {
        case "rest":
          const restResult = await restUtils.restRequest(
            url,
            { method: req.method, path: req.path },
            headers,
            req.body,
            timeout
          );
          res.sendJSONResponse(restResult.data);
          break;

        // case COMMUNICATION_TYPES.GRPC:
        //     // For gRPC, the last part of the path might be the method name,
        //     // or you might have a more sophisticated mapping.
        //     // This example assumes the format /users/v1/getProfile -> getProfile method
        //     const grpcPathParts = req.originalUrl.replace(new RegExp(`^${req.baseUrl}/${versionConfig.version}/?`), '').split('/');
        //     const grpcMethodName = grpcPathParts.pop(); // Last part is method name
        //     const grpcPayload = req.body; // Assuming request body is the gRPC payload

        //     if (!grpcMethodName) {
        //         throw new Error('gRPC method name not found in URL path.');
        //     }

        //     const grpcResponse = await grpcUtils.grpcClientCall(
        //         url,
        //         protoPath,
        //         packageName,
        //         serviceName,
        //         grpcMethodName,
        //         grpcPayload,
        //         timeout
        //     );
        //     res.send(grpcResponse); // gRPC responses are usually JSON/objects
        //     break;

        // case COMMUNICATION_TYPES.RABBITMQ:
        // For RabbitMQ, we just publish the request body to a queue
        //  await rabbitmqUtils.publishMessage(url, queue, req.body);
        //  res.status(202).send({ message: 'Message published to queue' }); // 202 Accepted
        // break;

        default:
          throw new Error(`Unsupported communication method: ${communication}`);
      }
    } catch (error) {
      next(error);
    }
  };
};

module.exports = { proxyRequest };
