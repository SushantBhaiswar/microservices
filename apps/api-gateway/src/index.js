const mongoose = require("mongoose");
const { app } = require("./app");
const config = require("./config/config");

const { Logger, rabbitMQ } = require("@shared/libs");
const rabbitMQConfig = require("./rabbitMQ");

// Async bootstrap function
const bootstrap = async () => {
  try {
    // Start HTTP server
    const server = app.listen(config.port, () => {
      Logger.info(`HTTP server listening on port ${config.port}`);
    });

    // Connect to RabbitMQ
    await rabbitMQ.connect({
      uri: process.env.RABBITMQ_URI || "amqp://localhost",
      heartbeat: 60,
      topology: rabbitMQConfig.topology,
    });

    // Graceful shutdown handler
    const shutdown = async (signal) => {
      Logger.info(`${signal} received - shutting down`);
      try {
        // Close HTTP server
        await new Promise((resolve) => server.close(resolve));

        // Close MongoDB connection
        await mongoose.connection.close();

        // Close RabbitMQ connection
        await rabbitMQ.close();

        Logger.info("All connections closed");
        process.exit(0);
      } catch (error) {
        Logger.error("Error during shutdown", { error: error });
        process.exit(1);
      }
    };

    // Process signal handlers
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    // Uncaught exception handlers
    process.on("uncaughtException", (error) => {
      Logger.error("Uncaught Exception", { error: error });
      shutdown("uncaughtException");
    });

    process.on("unhandledRejection", (reason, promise) => {
      Logger.error("Unhandled Rejection", { promise, reason });
      shutdown("unhandledRejection");
    });
  } catch (error) {
    console.log("🚀 ~ bootstrap ~ error:", error);
    Logger.error("Bootstrap failed", { error: error });
    process.exit(1);
  }
};

// Start the service
bootstrap();
