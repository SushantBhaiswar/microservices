const errorHandler = async (err, req, res, next) => {
  let { statusCode, message } = err;

  res.locals.errorMessage = err.message;

  const response = {
    code: statusCode,
    message,
    ...(config.env === "development" && { stack: err.stack }),
  };

  if (statusCode == 500) response.message = "Internal Server Error!";
  logger.error(err);
  res.sendJSONResponse({
    code: statusCode,
    status: false,
    message: message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
};

module.exports = errorHandler;
