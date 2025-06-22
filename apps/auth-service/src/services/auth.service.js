const apiEndPoints = require("../config/api-endPoints");
const {
  ClientErrMessages,
  ApiError,
  ServicesNames,
  Communicate,
} = require("/usr/src/libs");
const tokenService = require("./token.service");
const getTokenRepository = require("../repositories/token.repositories");
const TokenRepository = new getTokenRepository();

const loginUser = async (req) => {
  const user = await Communicate(
    ServicesNames["user-service"],
    apiEndPoints["VALIDATE_LOGIN"],
    req.body
  );

  if (!user.status) {
    throw new ApiError("400", user.message);
  }

  if (!user.data) {
    throw new ApiError("400", "Invalid credentials");
  }

  const tokens = await tokenService.generateAuthTokens(user.data, true);

  return { user: user.data, tokens };
};

const logoutUser = async (req) => {
  const refreshTokenDoc = await TokenRepository.findToken({
    token: req.body.refreshToken,
    type: "Refresh",
    blacklisted: false,
  });

  if (refreshTokenDoc) {
    await TokenRepository.deleteToken({
      token: req.body.refreshToken,
      type: "Refresh",
      blacklisted: false,
    });
  }
};

const registerUser = async (req) => {
  const user = await Communicate(
    ServicesNames["user-service"],
    apiEndPoints["GET_USER"],
    {
      email: req.body.email,
    }
  );

  if (user.data) {
    throw new ApiError(409, ClientErrMessages.EMAIL_EXIST);
  }

  const createdUser = await Communicate(
    ServicesNames["user-service"],
    apiEndPoints["CREATE_USER"],
    req.body
  );

  return createdUser.data;
};

module.exports = {
  loginUser,
  registerUser,
  logoutUser,
};
