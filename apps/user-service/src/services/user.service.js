const getUserRepository = require("../repositories/users.repositories");
const ApiError = require("../utils/ApiError");
const userRepository = new getUserRepository();
const { ErrorMessages } = require("@shared/libs");

const createUser = async (req) => {
  const userData = req.body;

  let user = await userRepository.findByEmail(userData.email);

  if (user) {
    throw new ApiError(400, ErrorMessages.EMAIL_EXIST);
  }

  return await userRepository.insertUser(userData);
};

const fetchUserDetails = async (req) => {
  const userData = req.body;

  let user = await userRepository.findByEmail(userData.email);

  return user;
};

const validateEmailPassword = async (req) => {
  const userData = req.body;
  const user = await userRepository.validatePassword(
    userData.email,
    userData.password
  );
  if (!user) {
    throw new ApiError(400, ErrorMessages.INVALID_PASSWORD);
  }

  return user;
};

module.exports = {
  createUser,
  fetchUserDetails,
  validateEmailPassword,
};
