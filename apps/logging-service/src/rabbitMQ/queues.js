module.exports = {
  "log.request.que": {
    options: {
      durable: true,
    },
    bindings: [{ exchange: "log.request.exc", routingKey: "log" }],
  },
  //   "payment.process": {
  //     options: {
  //       durable: true,
  //       arguments: {
  //         "x-dead-letter-exchange": "payments.dlx",
  //         "x-dead-letter-routing-key": "payment.process.error",
  //       },
  //     },
  //     bindings: [{ exchange: "payments.direct", routingKey: "process" }],
  //   },
  //   "payment.notify": {
  //     options: { durable: true },
  //     bindings: [{ exchange: "payments.topic", routingKey: "notify.#" }],
  //   },
  //   "payment.process.dlq": {
  //     options: { durable: true },
  //     bindings: [
  //       { exchange: "payments.dlx", routingKey: "payment.process.error" },
  //     ],
  //   },
};
