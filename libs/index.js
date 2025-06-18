module.exports = {
  Logger: require("./logger"),
  Communicate: require("./error-manager/apiError"),
  ...require("./error-manager"),
  ...require("./config"),
  ClientErrMessages: require("./lang/en/clientSideError.json"),
  ResponseMessages: require("./lang/en/responseMessages.json"),
  rabbitMQ: require("./messaging/index"),
  // connectDB: require("./db/mongoose"),
  // rabbitMQ: require("./rabbitmq/connection"),
};

// require("dotenv").config();
// const express = require("express");
// const cors = require("cors");
// const helmet = require("helmet");
// const compression = require("compression");
// const ApiError = require("./error-handler/apiError");
// const { errorConverter } = require("./error-handler/errorConverter");
// const logger = require("./logger");
// const { v4: uuidv4 } = require("uuid");
// const databaseManager = require("./db-clients");
// const rabbitMQManager = require("./messaging");

// class ServiceFramework {
//   constructor(config = {}) {
//     this.app = express();
//     this.config = {
//       port: process.env.PORT || 3000,
//       cors: {
//         origin: process.env.CORS_ORIGIN || "*",
//         credentials: true,
//       },
//       //   rateLimit: {
//       //     windowMs: 15 * 60 * 1000,
//       //     max: 100,
//       //   },
//       ...config,
//     };
//     this.databaseManager = databaseManager;
//     this.rabbitMQManager = rabbitMQManager;
//     this.dbConnections = new Map();

//     this.setupMiddleware();
//     this.setupUtilitiesInjection();
//     this.setupRequestLogging();
//     this.setupErrorHandling();
//   }

//   setupUtilitiesInjection() {
//     this.app.request.ApiError = ApiError;
//     this.app.request.logger = logger;
//     this.app.response.sendJSONResponse = function ({
//       code,
//       message,
//       data,
//       status = true,
//       isShowMessage = true,
//     }) {
//       return this.status(code).json({
//         code,
//         status,
//         message,
//         isShowMessage,
//         data,
//       });
//     };
//   }

//   setupRequestLogging() {
//     this.app.use((req, res, next) => {
//       const incomingTraceId = req.headers["x-trace-id"];
//       const incomingSpanId = req.headers["x-span-id"];

//       req.traceContext = {
//         traceId: incomingTraceId || uuidv4(),
//         parentSpanId: incomingSpanId || null,
//         spanId: uuidv4(),
//       };

//       req.headers["x-trace-id"] = req.traceContext.traceId;
//       req.headers["x-span-id"] = req.traceContext.spanId;

//       const startTime = Date.now();
//       const { method, originalUrl, ip } = req;

//       rabbitMQManager.publish(
//         "log.request.exc",
//         "log",
//         JSON.stringify(req.traceContext)
//       );

//       // Log on arrival
//       logger.info(`[Request] ${method} ${originalUrl} from ${ip}`);

//       res.on("finish", () => {
//         const endTime = Date.now();
//         const duration = endTime - startTime;
//         const { statusCode } = res;

//         // Log on departure
//         logger.info(
//           `[Response] ${method} ${originalUrl} - Status: ${statusCode}, Duration: ${duration}ms`
//         );
//       });

//       next();
//     });
//   }

//   setupMiddleware() {
//     // Security middleware
//     this.app.use(helmet());
//     this.app.disable("etag");

//     this.app.use(cors(this.config.cors));
//     this.app.use(compression());

//     // Rate limiting
//     // if (this.config.rateLimit) {
//     //   this.app.use(rateLimit(this.config.rateLimit));
//     // }

//     // Body parsing
//     this.app.use(express.json({ limit: "10mb" }));
//     this.app.use(express.urlencoded({ extended: true, limit: "10mb" }));

//     // Request logging
//     //this.app.use(requestLogger);

//     // Health check endpoint
//     function formatUptime(seconds) {
//       const hrs = Math.floor(seconds / 3600);
//       const mins = Math.floor((seconds % 3600) / 60);
//       const secs = Math.floor(seconds % 60);
//       return `${hrs}h ${mins}m ${secs}s`;
//     }

