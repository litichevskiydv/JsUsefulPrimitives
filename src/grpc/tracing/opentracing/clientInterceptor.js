const { InterceptingCall } = require("grpc");
const opentracing = require("opentracing");
const defaultContext = require("../../../async-context").defaultContext;

module.exports = function(options, nextCall) {
  return new InterceptingCall(nextCall(options), {
    start: (metadata, listener, next) => {
      const tracer = opentracing.globalTracer();

      const headers = {};
      tracer.inject(defaultContext.get("currentSpan"), opentracing.FORMAT_HTTP_HEADERS, headers);
      for (const key in headers) metadata.set(key, headers[key]);

      next(metadata, listener);
    }
  });
};
