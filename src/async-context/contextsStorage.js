const asyncHooks = require("async_hooks");

module.exports = class ContextsStorage {
  constructor() {
    /**  @type {Map<number, Map<any, any>>} */
    this._contextsByExecutionsIds = new Map();
  }

  createContext() {
    this._contextsByExecutionsIds.set(asyncHooks.executionAsyncId(), new Map());
  }

  getContext() {
    return this._contextsByExecutionsIds.set(asyncHooks.executionAsyncId());
  }
};