//     this.app.get("/health", (req, res) => {
//       res.sendJSONResponse({
//         code: 200,
//         status: true,
//         message: "Service is healthy",
//         data: {
//           status: "OK",
//           timestamp: new Date().toISOString(),
//           uptime: formatUptime(process.uptime()),
//         },
//       });
//     });
//   }

//   setupProcessEventHandlers() {
//     const exitHandler = () => {
//       logger.info("Exiting...");
//       if (this.server) {
//         this.server.close(() => {
//           logger.info("Server closed");
//           process.exit(1);
//         });
//       } else {
//         process.exit(1);
//       }
//     };

//     const unexpectedErrorHandler = (error) => {
//       logger.error("Unexpected error:", error);
//       exitHandler();
//     };

//     process.on("uncaughtException", unexpectedErrorHandler);
//     process.on("unhandledRejection", unexpectedErrorHandler);

//     process.on("SIGTERM", () => {
//       logger.info("SIGTERM received");
//       if (this.server) {
//         this.server.close(() => {
//           logger.info("Server closed");
//           process.exit(0);
//         });
//       } else {
//         process.exit(0);
//       }
//     });

//     process.on("SIGINT", () => {
//       logger.info("SIGINT received");
//       // Add any specific cleanup like database disconnection here
//       // if (mongoose && mongoose.connection) {
//       //   await mongoose.connection.close();
//       //   logger.info('MongoDB connection closed');
//       // }
//       if (this.server) {
//         this.server.close(() => {
//           logger.info("Server closed");
//           process.exit(0);
//         });
//       } else {
//         process.exit(0);
//       }
//     });
//   }

//   setupErrorHandling() {
//     // 404 handler
//     this.app.use(errorConverter);

//     // global error handler
//     this.app.use((err, req, res, next) => {
//       let statusCode = err.statusCode || 500;
//       let message = err.message || "Internal Server Error";
//       logger.error(err);
//       res.sendJSONResponse({
//         code: statusCode,
//         status: false,
//         message: message,
//         ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
//       });
//     });
//   }

//   async connectRabbitMQ(config) {
//     await rabbitMQManager.connect(config);
//     if (config.topology) {
//       await rabbitMQManager.configureTopology(config.topology);
//     }
//   }

//   async startConsumers(consumers) {
//     for (const consumer in consumers) {
//       let abc = consumers[consumer];
//       await rabbitMQManager.consume(
//         consumers[consumer].queue,
//         consumers[consumer].handler,
//         consumers[consumer].options,
//         this.databaseManager
//       );
//     }
//   }

//   async connectDatabase(connectionName, dbConfigs, modelDefinitions) {
//     if (!Array.isArray(dbConfigs)) {
//       dbConfigs = [dbConfigs];
//     }

//     await this.databaseManager._doInitialize(
//       connectionName,
//       dbConfigs,
//       modelDefinitions
//     );
//   }

//   use(middleware) {
//     this.app.use(middleware);
//     return this;
//   }

//   route(path, router) {
//     this.app.use(path, router);
//     return this;
//   }

//   async start() {
//     return new Promise((resolve) => {
//       const server = this.app.listen(this.config.port, () => {
//         logger.info(`Service started on port ${this.config.port}`, {
//           port: this.config.port,
//           environment: process.env.NODE_ENV || "development",
//         });
//         resolve(server);
//       });

//       // Graceful shutdown
//       process.on("SIGTERM", () => this.gracefulShutdown(server));
//       process.on("SIGINT", () => this.gracefulShutdown(server));
//     });
//   }

//   async gracefulShutdown(server) {
//     logger.info("Received shutdown signal, starting graceful shutdown...");

//     server.close(async () => {
//       try {
//         // await databaseManager.disconnectAll();
//         // await rabbitMQManager.close();
//         logger.info("Graceful shutdown completed");
//         process.exit(0);
//       } catch (error) {
//         logger.error("Error during shutdown", { error: error.message });
//         process.exit(1);
//       }
//     });
//   }

//   get database() {
//     return databaseManager;
//   }

//   get dbConnectionsMap() {
//     return this.dbConnections;
//   }

//   get logger() {
//     return logger;
//   }

//   get errorHandler() {
//     return ErrorHandler;
//   }
// }

// module.exports = ServiceFramework;
