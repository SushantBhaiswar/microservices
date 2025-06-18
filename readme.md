My Microservice Application
This repository contains a foundational microservice architecture designed for scalability, resilience, and maintainability. It demonstrates best practices for inter-service communication (HTTP, gRPC, Message Queues), data persistence (PostgreSQL, MongoDB), and API Gateway functionalities.

Architecture Overview
The application is composed of several independent microservice:

API Gateway: The single entry point for all client requests. It handles routing, authentication, rate limiting, circuit breaking, and caching.

User Service: Manages user registration, authentication, and profile data. Uses PostgreSQL for data storage.

Notification Service: Handles sending various types of notifications (email, SMS, push). It uses RabbitMQ for asynchronous processing and exposes a gRPC endpoint for internal service communication.

Logging Service: Centralized service for ingesting and storing application logs from all other service. Uses MongoDB for log storage.

Communication Patterns
Client to API Gateway: HTTP/REST

API Gateway to Backend service: HTTP/REST (proxied)

Internal Service-to-Service (e.g., User Service to Notification Service): gRPC for synchronous, high-performance calls.

Asynchronous Tasks (e.g., Notification Service sending emails): RabbitMQ for reliable message queuing.

Technologies Used
Backend: Node.js (Express.js)

Databases: PostgreSQL (User Service), MongoDB (Logging Service)

Message Broker: RabbitMQ

RPC Framework: gRPC

Containerization: Docker, Docker Compose

Logging: Winston

Authentication: JWT

Resilience: Circuit Breakers (Opossum), Rate Limiting (Express Rate Limit)

Caching: Node-Cache (can be swapped for Redis)

Getting Started
Follow the instructions in the Full Microservice Project Setup immersive artifact to set up and run the application locally.

Development
Each microservice and shared library has its own README.md with specific development instructions, API endpoints, and testing guidelines.

Testing
Comprehensive unit and integration tests are provided for each service. Refer to individual service README.md files for details.

Deployment
This setup is designed for local development. For production deployment, consider using Kubernetes or similar orchestration platforms, along with robust CI/CD pipelines.

Contributing
Contributions are welcome! Please refer to the individual service READMEs for specific guidelines.

# Multi-stage Dockerfile for Node.js microservice

FROM node:18-alpine AS base

# Install security updates and dependencies

RUN apk update && apk upgrade && \
 apk add --no-cache dumb-init curl && \
 rm -rf /var/cache/apk/\*

# Create app directory

WORKDIR /usr/src/app

# Create non-root user

RUN addgroup -g 1001 -S nodejs && \
 adduser -S nodeuser -u 1001

# Development stage

FROM base AS development
ENV NODE_ENV=development

# Copy package files

COPY package*.json ./
COPY libs/package*.json ./libs/

# Install all dependencies (including dev)

RUN npm ci --include=dev

# Copy source code

COPY . .

USER nodeuser
EXPOSE 3000

CMD ["dumb-init", "node", "src/app.js"]

# Production dependencies stage

FROM base AS deps
ENV NODE_ENV=production

# Copy package files

COPY package*.json ./
COPY libs/package*.json ./libs/

# Install only production dependencies

RUN npm ci --only=production && npm cache clean --force

# Production stage

FROM base AS production
ENV NODE_ENV=production

# Copy production dependencies

COPY --from=deps --chown=nodeuser:nodejs /usr/src/app/node_modules ./node_modules
COPY --from=deps --chown=nodeuser:nodejs /usr/src/app/libs/node_modules ./libs/node_modules

# Copy application code

COPY --chown=nodeuser:nodejs . .

# Remove unnecessary files

RUN rm -rf .git .gitignore README.md _.md tests/ docs/ && \
 find . -name "_.test.js" -delete && \
 find . -name "\*.spec.js" -delete

USER nodeuser

# Health check

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
 CMD curl -f http://localhost:${PORT:-3000}/health || exit 1

EXPOSE 3000

CMD ["dumb-init", "node", "src/app.js"]






// index.js as per the service framework
const ServiceFramework = require("/usr/src/libs");
const rabbitMQ = require("./rabbitMQ");
const { initializeFramework } = require("./app");
const schema = require("./models");
const config = require("./config/config");

// Initialize service framework
const appInstance = new ServiceFramework({
  port: config.port || 3002,
  serviceName: config.serviceName,
});

initializeFramework(appInstance);

(async () => {
  try {
    // Connect to RabbitMQ and configure topology
    await appInstance.connectRabbitMQ(rabbitMQ);

    // Connect to databases
    await appInstance.connectDatabase(
      config.mongoose.DATABASE,
      schema.dbConfig,
      schema.models
    );

    // Start message consumers
    await appInstance.startConsumers(rabbitMQ.consumers);

    // routes
    appInstance.route("/logs/v1/login", (req, res) => {
      res.sendJSONResponse({
        code: 200,
        message: "login successfully",
      });
    });

    // Start HTTP server
    appInstance.start();

    // Graceful shutdown
    process.on("SIGTERM", async () => {
      appInstance.logger.info("SIGTERM received - shutting down");
      await appInstance.close();
      process.exit(0);
    });
  } catch (error) {
    appInstance.logger.error(error);
    process.exit(1);
  }
})();

module.exports = {
  app: appInstance.app,
  rabbitMQ: appInstance.rabbitMQ,
};

app.js
let frameworkInstance = null;

const initializeFramework = (appInstance) => {
  if (frameworkInstance) {
    throw new Error("Framework already initialized");
  }
  frameworkInstance = appInstance;
};

const getFramework = () => {
  if (!frameworkInstance) {
    throw new Error(
      "Framework not initialized. Call initializeFramework first."
    );
  }
  return frameworkInstance;
};

const getLogger = () => getFramework().logger;
const getDatabase = () => getFramework().database;
const getMessaging = () => getFramework().rabbitMQManager;
module.exports = {
  initializeFramework,
  getFramework,
  getLogger,
  getDatabase,
  getMessaging,
};
