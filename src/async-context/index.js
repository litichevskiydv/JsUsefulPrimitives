const asyncHooks = require("async_hooks");
const ContextsStorage = require("./contextsStorage");

/**  @type {ContextsStorage} */
let defaultStorage;
/**  @type {Map<string, ContextsStorage>} */
const namedStorages = new Map();

/**
 * @param {string} contextName
 * @returns {boolean}
 */
const isContextNameEmpty = contextName => (contextName || "").trim().length === 0;

/**
 * @param {string} [contextName]
 * @returns {Map<any, any>}
 */
const obtainContext = contextName => {
  const contextsStorage = isContextNameEmpty(contextName) ? defaultStorage : namedStorages.get(contextName);
  return contextsStorage ? contextsStorage.getContext() : undefined;
};

/**
 * @param {ContextsStorage} contextStorage
 */
const createHook = contextStorage => {
  asyncHooks
    .createHook({
      init: function(asyncId, type, triggerId, resource) {
        const parentContext = contextStorage._contextsByExecutionsIds.get(triggerId);
        if (parentContext) contextStorage._contextsByExecutionsIds.set(asyncId, new Map(parentContext));
      },
      destroy: function(asyncId) {
        contextStorage._contextsByExecutionsIds.delete(asyncId);
      }
    })
    .enable();
};

/**
 * @param {string} [contextName]
 * @returns {Map<any, any>}
 */
const createContext = contextName => {
  let contextStorage;
  if (isContextNameEmpty(contextName)) {
    if (!defaultStorage) {
      defaultStorage = new ContextsStorage();
      createHook(defaultStorage);
    }

    contextStorage = defaultStorage;
  } else {
    contextStorage = namedStorages.get(contextName);

    if (!contextStorage) {
      contextStorage = new ContextsStorage();
      namedStorages.set(contextName, contextStorage);
      createHook(contextStorage);
    }
  }

  return contextStorage.createContext();
};

const getValue = key => {
  const context = obtainContext();
  return context ? context.get(key) : undefined;
};

const setValue = (key, value) => {
  const context = obtainContext();
  if (context) context.set(key, value);
};

module.exports = {
  obtain: obtainContext,
  create: createContext,
  defaultContext: {
    get: getValue,
    set: setValue
  }
};
