const mongoose = require("mongoose");
const app = require("./app");
const config = require("./config/config");
const { rabbitMQ, Logger } = require("/usr/src/libs");
const rabbitMQConfig = require("./rabbitMQ");

// Async bootstrap function
const bootstrap = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.URL, config.mongoose.OPTIONS);
    Logger.info(`Connected to MongoDB: ${config.env}`);

    // Start HTTP server
    const server = app.listen(config.port, () => {
      Logger.info(`HTTP server listening on port ${config.port}`);
    });

    // Connect to RabbitMQ
    await rabbitMQ.connect({
      uri: process.env.RABBITMQ_URI || "amqp://rabbitmq",
      heartbeat: 60,
      topology: rabbitMQConfig.topology,
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      Logger.info(`${signal} received - shutting down`);
      try {
        await new Promise((resolve) => server.close(resolve));
        await mongoose.connection.close();
        await rabbitMQ.close();
        Logger.info("All connections closed");
        process.exit(0);
      } catch (error) {
        Logger.error("Error during shutdown", { error });
        process.exit(1);
      }
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("uncaughtException", (error) => {
      Logger.error("Uncaught Exception", { error });
      shutdown("uncaughtException");
    });
    process.on("unhandledRejection", (reason, promise) => {
      Logger.error("Unhandled Rejection", { promise, reason });
      shutdown("unhandledRejection");
    });
  } catch (error) {
    Logger.error("Bootstrap failed", { error });
    process.exit(1);
  }
};

// Start the service
bootstrap();
