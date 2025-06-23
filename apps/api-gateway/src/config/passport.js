/* eslint-disable eqeqeq */
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("./config");
const { DBEnums } = require("/usr/src/libs");
const TokenTypes = DBEnums.TokenModel.getEnums();
const {  Communicate} = require("/usr/src/libs");
const apiEndPoints = require("../config/api-endPoints");

const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};

// strategy for all routes
const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== TokenTypes.ACCESS) {
      throw new Error("Invalid token type");
    }
    const user = await Communicate("user-service", apiEndPoints["GET_USER"], {
      _id: payload.sub,
    });
    console.log(user.data);
    if (!user.data) {
      return done(null, false);
    }
    done(null, user);
  } catch (error) {
    done(error, false);
  }
};

const jwtStrategy = new JwtStrategy(jwtOptions, jwtVerify);

module.exports = {
  jwtStrategy,
};
