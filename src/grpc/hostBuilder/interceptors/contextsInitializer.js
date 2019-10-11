const asyncContext = require("../../../async-context");

module.exports = class Interceptor {
  async invoke(call, methodDefinition, callback, next) {
    const currentContext = asyncContext.create();

    const spanId = call.metadata.get("span_id")[0];
    if (spanId) currentContext.set("spanId", spanId);

    await next(call, callback);
  }
};
