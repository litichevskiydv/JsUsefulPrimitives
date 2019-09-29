const asyncHooks = require("async_hooks");

module.exports = class ContextsStorage {
  constructor() {
    /**  @type {Map<number, Map<any, any>>} */
    this._contextsByExecutionsIds = new Map();
  }

  /**
   * @returns {Map<any, any>}
   */
  createContext() {
    const newContext = new Map();
    this._contextsByExecutionsIds.set(asyncHooks.executionAsyncId(), newContext);
    return newContext;
  }

  /**
   * @returns {Map<any, any>}
   */
  getContext() {
    return this._contextsByExecutionsIds.set(asyncHooks.executionAsyncId());
  }
};
