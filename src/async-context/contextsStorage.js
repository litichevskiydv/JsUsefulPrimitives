const asyncHooks = require("async_hooks");
const CallContext = require("./callContext");

/**  @type {CallContext} */
let defaultContext;
/**  @type {Map<number, CallContext>} */
const namedContexts = new Map();

/**
 * @param {string} contextName
 * @returns {boolean}
 */
const isContextNameEmpty = contextName => (contextName || "").trim().length === 0;

/**
 * @param {string} [contextName]
 */
module.exports.createContext = function(contextName) {
  /**  @type {CallContext} */
  const context = new CallContext();
  if (isContextNameEmpty(contextName)) defaultContext = context;
  else namedContexts.set(contextName, context);

  asyncHooks
    .createHook({
      init: function(asyncId, type, triggerId, resource) {
        context._data.set(asyncId, context._data.get(triggerId) || new Map());
      },
      destroy: function(asyncId) {
        context._data.delete(asyncId);
      }
    })
    .enable();
};

/**
 * @param {string} [contextName]
 */
module.exports.getContext = function(contextName) {
  if (isContextNameEmpty(contextName)) returndefaultContext;
  return namedContexts.get(contextName);
};
