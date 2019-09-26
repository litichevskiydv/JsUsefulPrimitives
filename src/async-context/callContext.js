const asyncHooks = require("async_hooks");

module.exports = class CallContext {
  constructor() {
    /**  @type {Map<number, Map<any, any>>} */
    this._data = new Map();
  }

  _getExecutionData(key) {
    const executionId = asyncHooks.executionAsyncId();
    return this._data.get(executionId);
  }

  set(key, value) {
    const executionData = this._getExecutionData(key);
    if (executionData) executionData.set(key, value);
  }

  get(key) {
    const executionData = this._getExecutionData(key);
    return executionData ? executionData.get(key) : null;
  }
};
