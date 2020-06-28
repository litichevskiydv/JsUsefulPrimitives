const grpc = require("@grpc/grpc-js");

/**
 * @param {any} value
 * @returns {boolean}
 */
function isPassed(value) {
  return value !== undefined && value !== null;
}

module.exports = class GrpcError extends Error {
  /**
   * @param {import("@grpc/grpc-js").status | void} [statusCode]
   * @returns {import("@grpc/grpc-js").status}
   */
  static _getCode(statusCode) {
    return typeof statusCode === "number" && Number.isInteger(statusCode) ? statusCode : grpc.status.INTERNAL;
  }

  /**
   * @param {string} message
   * @param {string | void} details
   * @param {Error | void} innerError
   * @returns {string}
   */
  static _getDetails(message, details, innerError) {
    if (isPassed(innerError) && "message" in innerError && typeof innerError.message === "string") return innerError.message;
    if (isPassed(details) && typeof details === "string") return details;
    return message;
  }

  /**
   * @param {import("@grpc/grpc-js").Metadata | {[key: string]: string} | void} metadata
   * @returns {import("@grpc/grpc-js").Metadata}
   */
  static _getMetadata(metadata) {
    if (isPassed(metadata) === false) return new grpc.Metadata();
    if (metadata instanceof grpc.Metadata) return metadata;

    const result = new grpc.Metadata();
    Object.entries(metadata).forEach(([key, value]) => {
      if (typeof key === "string" && isPassed(value)) result.add(key, String(value));
    });
    return result;
  }

  /**
   * @param {string} message
   * @param {GrpcErrorOptions} [options]
   */
  constructor(message, options = {}) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);

    this.code = GrpcError._getCode(options.statusCode);
    this.details = GrpcError._getDetails(message, options.details, options.innerError);
    this.metadata = GrpcError._getMetadata(options.metadata);
  }
};

/**
 * @typedef {Object} GrpcErrorOptions
 * @property {import("@grpc/grpc-js").status} [statusCode] Response status code.
 * @property {string} [details] Response details.
 * @property {import("@grpc/grpc-js").Metadata | {[key: string]: string}} [metadata] Response metadata.
 * @property {Error} [innerError] The inner error information.
 */
