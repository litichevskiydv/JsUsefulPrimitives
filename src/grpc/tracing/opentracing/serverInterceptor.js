const GRPCError = require("grpc-error");
const opentracing = require("opentracing");
const defaultContext = require("../../../async-context").defaultContext;

module.exports = async function(call, methodDefinition, callback, next) {
  const tracer = opentracing.globalTracer();

  const parentSpanContext = tracer.extract(opentracing.FORMAT_HTTP_HEADERS, call.metadata.getMap());
  const span = tracer.startSpan(methodDefinition.path, { childOf: parentSpanContext });
  defaultContext.set("currentSpan", span);

  if (call.request) span.setTag("request", JSON.stringify(call.request));

  try {
    await next(call, callback);
  } catch (error) {
    if (error instanceof GRPCError === false && error.constructor.toString() !== GRPCError.toString()) {
      span.setTag(opentracing.Tags.ERROR, true);
      span.setTag(opentracing.Tags.SAMPLING_PRIORITY, 1);
      span.log({ event: "error", "error.object": error, message: error.message, stack: error.stack });
    }

    throw error;
  } finally {
    span.finish();
  }
};
