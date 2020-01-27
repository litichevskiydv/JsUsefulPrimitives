const asyncContext = require("../../../async-context");

/**
 * @param {import("../index").ServiceCall} call
 * @param {import("grpc").MethodDefinition} methodDefinition
 * @param {import("../index").handleServiceCall<any, any>} next
 */
module.exports = async function(call, methodDefinition, next) {
  asyncContext.create();
  return next(call);
};
