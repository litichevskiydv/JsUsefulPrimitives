const asyncContext = require("../../../async-context");

module.exports = class Interceptor {
  async invoke(call, methodDefinition, callback, next) {
    asyncContext.create();
    await next(call, callback);
  }
};
