const mongoose = require("mongoose");
const { app } = require("./app");
const config = require("./config/config");
const logger = require("./config/logger");
const rabbitMQManager = require("./rabbitMQ/rabbitMQManager.js");
const rabbitMQConfig = require("./rabbitMQ");

// Async bootstrap function
const bootstrap = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(config.mongoose.URL, config.mongoose.OPTIONS);
    logger.info(`Connected to MongoDB: ${config.env}`);

    // Start HTTP server
    const server = app.listen(config.port, () => {
      logger.info(`HTTP server listening on port ${config.port}`);
    });

    // Connect to RabbitMQ
    await rabbitMQManager.connect({
      uri: process.env.RABBITMQ_URI || "amqp://localhost",
      heartbeat: 60,
      topology: rabbitMQConfig.topology,
    });

    // Start consumers with application context
    await rabbitMQManager.startConsumers(rabbitMQConfig.consumers);

    // logger.info("RabbitMQ consumers started");

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      logger.info(`${signal} received - shutting down`);
      try {
        // Close HTTP server
        await new Promise((resolve) => server.close(resolve));

        // Close MongoDB connection
        await mongoose.connection.close();

        // Close RabbitMQ connection
        await rabbitMQManager.close();

        logger.info("All connections closed");
        process.exit(0);
      } catch (error) {
        logger.error("Error during shutdown", { error: error.message });
        process.exit(1);
      }
    };

    // Process signal handlers
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Uncaught exception handlers
    process.on("uncaughtException", (error) => {
      logger.error("Uncaught Exception", { error: error.message });
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      logger.error("Unhandled Rejection", { promise, reason });
      shutdown("unhandledRejection");
    });
  } catch (error) {
    console.log("🚀 ~ bootstrap ~ error:", error);
    logger.error("Bootstrap failed", { error: error.message });
    process.exit(1);
  }
};

// Start the service
bootstrap();
