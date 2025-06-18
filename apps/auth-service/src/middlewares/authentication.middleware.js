/* eslint-disable array-callback-return */
/* eslint-disable guard-for-in */
/* eslint-disable no-restricted-syntax */
/* eslint-disable eqeqeq */
const passport = require("passport");
const httpStatus = require("http-status");
const ApiError = require("../utils/ApiError");
const config = require("../config/config");
const crypto = require("crypto");

const verifyServiceToken = (token) => {
  try {
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const [timestamp, nonce, signature] = decoded.split(":");
    const data = `${timestamp}:${nonce}`;

    // Verify timestamp freshness
    const age = Date.now() - Number(timestamp);
    if (age > config.service_token_validity * 1000) {
      return { valid: false, reason: "Token expired" };
    }

    // Verify HMAC signature
    const hmac = crypto.createHmac("sha256", config.service_token_secret);
    hmac.update(data);
    const expectedSignature = hmac.digest("hex");
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    return {
      valid: isValid,
      reason: isValid ? "Valid token" : "Invalid signature",
    };
  } catch (error) {
    return { valid: false, reason: "Invalid token format" };
  }
};
const verifyCallback =
  (req, resolve, reject, requiredRights, permissions) =>
  async (err, user, info) => {
    if (err || info || !user) {
      return reject(
        new ApiError(httpStatus.UNAUTHORIZED, "Please authenticate")
      );
    }

    req.user = user;

    resolve();
  };

const auth =
  (requiredRights, permissions, subPermission) => async (req, res, next) => {
    const authHeader = req.headers["x-service-token"];
    const serviceTokenInfo = verifyServiceToken(authHeader);

    if (serviceTokenInfo.valid) {
      req.user = { id: "service", role: "service" };
      return next();
    }

    return new Promise((resolve, reject) => {
      passport.authenticate(
        "jwt",
        { session: false },
        verifyCallback(
          req,
          resolve,
          reject,
          requiredRights,
          permissions,
          subPermission
        )
      )(req, res, next);
    })
      .then(() => next())
      .catch((err) => {
        return next(err);
      });
  };

module.exports = auth;
