process.env.SERVICE_NAME = process.env.SERVICE_NAME || "api-gateway";
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const httpStatus = require("http-status");
const routes = require("./routes");
const { ErrorHandler, RequestLogger, ApiError, ErrorConverter } = require("/usr/src/libs");
const { jwtStrategy } = require('./config/passport.js');
const passport = require('passport');
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
app.use("/api", routes);

// jwt authentication
app.use(passport.initialize());

// select strategy;
app.use((req, res, next) => {
  passport.use('jwt', jwtStrategy);
  next();
});

// 404 handler
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Route Not found"));
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