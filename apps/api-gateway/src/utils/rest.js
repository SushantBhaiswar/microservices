const axios = require("axios");
const { ApiError } = require("/usr/src/libs");

const restRequest = async (targetUrl, apiRoute, headers, body, timeout) => {
  const { method, path } = apiRoute;
  const fullTargetUrl = `${targetUrl}${path}`;

  const filterHeaders = (headers) => {
    const {
      "content-length": _cl,
      "transfer-encoding": _te,
      host: _host,
      connection: _conn,
      ...safeHeaders
    } = headers;
    return safeHeaders;
  };

  const axiosConfig = {
    headers: filterHeaders(headers),
    timeout: timeout || 10000,
  };

  try {
    const methodFunc = axios[method.toLowerCase()];
    const response = await methodFunc(fullTargetUrl, body, axiosConfig);
    if (response.status === 304) {
      return null;
    }
    return {
      status: response.status || error.response.data.code,
      headers: response.headers,
      data: response.data || error.response.data.message,
    };
  } catch (error) {
    throw new ApiError(
      500,
      "Axios error while communicating with the services",
      false,
      error.stack
    );
  }
};

module.exports = { restRequest };
