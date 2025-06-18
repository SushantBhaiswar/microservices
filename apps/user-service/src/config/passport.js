/* eslint-disable eqeqeq */
const { Strategy: JwtStrategy, ExtractJwt } = require("passport-jwt");
const config = require("./config");
const getUserRepository = require("../repositories/users.repositories");
const jwtOptions = {
  secretOrKey: config.jwt.secret,
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
};
const userRepository = new getUserRepository();

// strategy for all routes
const jwtVerify = async (payload, done) => {
  try {
    if (payload.type !== "Access") {
      throw new Error("Invalid token type");
    }

    const user = await userRepository.findUser({ _id: payload.sub });
    if (!user) {
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
