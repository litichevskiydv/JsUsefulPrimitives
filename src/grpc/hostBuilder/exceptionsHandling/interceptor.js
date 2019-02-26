const grpc = require("grpc");
const GRPCError = require("grpc-error");

module.exports = class Interceptor {
  constructor(serverContext) {
    this._logger = serverContext.createLogger();
  }

  async invoke(call, methodDefinition, callback, next) {
    try {
      await next(call, callback);
    } catch (error) {
      if (error instanceof GRPCError || error.constructor.toString() === GRPCError.toString()) callback(error);
      else {
        this._logger.error("Unhandled exception has occurred in method {methodName}", { error, methodName: methodDefinition.path });

        const stackTrace = error.stack.replace(/\r?\n|\r/g, " ");
        callback(
          /^[ -~]*$/.test(stackTrace)
            ? new GRPCError(error, grpc.status.INTERNAL, { stackTrace })
            : new GRPCError(error, grpc.status.INTERNAL)
        );
      }
    }
  }
};
