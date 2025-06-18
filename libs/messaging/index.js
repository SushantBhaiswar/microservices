const amqp = require("amqplib");
const Logger = require("../logger/index");

class RabbitMQManager {
  constructor() {
    this.connection = null;
    this.channels = new Map();
    this.topologyConfigured = false;
  }

  async connect(config) {
    try {
      this.connection = await amqp.connect(config.uri, {
        heartbeat: config.heartbeat || 60,
        ...config.options,
      });

      this.connection.on("error", (err) => {
        Logger.error("RabbitMQ connection error", { error: err.message });
        this.isConnected = false;
        this.handleReconnection(config);
      });

      this.connection.on("close", () => {
        Logger.warn("RabbitMQ connection closed");
        this.isConnected = false;
        this.topologyConfigured = false;
        this.channels.clear();
        this.handleReconnection(config);
      });

      this.isConnected = true;
      this.reconnectAttempts = 0;
      Logger.info("RabbitMQ connected successfully");

      // Configure topology immediately after connection
      if (config.topology) {
        await this.configureTopology(config.topology);
      }

      return this.connection;
    } catch (error) {
      Logger.error("Failed to connect to RabbitMQ", { error: error.message });
      this.isConnected = false;
      throw error;
    }
  }

  async handleReconnection(config) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      Logger.error("Max reconnection attempts reached. Giving up.");
      return;
    }

    this.reconnectAttempts++;
    Logger.info(
      `Attempting to reconnect to RabbitMQ (${this.reconnectAttempts}/${this.maxReconnectAttempts})`
    );

    setTimeout(async () => {
      try {
        await this.connect(config);
      } catch (error) {
        Logger.error("Reconnection failed", { error: error.message });
      }
    }, this.reconnectDelay);
  }

  async createChannel(channelName = "default") {
    try {
      if (!this.connection)
        throw new Error("RabbitMQ connection not established");

      const channel = await this.connection.createChannel();
      //await channel.prefetch(config.prefetch || 10);

      channel.on("error", (err) => {
        Logger.error(`RabbitMQ channel error: ${channelName}`, {
          error: err.message,
        });
        this.channels.delete(channelName);
      });

      channel.on("close", () => {
        Logger.warn(`RabbitMQ channel closed: ${channelName}`);
        this.channels.delete(channelName);
      });

      this.channels.set(channelName, channel);
      Logger.info(`RabbitMQ channel created: ${channelName}`);
      return channel;
    } catch (error) {
      Logger.error(`Failed to create RabbitMQ channel: ${channelName}`, {
        error: error.message,
      });
      throw error;
    }
  }

  async configureTopology(topology) {
    if (this.topologyConfigured) {
      Logger.info("RabbitMQ topology already configured, skipping...");
      return;
    }

    try {
      const channel = await this.getOrCreateChannel();

      // Declare exchanges
      for (const exchange in topology.exchanges) {
        await channel.assertExchange(
          exchange,
          topology.exchanges[exchange]["type"] || "direct",
          topology.exchanges[exchange]["options"] || { durable: true }
        );
        Logger.info(`Exchange declared: ${exchange}`);
      }

      // Declare queues and bindings
      for (const queue in topology.queues) {
        await channel.assertQueue(queue, queue.options || { durable: true });
        Logger.info(`Queue declared: ${queue}`);

        // Bind to exchanges
        for (const binding of topology.queues[queue].bindings || []) {
          await channel.bindQueue(
            queue,
            binding.exchange,
            binding.routingKey || "",
            binding.args || {}
          );
          Logger.info(
            `Queue bound: ${queue} -> ${binding.exchange} [${binding.routingKey}]`
          );
        }
      }

      this.topologyConfigured = true;
      Logger.info("RabbitMQ topology configured successfully");
    } catch (error) {
      Logger.error("Failed to configure RabbitMQ topology", {
        error: error.message,
      });
      throw error;
    }
  }

  async getOrCreateChannel(channelName = "default") {
    if (this.channels.has(channelName)) {
      return this.channels.get(channelName);
    }
    return this.createChannel(channelName);
  }

  async publish(exchange, routingKey, message, options = {}) {
    try {
      const channel = await this.getOrCreateChannel();
      const messageBuffer = Buffer.from(JSON.stringify(message));

      return channel.publish(exchange, routingKey, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
        headers: { "x-service": this.serviceName },
        ...options,
      });
    } catch (error) {
      Logger.error("Failed to publish message", {
        exchange,
        routingKey,
        error: error,
      });
      throw error;
    }
  }

  async consume(queueName, handler, options = {}) {
    try {
      const channel = await this.getOrCreateChannel();

      await channel.consume(
        queueName,
        async (msg) => {
          if (!msg) return;

          try {
            const content = JSON.parse(msg.content.toString());
            await handler(content, msg);
            channel.ack(msg);
          } catch (error) {
            Logger.error("Message processing failed", error);

            if (options.deadLetterExchange) {
              channel.publish(
                options.deadLetterExchange,
                queueName + ".error",
                msg.content,
                { headers: msg.properties.headers }
              );
              channel.ack(msg);
            } else {
              channel.nack(msg, false, options.requeue !== false);
            }
          }
        },
        {
          noAck: false,
          ...options.consumerOptions,
        }
      );

      Logger.info(`Consumer started for queue: ${queueName}`);
    } catch (error) {
      Logger.error(`Failed to start consumer for queue: ${queueName}`, {
        error: error.message,
      });
      throw error;
    }
  }

  async startConsumers(consumers) {
    for (const consumer in consumers) {
      await this.consume(
        consumers[consumer].queue,
        consumers[consumer].handler,
        consumers[consumer].options
      );
    }
  }

  async close() {
    try {
      // Close all channels
      for (const [name, channel] of this.channels) {
        await channel.close();
        Logger.info(`Channel closed: ${name}`);
      }

      // Close connection
      if (this.connection) {
        await this.connection.close();
        Logger.info("RabbitMQ connection closed");
      }

      this.channels.clear();
    } catch (error) {
      Logger.error("Error closing RabbitMQ connections", {
        error: error.message,
      });
    }
  }
}

module.exports = new RabbitMQManager();
