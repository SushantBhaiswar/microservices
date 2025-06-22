module.exports = {
  uri:  "amqp://localhost",
  topology: {
    exchanges: require("./exchanges"),
    queues: require("./queues"),
  },
  consumers: require("./consumers"),
};
