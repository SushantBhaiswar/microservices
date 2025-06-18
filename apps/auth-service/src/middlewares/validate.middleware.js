/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable eqeqeq */
const Joi = require("joi");
const httpStatus = require("http-status");
const pick = require("../utils/pick");
const { ApiError } = require("@shared/libs");

const validate = (schema) => async (req, res, next) => {
  const validSchema = pick(schema, ["params", "query", "body"]);
  const object = pick(req, Object.keys(validSchema));
  const { value, error } = Joi.compile(validSchema)
    .prefs({ errors: { label: "key" }, abortEarly: false })
    .validate(object);

  if (error) {
    let errorMessage = error.details[0].message;
    if (!errorMessage && error.details?.length != 0) {
      errorMessage = `Invalid input type provided for ${
        error?.details[0]?.context?.label || error?.details[0]?.context?.value
      }. Please check and try again.`;
    }
    return next(new ApiError(httpStatus.BAD_REQUEST, errorMessage));
  }

  Object.assign(req, value);
  return next();
};

module.exports = validate;
