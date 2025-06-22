const jwt = require("jsonwebtoken");
const moment = require("moment");
const httpStatus = require("http-status");
const config = require("../config/config");
const { DBEnums, ApiError } = require("/usr/src/libs");
const TokenTypes = DBEnums.TokenModel.TokenTypes;
const getTokenRepository = require("../repositories/token.repositories");
const TokenRepository = new getTokenRepository();

/**
 * Generate token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {string} [secret]
 * @returns {string}
 */
const generateToken = (userId, expires, type, secret = config.jwt.secret) => {
  const payload = {
    sub: userId,
    iat: moment().unix(),
    exp: expires.unix(),
    type,
  };
  return jwt.sign(payload, secret);
};

/**
 * Save a token
 * @param {string} token
 * @param {ObjectId} userId
 * @param {Moment} expires
 * @param {string} type
 * @param {boolean} [blacklisted]
 * @returns {Promise<Token>}
 */
const saveToken = async (
  token,
  userId,
  expires,
  type,
  deviceId,
  blacklisted = false
) => {
  const tokenDoc = await TokenRepository.insertToken({
    token,
    user: userId,
    deviceId,
    expires: expires.toDate(),
    type,
    blacklisted,
  });
  return tokenDoc;
};

/**
 * Verify token and return token doc (or throw an error if it is not valid)
 * @param {string} token
 * @param {string} type
 * @returns {Promise<Token>}
 */

const verifyToken = (token, type) => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.jwt.secret, async (err, payload) => {
      if (err) {
        // Handle JWT expiration or other errors
        if (err.name === "TokenExpiredError") {
          reject(
            new ApiError(
              httpStatus.BAD_REQUEST,
              "The password reset link has timed out. Please return to the login page and try resetting your password again to generate a new link"
            )
          );
        } else {
          reject(new ApiError(httpStatus.UNAUTHORIZED, "Invalid token"));
        }
      } else {
        // If verification is successful, proceed to find the token document
        try {
          const tokenDoc = await TokenRepository.findToken({
            token,
            type,
            user: payload.sub,
            blacklisted: false,
          });
          if (!tokenDoc) {
            reject(
              new ApiError(
                httpStatus.BAD_REQUEST,
                "The password reset link has timed out. Please return to the login page and try resetting your password again to generate a new link"
              )
            );
          } else {
            resolve(tokenDoc);
          }
        } catch (dbError) {
          reject(
            new ApiError(
              httpStatus.INTERNAL_SERVER_ERROR,
              "Internal server error"
            )
          );
        }
      }
    });
  });
};

/**
 * Generate auth tokens
 * @param {User} user
 * @returns {Promise<Object>}
 */
const generateAuthTokens = async (user, generated) => {
  const accessTokenExpires = moment().add(
    config.jwt.accessExpirationMinutes,
    "minutes"
  );
  const accessToken = generateToken(
    user._id,
    accessTokenExpires,
    TokenTypes.Access
  );

  const refreshTokenExpires = moment().add(
    config.jwt.refreshExpirationDays,
    "days"
  );
  let refreshToken;
  if (generated) {
    refreshToken = await generateToken(
      user._id,
      refreshTokenExpires,
      TokenTypes.Refresh
    );
    await saveToken(
      refreshToken,
      user._id,
      refreshTokenExpires,
      TokenTypes.Refresh
    );
  }
  return {
    access: {
      token: accessToken,
      expires: accessTokenExpires.toDate(),
    },
    refresh: {
      token: refreshToken || false,
      expires: refreshTokenExpires.toDate(),
    },
  };
};

/**
 * Generate reset password token
 * @param {string} email
 * @returns {Promise<string>}
 */
// const generateResetPasswordToken = async (req) => {
//   const { email } = req.body;
//   const user = await userService.getUserByEmail(email);
//   await validateCondition("SBWA11", !user);
//   if (
//     user.lastVerificationCodeSentAt &&
//     checkDateExpired(user.lastVerificationCodeSentAt)
//   ) {
//     await User.updateOne(
//       { email },
//       {
//         $set: { verificationCodeCount: 0 },
//         lastVerificationCodeSentAt: new Date(),
//       }
//     );
//     user.verificationCodeCount = 0;
//   }
//   await validateCondition("SBWA12", user.bounceCount >= 3, { EMAIL: email });
//   await validateCondition("SBWA13", user.verificationCodeCount >= 5);

//   const expires = moment().add(
//     config.jwt.resetPasswordExpirationMinutes,
//     "minutes"
//   );
//   const resetPasswordToken = generateToken(
//     user._id,
//     expires,
//     TokenTypes.RESET_PASSWORD
//   );
//   await saveToken(
//     resetPasswordToken,
//     user._id,
//     expires,
//     TokenTypes.RESET_PASSWORD
//   );
//   // log activity for logging purpose
//   const logDetails = {
//     action: "AUD78@TJ",
//     actionType: "Account",
//     actionedBy: user._id,
//   };

//   await audit_logger(null, req, logDetails);

//   return {
//     resetPasswordToken,
//     user,
//     userDetails: user.userDetails,
//     jobCategory: user?.userPrefrences?.jobCategory,
//   };
// };

/**
 * Generate verify email token
 * @param {User} user
 * @returns {Promise<string>}
 */
// const generateVerifyEmailToken = async (user) => {
//   const expires = moment().add(
//     config.jwt.verifyEmailExpirationMinutes,
//     "minutes"
//   );
//   const verifyEmailToken = generateToken(
//     user._id,
//     expires,
//     TokenTypes.VERIFY_EMAIL
//   );
//   await saveToken(verifyEmailToken, user._id, expires, TokenTypes.VERIFY_EMAIL);
//   return verifyEmailToken;
// };

module.exports = {
  generateToken,
  saveToken,
  verifyToken,
  generateAuthTokens,
  //   generateResetPasswordToken,
  //   generateVerifyEmailToken,
};
