const os = require("os");
const GRPCError = require("grpc-error");
const opentracing = require("opentracing");
const initTracer = require("jaeger-client").initTracer;
const defaultContext = require("../../../async-context").defaultContext;

const tracer = initTracer(
  {
    serviceName: rocess.env.npm_package_name
  },
  {
    tags: {
      [`${rocess.env.npm_package_name}.hostName`]: os.hostname(),
      [`${rocess.env.npm_package_name}.version`]: process.env.npm_package_version,
      [`${rocess.env.npm_package_name}.environment`]: process.env.NAMESPACE || process.env.NODE_ENV
    }
  }
);

module.exports = async function(call, methodDefinition, callback, next) {
  const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, call.metadata.getMap());
  const span = tracer.startSpan(methodDefinition.path, { childOf: parentSpanContext });
  defaultContext.set("currentSpan", span);

  try {
    await next(call, callback);
  } catch (error) {
    if (error instanceof GRPCError === false && error.constructor.toString() !== GRPCError.toString()) {
      span.setTag(opentracing.Tags.ERROR, true);
      span.log({ event: "error", "error.object": error, message: error.message, stack: error.stack });
    }
  } finally {
    span.finish();
  }
};
