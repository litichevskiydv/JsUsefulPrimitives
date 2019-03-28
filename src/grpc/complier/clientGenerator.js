const path = require("path");
const camelCase = require("camelcase");
const { FileDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const MessagesCatalog = require("./messagesCatalog");
const StringBuilder = require("./stringBuilder");

const importPathToRequirePath = (importPath, suffix) =>
  `./${path.basename(importPath, path.extname(importPath))}_${suffix || "pb"}`;

/**
 * Generates JavaScript code for client
 * @param {MessagesCatalog} messagesCatalog Messages catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = (messagesCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  builder
    .appendLine('const grpc = require("grpc");')
    .appendLine('const grpcPromise = require("grpc-promise");')
    .appendLine();

  const requirePath = importPathToRequirePath(fileDescriptor.getName(), "grpc_pb");
  const clientsList = fileDescriptor.getServiceList().map(x => `${x.getName()}Client: ${x.getName()}ClientRaw`);
  builder.appendLine(`const { ${clientsList.join(", ")} } = require("${requirePath}");`).appendLine();

  fileDescriptor.getServiceList().forEach(service => {
    builder
      .appendLine(`module.exports.${service.getName()}Client = class ${service.getName()}Client {`)
      .appendLineIdented("constructor(address, credentials) {", 1)
      .appendLineIdented(`this._client = new ${service.getName()}ClientRaw(address, credentials);`, 2)
      .appendLineIdented("grpcPromise.promisifyAll(this._client);", 2)
      .appendLineIdented("}", 1);

    service.getMethodList().forEach(method => {
      if (method.hasServerStreaming === true && method.hasClientStreaming === true) {
      } else if (method.hasClientStreaming === true) {
      } else if (method.hasServerStreaming === true) {
      } else
        builder
          .appendLineIdented(`async ${camelCase(method.getName())}(message) {`, 1)
          .appendLineIdented(`return await this._client.${camelCase(method.getName())}().sendMessage(message);`, 2)
          .appendLineIdented("}", 1);
    });

    builder.appendLine("};");
  });

  return builder.toString();
};

/**
 * Generates typings for client
 * @param {MessagesCatalog} messagesCatalog Messages catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateTypings = (messagesCatalog, fileDescriptor) => {
  return "abc";
};

module.exports = { generateJs, generateTypings };
