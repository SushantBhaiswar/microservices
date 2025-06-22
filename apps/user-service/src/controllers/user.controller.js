const { ResponseMessages, CatchAsync } = require("/usr/src/libs");
const { UserService } = require("../services");

const createUsers = CatchAsync(async (req, res) => {
  const response = await UserService.createUser(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.USER_CREATED,
    data: response,
  });
});

const validateLogin = CatchAsync(async (req, res) => {
  const response = await UserService.validateEmailPassword(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.LOGIN_VALIDATED,
    data: response,
  });
});

const fetchUser = CatchAsync(async (req, res) => {
  const response = await UserService.fetchUserDetails(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.DATA_FETCHED,
    data: response,
  });
});

module.exports = {
  createUsers,
  fetchUser,
  validateLogin,
};
