module.exports = {
  uri: process.env.RABBITMQ_URI || "amqp://localhost",
  // topology: {
  //   exchanges: require("./rabbitmq/exchanges"),
  //   queues: require("./rabbitmq/queues"),
  // },
};
