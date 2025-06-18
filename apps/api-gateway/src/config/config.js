const dotenv = require("dotenv");
const path = require("path");
const Joi = require("joi");

// Load environment variables based on NODE_ENV

let envFile = ".env";
if (process.env.NODE_ENV === "development") {
  envFile = ".env.dev";
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
    SERVICE_TOKEN_SECRET: Joi.string(),
    SERVICE_TOKEN_VALIDITY: Joi.string(),
    // MONGODB_URL: Joi.string().required().description('Mongo DB url'),
    // JWT_SECRET: Joi.string().required().description('JWT secret key'),
    // JWT_ACCESS_EXPIRATION_MINUTES: Joi.number().default(30).description('minutes after which access tokens expire'),
    // JWT_REFRESH_EXPIRATION_DAYS: Joi.number().default(30).description('days after which refresh tokens expire'),
    // JWT_RESET_PASSWORD_EXPIRATION_MINUTES: Joi.number()
    //     .default(10)
    //     .description('minutes after which reset password token expires'),
    // JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: Joi.number()
    //     .default(10)
    //     .description('minutes after which verify email token expires'),
    // SMTP_HOST: Joi.string().description('server that will send the emails'),
    // SMTP_PORT: Joi.number().description('port to connect to the email server'),
    // SMTP_USERNAME: Joi.string().description('username for email server'),
    // SMTP_PASSWORD: Joi.string().description('password for email server'),
    // EMAIL_FROM: Joi.string().description('the from field in the emails sent by the app'),
    // SENDMAIL: Joi.boolean().description('options for send mail'),
    // FORGOTPASSWORD_URL: Joi.string().description('url for forgot password'),
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
  service_token_secret: envVars.SERVICE_TOKEN_SECRET,
  service_token_validity: envVars.SERVICE_TOKEN_VALIDITY,
  // SENDMAIL: envVars.SENDMAIL,
  // SUPPORTEMAIL: envVars.SUPPORTEMAIL,
  // SENDMAILTOADMIN: envVars.SENDMAILTOADMIN,
  // ADDUSER_URL: envVars.ADDUSER_URL,
  // GOOGLE_API_KEY: envVars.GOOGLE_API_KEY,
  // FORGOTPASSWORD_URL: envVars.FORGOTPASSWORD_URL,
  // ADMIN_ID: envVars.ADMIN_ID,
  // SERVER_KEY: envVars.SERVER_KEY,
  // port: envVars.PORT,
  // DAYS_BEFORE: envVars.DAYS_BEFORE,
  // MED_DOC: envVars.MED_DOC,
  // MED_PHARMA: envVars.MED_PHARMA,
  // MED_COMMON_LOGO: envVars.MED_COMMON_LOGO,
  // CAPTCH_SERVER_KEY: envVars.CAPTCH_SERVER_KEY,
  // EMAIL_REDIRECT_URL_CLIENT: envVars.EMAIL_REDIRECT_URL_CLIENT,
  // EMAIL_REDIRECT_URL_CANDIDATE: envVars.EMAIL_REDIRECT_URL_CANDIDATE,
  // EMAIL_REDIRECT_URL_ADMIN: envVars.EMAIL_REDIRECT_URL_ADMIN,
  // EMAIL_REDIRECT_URL_COMMON: envVars.EMAIL_REDIRECT_URL_COMMON,
  // EMAIL_REDIRECT_URL_DOC: envVars.EMAIL_REDIRECT_URL_DOC,
  // EMAIL_REDIRECT_URL_PHARMA: envVars.EMAIL_REDIRECT_URL_PHARMA,
  // SIGNATURE_SECRET_KEY: envVars.SIGNATURE_SECRET_KEY,
  // WHITELISTIP: envVars.WHITELISTIP,
  // RABBITMQ_URL: envVars.RABBITMQ_URL,

  // aws: {
  //     AWS_SECRET_ACCESS_KEY: envVars.AWS_SECRET_ACCESS_KEY,
  //     AWS_ACCESS_KEY: envVars.AWS_ACCESS_KEY,
  //     AWS_REGION: envVars.AWS_REGION,
  //     AWS_BUCKET: envVars.AWS_BUCKET,
  //     TEMP_FOLDER_PATH: envVars.TEMP_FOLDER_PATH,
  //     DOCUMENT_FOLDER_PATH: envVars.DOCUMENT_FOLDER_PATH,
  //     DOCUMENT_TEMP_MOVED_PATH: envVars.DOCUMENT_TEMP_MOVED_PATH,
  //     DOWNLOAD_URL_EXPIRY: envVars.DOWNLOAD_URL_EXPIRY,
  // },
  // mongoose: {
  //     url: envVars.MONGODB_URL + (envVars.NODE_ENV === 'test' ? '-test' : ''),
  //     options: {
  //     },
  // },
  // jwt: {
  //     secret: envVars.JWT_SECRET,
  //     accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
  //     refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
  //     resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES,
  //     verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
  // },
  // email: {
  //     smtp: {
  //         host: envVars.SMTP_HOST,
  //         port: envVars.SMTP_PORT,
  //         auth: {
  //             user: envVars.SMTP_USERNAME,
  //             pass: envVars.SMTP_PASSWORD,
  //         },
  //     },
  //     from: envVars.EMAIL_FROM,
  // },
  // firebase: {
  //     client_email: envVars.FIREBASE_CLIENT_EMAIL,
  //     private_key: envVars.FIREBASE_PRIVATE_KEY,
  //     project_id: envVars.FIREBASE_PROJECT_ID,
  // }
};
