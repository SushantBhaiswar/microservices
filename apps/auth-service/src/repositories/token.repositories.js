const { TokenModel } = require("../models/index");

class TokenRepository {
  // constructor(userModel) {
  //   console.log("🚀 ~ TokenRepository ~ constructor ~ userModel:", userModel);
  //   userModel = userModel;
  // }

  async insertToken(data) {
    return await TokenModel.create(data);
  }

  async findToken(data) {
    return await TokenModel.findOne(data);
  }
  async deleteToken(data) {
    return await TokenModel.deleteOne(data);
  }
}

module.exports = TokenRepository;
