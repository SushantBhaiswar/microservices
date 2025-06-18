const { getDatabase, getLogger } = require("../app");
const config = require("../config/config");

const create_log = async (appInstance, messages, context) => {
  const database = getDatabase();
  const logger = getLogger();
  const Logs = database.getModel(config.mongoose.DATABASE, "logs");

  try {
    const createdLog = await Logs.create(JSON.parse(messages));
  } catch (error) {
    console.log("🚀 ~ constcreate_log= ~ error:", error);
  }
};

module.exports = {
  create_log,
};
