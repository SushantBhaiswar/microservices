const mongoose = require("mongoose");
const { DBEnums, SchemaNames } = require("@shared/libs");
const TokenTypes = DBEnums.TokenModel.getEnums();

const tokenSchema = mongoose.Schema(
  {
    token: {
      type: String,
      required: true,
      index: true,
    },
    user: {
      type: mongoose.SchemaTypes.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: TokenTypes,
      required: true,
    },
    expires: {
      type: Date,
      required: true,
    },
    blacklisted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * @typedef Token
 */
const Token = mongoose.model(SchemaNames.Token, tokenSchema);

module.exports = Token;
