const path = require("path");
const readPkgUp = require("read-pkg-up");
const parentModule = require("parent-module");
const { InterceptingCall } = require("grpc");

/**
 * @param {ConsumerDescription} options
 * @returns {ConsumerDescription}
 */
function getConsumerDescription(options) {
  const consumerDescription = options || {};

  if (!consumerDescription.consumerName) consumerDescription.consumerName = process.env.npm_package_name;
  if (!consumerDescription.consumerVersion) consumerDescription.consumerVersion = process.env.npm_package_version;

  if (!consumerDescription.clientVersion) {
    const parentPackage = (readPkgUp.sync({ cwd: path.dirname(parentModule()) }) || {}).packageJson;
    if (parentPackage && parentPackage.name !== consumerDescription.consumerName)
      consumerDescription.clientVersion = parentPackage.version;
  }

  return consumerDescription;
}

/**
 * @param {ConsumerDescription} options
 */
module.exports = function(options) {
  const consumerDescription = getConsumerDescription(options);

  /**
   * @param {{method_definition: import("grpc").MethodDefinition}} options
   * @param {Function} nextCall
   * @returns {InterceptingCall}
   */
  return function(options, nextCall) {
    return new InterceptingCall(nextCall(options), {
      /**
       * @param {import("grpc").Metadata} metadata
       * @param {import("grpc").Listener} listener
       * @param {Function} next
       */
      start: function(metadata, listener, next) {
        metadata.set("consumerDescription", JSON.stringify(consumerDescription));
        next(metadata, listener);
      }
    });
  };
};

/**
 * @typedef {Object} ConsumerDescription
 * @property {string} [consumerName]
 * @property {string} [consumerVersion]
 * @property {string} [clientVersion]
 */
