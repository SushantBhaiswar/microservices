const { AuthService } = require("../services");
const { ResponseMessages, CatchAsync } = require("@shared/libs");

const login = CatchAsync(async (req, res) => {
  const response = await AuthService.loginUser(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.LOGGED_IN,
    data: response,
  });
});

const logout = CatchAsync(async (req, res) => {
  const response = await AuthService.logoutUser(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.LOGGED_OUT,
    data: response,
  });
});

const register = CatchAsync(async (req, res) => {
  const response = await AuthService.registerUser(req);

  res.sendJSONResponse({
    status: true,
    code: 200,
    message: ResponseMessages.USER_CREATED,
    data: response,
  });
});

module.exports = {
  login,
  register,
  logout,
};
