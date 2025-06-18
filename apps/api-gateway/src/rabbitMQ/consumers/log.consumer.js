const { LogService } = require("../../service");

module.exports = {
  queue: "log.request.que",
  options: {
    prefetch: 10,
    batch: {
      size: 10,
      timeout: 5000,
    },
  },
  handler: LogService.create_log,
};
