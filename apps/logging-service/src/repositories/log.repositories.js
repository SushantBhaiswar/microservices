const { LogModel } = require("../models/index");

class LogRepository {
  // constructor(userModel) {
  //   console.log("🚀 ~ LogRepository ~ constructor ~ userModel:", userModel);
  //   userModel = userModel;
  // }

  async insertToken(data) {
    return await TokenModel.create(data);
  }

  async findToken(data) {
    return await userModel.findOne(data);
  }
}

module.exports = LogRepository;
