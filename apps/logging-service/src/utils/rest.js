const axios = require("axios");
const logger = require("../config/logger");
const ApiError = require("./ApiError");

const restRequest = async (targetUrl, apiRoute, headers, body, timeout) => {
  const { method, path } = apiRoute;
  const fullTargetUrl = `${targetUrl}${path}`;
  const axiosConfig = {
    method: method.toUpperCase(),
    url: fullTargetUrl,
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "If-None-Match": "",
    },
    data: ["POST", "PUT", "PATCH"].includes(method.toUpperCase())
      ? body
      : undefined,
    timeout: timeout || 10000,
  };
  try {
    const response = await axios(axiosConfig);
    if (response.status === 304) {
      return null;
    }
    return {
      status: response.status,
      headers: response.headers,
      data: response.data,
    };
  } catch (error) {
    throw new ApiError(error.response.data.code, error.response.data.message);
  }
};

module.exports = { restRequest };
