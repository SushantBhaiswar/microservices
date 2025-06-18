const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const httpStatus = require("http-status");
const routes = require("./routes");
const app = express();

const http = require("http");
const {
  ErrorHandler,
  RequestLogger,
  ApiError,
  ErrorConverter,
} = require("@shared/libs");

// Create an HTTP server
let server = http.createServer(app);

app.set("trust proxy", 1);

// Security headers with Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "trusted.cdn.com"],
      },
    },
    xssFilter: true,
  })
);

// parse json request body
app.use(express.json());

// request logger
app.use(RequestLogger);

// parse urlencoded request body
// app.use(express.urlencoded({ extended: true }));

// app.use("/assets", express.static("public"));

// sanitize request data
// app.use(mongoSanitize());
// app.use(bodyParser.text({ type: "text/plain", limit: "50mb" }));

// // gzip compression
// app.use(compression());

// enable cors
app.use(cors());
// app.options("*", cors());

// v1 api routes
app.use("/v1", routes);

// send back a 404 error for any unknown api request
app.use((req, res, next) => {
  next(new ApiError(httpStatus.NOT_FOUND, "Not found"));
});

// convert error to ApiError
app.use(ErrorConverter);

// handle error
app.use(ErrorHandler);

/**
 *
 * @param {httpStatus} code
 * @param {Boolean} status
 * @param {String} message
 * @param {Object} data
 */
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

module.exports = { app, server };
