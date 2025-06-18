const BaseRepository = require("./base.repositories");
const { userModel } = require("../models/index");

class UserRepository {
  // constructor(userModel) {
  //   console.log("🚀 ~ UserRepository ~ constructor ~ userModel:", userModel);
  //   userModel = userModel;
  // }

  async insertUser(data) {
    return await userModel.create(data);
  }

  async findByEmail(email) {
    return await userModel.findOne({ email });
  }

  async findUser(condition) {
    const user = await userModel.findOne(condition);
    return user;
  }

  async validatePassword(email, password) {
    const user = await userModel.findOne({ email });
    if (!user) {
      return false;
    }
    const isMatch = await user.isPasswordMatch(password);
    return isMatch ? user : false;
  }
}

module.exports = UserRepository;
