module.exports = {
  uri: process.env.RABBITMQ_URI || "amqp://rabbitmq",
  topology: {
    exchanges: require("./exchanges"),
    queues: require("./queues"),
  },
  consumers: require("./consumers"),
};
