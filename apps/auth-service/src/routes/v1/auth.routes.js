const express = require("express");
const AuthController = require("../../controllers/auth.controller");
const { ValidateMiddleware } = require("../../middlewares");
const { TokenValidation } = require("../../validations/v1");
const router = express.Router();

router
  .route("/login")
  .post(ValidateMiddleware(TokenValidation.loginUser), AuthController.login);

router
  .route("/logout")
  .post(ValidateMiddleware(TokenValidation.logoutUser), AuthController.logout);

router
  .route("/register")
  .post(
    ValidateMiddleware(TokenValidation.registerUser),
    AuthController.register
  );

module.exports = router;
