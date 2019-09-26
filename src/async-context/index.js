const CallContext = require("./callContext");
const contextsStorage = require("./contextsStorage");

module.exports.set = function(key, value) {
  contextsStorage.getContext().set(key, value);
};
module.exports.get = function(key) {
  return contextsStorage.getContext().get(key);
};
module.exports.storage = contextsStorage;
