module.exports = {
  "log.request.exc": {
    type: "direct",
    options: {
      durable: true,
      autoDelete: false,
    },
  },
  //   "payments.topic": {
  //     type: "topic",
  //     options: {
  //       durable: true,
  //       autoDelete: false,
  //     },
  //   },
  //   "payments.dlx": {
  //     type: "direct",
  //     options: {
  //       durable: true,
  //       autoDelete: false,
  //     },
  //   },
};
