const asyncContext = require("../../../async-context");

module.exports = async function(call, methodDefinition, next) {
  asyncContext.create();
  return next(call);
};
