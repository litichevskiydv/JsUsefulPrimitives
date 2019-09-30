const asyncContexts = require("../../../async-context");

module.exports = class Interceptor {
  constructor(serverContext) {
    this._callsIdsGenerator = serverContext.callsIdsGenerator;
  }

  async invoke(call, methodDefinition, callback, next) {
    let callId = call.metadata.get("call_id")[0];
    if (!callId) callId = this._callsIdsGenerator();

    asyncContexts.storage.createContext().set("callId", callId);
    await next(call, callback);
  }
};
