const { Counter } = require("prom-client");

const grpcServerCallsTotal = new Counter({
  name: "grpc_server_calls_total",
  labelNames: ["consumer_name", "consumer_version", "client_version", "grpc_method", "grpc_service", "grpc_type"],
  help: "Total number of calls, made by various consumers.",
});

/**
 * @param {import("grpc").Metadata} metadata
 * @returns {ConsumerDescription}
 */
function getConsumerDescription(metadata) {
  const consumerDescriptionString = metadata.get("consumerDescription")[0];
  if (!consumerDescriptionString) return {};

  try {
    return JSON.parse(consumerDescriptionString);
  } catch (error) {
    return {};
  }
}

/**
 * @param {string} path
 * @returns {{serviceName: string, methodName: string}}
 */
const parseMethodPath = (path) => {
  const [, serviceName, methodName] = path.split("/");
  return { serviceName, methodName };
};

/**
 * @param {import("grpc").MethodDefinition} methodDefinition
 * @returns {"bidi" | "client_stream" | "server_stream" | "unary"}
 */
const getMethodType = (methodDefinition) => {
  if (methodDefinition.requestStream) return methodDefinition.responseStream ? "bidi" : "client_stream";
  return methodDefinition.responseStream ? "server_stream" : "unary";
};

/**
 * @param {import("grpc").ServerUnaryCall | import("grpc").ServerWritableStream | import("grpc").ServerReadableStream | import("grpc").ServerDuplexStream} call
 * @param {import("grpc").MethodDefinition} methodDefinition
 * @param {Function} next
 * @returns {Promise<any>}
 */
module.exports = function (call, methodDefinition, next) {
  const { consumerName, consumerVersion, clientVersion } = getConsumerDescription(call.metadata);
  const { serviceName, methodName } = parseMethodPath(methodDefinition.path);
  const methodType = getMethodType(methodDefinition);
  grpcServerCallsTotal
    .labels(consumerName || "unknown", consumerVersion || "unknown", clientVersion || "unknown", methodName, serviceName, methodType)
    .inc();

  return next(call);
};

/**
 * @typedef {Object} ConsumerDescription
 * @property {string} consumerName
 * @property {string} consumerVersion
 * @property {string} clientVersion
 */
