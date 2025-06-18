const mongoose = require("mongoose");
const logger = require("../logger");
const ApiError = require("../error-handler/apiError");
const MongoDBBaseRepository = require("../db-clients/src/mongodb");
class DatabaseManager {
  constructor() {
    this.connections = new Map();
    this.models = new Map();
    this.connectionStrategies = new Map();
    this.registerStrategies();
  }

  registerStrategies() {
    // MongoDB Strategy
    this.connectionStrategies.set("mongodb", {
      connect: async (config) => {
        const options = {
          maxPoolSize: config.maxPoolSize || 10,
          serverSelectionTimeoutMS: config.serverSelectionTimeoutMS || 5000,
          socketTimeoutMS: config.socketTimeoutMS || 45000,
          retryWrites: true,
          ...config.options,
        };

        const connection = await mongoose.createConnection(config.uri, options);

        connection.on("connected", () => {
          logger.info(`MongoDB connected: ${config.name}`, {
            database: config.name,
          });
        });

        connection.on("error", (err) => {
          logger.error(`MongoDB connection error: ${config.name}`, err);
        });

        connection.on("disconnected", () => {
          logger.warn(`MongoDB disconnected: ${config.name}`, {
            database: config.name,
          });
        });

        return connection;
      },
      disconnect: async (connection) => {
        await connection.close();
      },
    });
  }

  async initialize(connectionName, dbConfigs, modelDefinitions = []) {
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize(
      connectionName,
      dbConfigs,
      modelDefinitions
    );
    return this.initializationPromise;
  }

  async _doInitialize(connectionName, dbConfigs, modelDefinitions) {
    try {
      // Ensure dbConfigs is an array
      if (!Array.isArray(dbConfigs)) {
        dbConfigs = [dbConfigs];
      }

      // Connect to all databases
      const connectionPromises = dbConfigs.map((config) =>
        this.connect(config)
      );
      await Promise.all(connectionPromises);

      // Register all models
      for (const modelDef of modelDefinitions) {
        for (const modelInfo in modelDef) {
          this.registerModel(
            connectionName,
            modelDef[modelInfo].options.collection,
            modelDef[modelInfo].schema,
            modelDef[modelInfo].options
          );
        }
      }

      this.isInitialized = true;
      logger.info("Database manager initialized successfully");
    } catch (error) {
      this.initializationPromise = null;
      throw error;
    }
  }

  registerModel(connectionName, modelName, schema, options = {}) {
    const connection = this.getConnection(connectionName);
    const model = connection.model(modelName, schema, options.collection);

    if (!this.models.has(connectionName)) {
      this.models.set(connectionName, new Map());
    }

    this.models.get(connectionName).set(modelName, model);

    logger.info(
      `Model registered: ${modelName} on connection: ${connectionName}`
    );
    return model;
  }

  async connect(dbConfig) {
    try {
      const strategy = this.connectionStrategies.get(dbConfig.type);
      if (!strategy) {
        throw new Error(`Unsupported database type: ${dbConfig.type}`);
      }

      const connection = await strategy.connect(dbConfig);
      this.connections.set(dbConfig.name, {
        connection,
        strategy,
        config: dbConfig,
      });

      logger.info(`Database connection established: ${dbConfig.name}`, {
        type: dbConfig.type,
        name: dbConfig.name,
      });

      return connection;
    } catch (error) {
      logger.error(`Failed to connect to database: ${dbConfig.name}`, error);
      throw error;
    }
  }

  getConnection(name = "default") {
    const connectionInfo = this.connections.get(name);

    if (!connectionInfo) {
      throw new Error(`Database connection not found: ${name}`);
    }
    return connectionInfo.connection;
  }

  async disconnectAll() {
    const disconnectPromises = Array.from(this.connections.entries()).map(
      async ([name, { connection, strategy }]) => {
        try {
          await strategy.disconnect(connection);
          logger.info(`Database disconnected: ${name}`);
        } catch (error) {
          logger.error(`Error disconnecting database: ${name}`, {
            error: error.message,
          });
        }
      }
    );

    await Promise.all(disconnectPromises);
    this.connections.clear();
  }

  getModel(connectionName, modelName) {
    const connectionModels = this.models.get(connectionName);
    if (!connectionModels) {
      throw new Error(`No models found for connection: ${connectionName}`);
    }

    const model = connectionModels.get(modelName);
    if (!model) {
      throw new Error(
        `Model not found: ${modelName} on connection: ${connectionName}`
      );
    }

    return model;
  }

  addStrategy(type, strategy) {
    this.connectionStrategies.set(type, strategy);
  }
  get mongodbRepo() {
    return MongoDBBaseRepository;
  }
}

module.exports = new DatabaseManager();
