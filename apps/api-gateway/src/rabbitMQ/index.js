module.exports = {
  uri:  "amqp://rabbitmq",
  topology: {
    exchanges: require("./exchanges"),
    queues: require("./queues"),
  },
  //consumers: require("./consumers"),
};
