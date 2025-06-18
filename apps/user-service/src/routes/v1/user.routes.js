const express = require("express");
const UserController = require("../../controllers/user.controller");
const { ValidateMiddleware, AuthMiddleware } = require("../../middlewares");
const { UserValidation } = require("../../validations/v1");
const router = express.Router();

router
  .route("/create")
  .post(
    ValidateMiddleware(UserValidation.createUser),
    UserController.createUsers
  );
router
  .route("/validate-login")
  .post(
    ValidateMiddleware(UserValidation.validateLogin),
    UserController.validateLogin
  );

router.route("/fetch-user").post(
  // ValidateMiddleware(UserValidation.createUser),
  AuthMiddleware(),
  UserController.fetchUser
);

module.exports = router;
