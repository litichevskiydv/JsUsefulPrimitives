const { InterceptingCall } = require("grpc");

/**
 * @param {{method_definition: import("grpc").MethodDefinition}} options
 * @param {Function} nextCall
 * @returns {InterceptingCall}
 */
module.exports = function(options, nextCall) {
  return new InterceptingCall(nextCall(options), {
    /**
     * @param {import("grpc").Metadata} metadata
     * @param {import("grpc").Listener} listener
     * @param {Function} next
     */
    start: function(metadata, listener, next) {
      metadata.set(
        "consumerDescription",
        JSON.stringify({
          consumerName: process.env.npm_package_name,
          consumerVersion: process.env.npm_package_version
        })
      );
      next(metadata, listener);
    }
  });
};
