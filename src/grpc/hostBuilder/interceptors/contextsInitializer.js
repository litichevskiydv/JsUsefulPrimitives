const asyncContexts = require("../../../async-context");

module.exports = class Interceptor {
  constructor(serverContext) {
    this._tracesIdsGenerator = serverContext.tracesIdsGenerator;
  }

  async invoke(call, methodDefinition, callback, next) {
    let traceId = call.metadata.get("trace_id")[0];
    if (!traceId) traceId = this._tracesIdsGenerator();

    asyncContexts.storage.createContext().set("traceId", traceId);
    await next(call, callback);
  }
};
