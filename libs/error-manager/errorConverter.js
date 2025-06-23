const ApiError = require("./apiError");
const httpStatus = require("http-status");
const mongoose = require("mongoose");

const errorConverter = (err, req, res, next) => {
  let error = err;
  if (!(error instanceof ApiError)) {
    const statusCode =
      error.statusCode || error instanceof mongoose.Error ? 400 : 500;
    const errorKey = error.errorKey || error.message || "INTERNAL_SERVER_ERROR";
    error = new ApiError(statusCode, errorKey, false, err.stack);
  }
  next(error);
};

module.exports = errorConverter;
