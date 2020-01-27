const { Counter } = require("prom-client");

const grpcServerUsageTotal = new Counter({
  name: "grpc_server_usage_total",
  labelNames: ["consumer_name", "consumer_version", "client_version"],
  help: "Total number of calls, made by various consumers."
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
  } catch {
    return {};
  }
}

/**
 * @param {import("grpc").ServerUnaryCall | import("grpc").ServerWritableStream | import("grpc").ServerReadableStream | import("grpc").ServerDuplexStream} call
 * @param {import("grpc").MethodDefinition} methodDefinition
 * @param {Function} next
 * @returns {Promise<any>}
 */
module.exports = function(call, methodDefinition, next) {
  const consumerDescription = getConsumerDescription(call.metadata);
  grpcServerUsageTotal
    .labels(
      consumerDescription.consumerName || "unknown",
      consumerDescription.consumerVersion || "unknown",
      consumerDescription.clientVersion || "unknown"
    )
    .inc();

  return next(call);
};

/**
 * @typedef {Object} ConsumerDescription
 * @property {string} consumerName
 * @property {string} consumerVersion
 * @property {string} clientVersion
 */
