process.env.SERVICE_NAME = process.env.SERVICE_NAME || "auth-service";
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const httpStatus = require("http-status");
const routes = require("./routes");
const { ErrorHandler, RequestLogger, ApiError, ErrorConverter } = require("/usr/src/libs");

const app = express();

app.set("trust proxy", 1);

// Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "trusted.cdn.com"],
    },
  },
  xssFilter: true,
}));

app.use(express.json());
app.use(cors());
app.use(RequestLogger);

// API routes
app.use("/v1", routes);

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// Error converters/handlers
app.use(ErrorConverter);
app.use(ErrorHandler);

// Utility response method
app.response.sendJSONResponse = function ({
  code = 500,
  status = true,
  message,
  data,
  isShowMessage = true,
}) {
  return this.status(Number(code)).json({
    code,
    status,
    message,
    isShowMessage,
    data,
  });
};

module.exports = app;
