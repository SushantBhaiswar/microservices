const DBEnums = {
  TokenModel: {
    TokenTypes: {
      Refresh: "Refresh",
      ResetPassword: "ResetPassword",
      Access: "Access",
    },
    getEnums: function () {
      return Object.values(this.TokenTypes);
    },
  },
};

module.exports = DBEnums;
