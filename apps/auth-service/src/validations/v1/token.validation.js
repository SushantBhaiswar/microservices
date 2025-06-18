const Joi = require("joi");
// const { password, objectId } = require("./custom.validation");
const loginUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required(),
  }),
};

const logoutUser = {
  body: Joi.object().keys({
    refreshToken: Joi.string().required(),
  }),
};

const registerUser = {
  body: Joi.object().keys({
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8),
  }),
};

module.exports = {
  loginUser,
  logoutUser,
  registerUser,
};
