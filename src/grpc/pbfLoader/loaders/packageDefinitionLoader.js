const Pbf = require("pbf");
const path = require("path");
const { get } = require("dot-prop");
const compile = require("pbf/compile");
const camelCase = require("camelcase");

const schemeLoader = require("./schemeLoader");

/**
 * @param {any} formatter
 * @returns {function(any): Buffer}
 */
function createSerializer(formatter) {
  return function serialize(arg) {
    const pbf = new Pbf();
    formatter.write(arg, pbf);
    return Buffer.from(pbf.finish());
  };
}

/**
 * @param {any} formatter
 * @returns {function(Buffer): any}
 */
function createDeserializer(formatter) {
  return function deserialize(argBuf) {
    const pbf = new Pbf(argBuf);
    return formatter.read(pbf);
  };
}

/**
 * @param {string} serviceName
 * @param {import("protocol-buffers-schema/types").Method} methodScheme
 * @param {any} formatters
 * @returns {import("@grpc/grpc-js").MethodDefinition}
 */
function createMethodDefinition(serviceName, methodScheme, formatters) {
  const requestFormatter = get(formatters, methodScheme.input_type);
  const responseFormatter = get(formatters, methodScheme.output_type);

  return {
    originalName: camelCase(methodScheme.name),
    path: "/" + serviceName + "/" + methodScheme.name,
    requestStream: methodScheme.client_streaming,
    responseStream: methodScheme.server_streaming,
    requestSerialize: createSerializer(requestFormatter),
    requestDeserialize: createDeserializer(requestFormatter),
    responseSerialize: createSerializer(responseFormatter),
    responseDeserialize: createDeserializer(responseFormatter),
  };
}

/**
 * @param {string} serviceName
 * @param {import("protocol-buffers-schema/types").Service} serviceScheme
 * @param {any} formatters
 * @returns {import("@grpc/grpc-js").ServiceDefinition<any>}
 */
function createServiceDefinition(serviceName, serviceScheme, formatters) {
  const serviceDefinition = {};
  for (const methodScheme of serviceScheme.methods)
    serviceDefinition[methodScheme.name] = createMethodDefinition(serviceName, methodScheme, formatters);

  return serviceDefinition;
}

/**
 * @param {import("protocol-buffers-schema/types").Schema} protoFileScheme
 * @returns {import("@grpc/grpc-js").PackageDefinition}
 */
function createPackageDefinition(protoFileScheme) {
  const packageDefinition = {};

  const formatters = compile(protoFileScheme);
  const packageName = protoFileScheme.package;
  for (const serviceScheme of protoFileScheme.services) {
    const serviceName = packageName ? `${packageName}.${serviceScheme.name}` : serviceScheme.name;
    packageDefinition[serviceName] = createServiceDefinition(serviceName, serviceScheme, formatters);
  }

  return packageDefinition;
}

/**
 * @param {string} protoFilePath
 * @param {DefinitionLoadingOptions} [options]
 * @returns {import("@grpc/grpc-js").PackageDefinition}
 */
async function load(protoFilePath, options) {
  return createPackageDefinition(await schemeLoader.load(protoFilePath, options));
}

/**
 * @param {string} protoFilePath
 * @param {DefinitionLoadingOptions} [options]
 * @returns {import("@grpc/grpc-js").PackageDefinition}
 */
function loadSync(protoFilePath, options) {
  return createPackageDefinition(schemeLoader.loadSync(protoFilePath, options));
}

module.exports = {
  load,
  loadSync,
};

/**
 * @typedef {Object} DefinitionLoadingOptions
 * @property {boolean} [keepCase] Preserve field names. The default is to change them to camel case.
 * @property {string[]} [includeDirs] Paths to search for imported `.proto` files.
 */
