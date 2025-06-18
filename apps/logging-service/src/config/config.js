const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

let envFile = ".env";
if (process.env.NODE_ENV === "development") {
  envFile = ".env.dev";
} else if (process.env.NODE_ENV === "qa") {
  envFile = "qa.env";
} else if (process.env.NODE_ENV === "staging") {
  envFile = "staging.env";
} else if (process.env.NODE_ENV === "production") {
  envFile = "production.env";
}

dotenv.config({ path: path.join(__dirname, `../../${envFile}`) });

const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string()
      .valid("production", "development", "test", "staging", "qa")
      .required(),
    PORT: Joi.number().default(3000),
    SERVICE_NAME: Joi.string()
      .required()
      .description("Service name is required"),
    DATABASE: Joi.string().required().description("DB name is required"),
    MONGODB_URL: Joi.string().required().description("Mongo DB url"),
    // JWT_SECRET: Joi.string().required().description("JWT secret key"),
    // JWT_ACCESS_EXPIRATION_MINUTES: Joi.number()
    //   .default(30)
    //   .description("minutes after which access tokens expire"),
    // JWT_REFRESH_EXPIRATION_DAYS: Joi.number()
    //   .default(30)
    //   .description("days after which refresh tokens expire"),
    // JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
    //   .default(10)
    //   .description("minutes after which reset password token expires"),
    // JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
    //   .default(10)
    //   .description("minutes after which verify email token expires"),
    // SMTP_HOST: Joi.string().description("server that will send the emails"),
    // SMTP_PORT: Joi.number().description("port to connect to the email server"),
    // SMTP_USERNAME: Joi.string().description("username for email server"),
    // SMTP_PASSWORD: Joi.string().description("password for email server"),
    // EMAIL_FROM: Joi.string().description(
    //   "the from field in the emails sent by the app"
    // ),
    // SENDMAIL: Joi.boolean().description("options for send mail"),
    // FORGOTPASSWORD_URL: Joi.string().description("url for forgot password"),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema
  .prefs({ errors: { label: "key" } })
  .validate(process.env);

if (error) {
  throw new Error(`Config validation error: ${error.message}`);
}

module.exports = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  serviceName: envVars.SERVICE_NAME,
  mongoose: {
    DATABASE: envVars.DATABASE,
    URL: envVars.MONGODB_URL + (envVars.NODE_ENV === "test" ? "-test" : ""),
    OPTIONS: {},
  },

  jwt: {
    secret: envVars.JWT_SECRET,
    accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
    refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
    resetPasswordExpirationMinutes:
      envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
    verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  },
  email: {
    smtp: {
      host: envVars.SMTP_HOST,
      port: envVars.SMTP_PORT,
      auth: {
        user: envVars.SMTP_USERNAME,
        pass: envVars.SMTP_PASSWORD,
      },
    },
    from: envVars.EMAIL_FROM,
  },
  firebase: {
    client_email: envVars.FIREBASE_CLIENT_EMAIL,
    private_key: envVars.FIREBASE_PRIVATE_KEY,
    project_id: envVars.FIREBASE_PROJECT_ID,
  },
};
