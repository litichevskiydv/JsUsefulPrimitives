const grpc = require("@grpc/grpc-js");
const GrpcError = require("../../error/grpcError");

/**
 * @param {Error} error
 * @returns {GrpcError}
 */
const createGrpcError = (error) => {
  const message = "Unhandled exception has occurred";
  const stackTrace = error.stack.replace(/\r?\n|\r/g, " ");
  return /^[ -~]*$/.test(stackTrace)
    ? new GrpcError(message, { metadata: { stackTrace }, innerError: error })
    : new GrpcError(message, { innerError: error });
};

/**
 * @param {import(@grpc/grpc-js).MethodDefinition} methodDefinition
 * @param {import(@grpc/grpc-js).handleCall<any, any>} handler
 * @param {import("../index").Logging.ILogger} logger
 * @returns {import(@grpc/grpc-js).handleCall<any, any>}
 */
module.exports = function (methodDefinition, handler, logger) {
  return async (call, callback) => {
    try {
      await handler(call, callback);
    } catch (error) {
      let grpcError = error;
      if (error instanceof GrpcError === false) {
        grpcError = createGrpcError(error);
        logger.error("Unhandled exception has occurred in method {methodName}", { error, methodName: methodDefinition.path });
      }

      if (callback) callback(grpcError);
      else call.emit("error", grpcError);
    }
  };
};
