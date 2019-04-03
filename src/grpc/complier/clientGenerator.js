const path = require("path");
const slash = require("slash");
const camelCase = require("camelcase");
const { FileDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const MessagesCatalog = require("./messagesCatalog");
const StringBuilder = require("./stringBuilder");

/**
 * @param {string} importPath
 */
const importPathToNamespaceName = importPath =>
  camelCase(
    slash(importPath)
      .replace(path.extname(importPath), "")
      .split(path.posix.sep)
      .join("_")
  );

/**
 * @param {string} importPath
 * @param {string} suffix
 */
const importPathToRequirePath = (importPath, suffix) => `./${importPath.replace(path.extname(importPath), "")}_${suffix || "pb"}`;

const predefinedPaths = new Map([
  ["google/protobuf/compiler/plugin.proto", "google-protobuf/google/protobuf/compiler/plugin_pb"],
  ["google/protobuf/any.proto", "google-protobuf/google/protobuf/any_pb"],
  ["google/protobuf/api.proto", "google-protobuf/google/protobuf/api_pb"],
  ["google/protobuf/descriptor.proto", "google-protobuf/google/protobuf/descriptor_pb"],
  ["google/protobuf/duration.proto", "google-protobuf/google/protobuf/duration_pb"],
  ["google/protobuf/empty.proto", "google-protobuf/google/protobuf/empty_pb"],
  ["google/protobuf/field_mask.proto", "google-protobuf/google/protobuf/field_mask_pb"],
  ["google/protobuf/source_context.proto", "google-protobuf/google/protobuf/source_context_pb"],
  ["google/protobuf/struct.proto", "google-protobuf/google/protobuf/struct_pb"],
  ["google/protobuf/timestamp.proto", "google-protobuf/google/protobuf/timestamp_pb"],
  ["google/protobuf/type.proto", "google-protobuf/google/protobuf/type_pb"],
  ["google/protobuf/wrappers.proto", "google-protobuf/google/protobuf/wrappers_pb"]
]);
/**
 * @param {string} importPath
 */
const getRequirePath = importPath => predefinedPaths.get(slash(importPath)) || importPathToRequirePath(importPath);

/**
 *
 * @param {string} packageName
 * @param {string} clientName
 * @returns {string}
 */
const getClientFullName = (packageName, clientName) => (packageName.length > 0 ? `${packageName}.${clientName}` : clientName);

/**
 * Generates JavaScript code for client
 * @param {MessagesCatalog} messagesCatalog Messages catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = (messagesCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  builder
    .appendLine('const { set } = require("dot-prop");')
    .appendLine('const grpcPromise = require("grpc-promise");')
    .appendLine();

  builder.appendLine("let root = {};").appendLine();
  messagesCatalog.importedFiles.forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    const packageName = fileDescriptor.getPackage();

    if (packageName.length > 0) builder.appendLine(`set(root, "${packageName}", require("${getRequirePath(fileName)}"));`);
    else builder.appendLine(`root = Object.assign(root, require("${getRequirePath(fileName)}"));`);
  });
  builder.appendLine();

  const requirePath = importPathToRequirePath(fileDescriptor.getName(), "grpc_pb");
  const clientsList = fileDescriptor.getServiceList().map(x => `${x.getName()}Client: ${x.getName()}ClientRaw`);
  builder.appendLine(`const { ${clientsList.join(", ")} } = require("${requirePath}");`).appendLine();

  fileDescriptor.getServiceList().forEach(service => {
    const clientName = `${service.getName()}Client`;
    builder
      .appendLine(`class ${clientName} {`)
      .appendLineIdented("constructor(address, credentials) {", 1)
      .appendLineIdented(`this._client = new ${clientName}Raw(address, credentials);`, 2)
      .appendLineIdented("grpcPromise.promisifyAll(this._client);", 2)
      .appendLineIdented("}", 1);

    service.getMethodList().forEach(method => {
      const methodName = camelCase(method.getName());
      if (method.getClientStreaming() === true && method.getServerStreaming() === true)
        builder
          .appendLineIdented(`async *${methodName}(messages) {`, 1)
          .appendLineIdented(`const channel = this._client.${methodName}();`, 2)
          .appendLineIdented("for (const message of messages) yield await channel.sendMessage(message);", 2)
          .appendLineIdented("channel.end();", 2)
          .appendLineIdented("}", 1);
      else if (method.getClientStreaming() === true)
        builder
          .appendLineIdented(`async ${methodName}(messages) {`, 1)
          .appendLineIdented(`const channel = this._client.${methodName}();`, 2)
          .appendLineIdented("for (const message of messages) channel.sendMessage(message);", 2)
          .appendLineIdented("return await channel.end();", 2)
          .appendLineIdented("}", 1);
      else if (method.getServerStreaming() === true)
        builder
          .appendLineIdented(`async ${methodName}(message) {`, 1)
          .appendLineIdented(`return await this._client.${methodName}().sendMessage(message);`, 2)
          .appendLineIdented("}", 1);
      else
        builder
          .appendLineIdented(`async ${methodName}(message) {`, 1)
          .appendLineIdented(`return await this._client.${methodName}().sendMessage(message);`, 2)
          .appendLineIdented("}", 1);
    });

    builder
      .appendLine("};")
      .appendLine(`set(root, "${getClientFullName(fileDescriptor.getPackage(), clientName)}", ${clientName});`)
      .appendLine();
  });

  return builder.appendLine("module.exports = root;").toString();
};

/**
 * Generates typings for client
 * @param {MessagesCatalog} messagesCatalog Messages catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateTypings = (messagesCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  builder.appendLineIdented('import { ServerCredentials } from "grpc";').appendLine();

  fileDescriptor.getDependencyList().forEach(x => {
    builder.appendLine(`import * as ${importPathToNamespaceName(x)} from "${getRequirePath(x)}";`);
  });
  const fileName = fileDescriptor.getName();
  builder.appendLine(`import * as ${importPathToNamespaceName(fileName)} from "${importPathToRequirePath(fileName)}";`).appendLine();

  fileDescriptor.getServiceList().forEach(service => {
    builder
      .appendLine(`export class ${service.getName()}Client {`)
      .appendLineIdented("constructor(address: string, credentials: ServerCredentials);", 1);

    service.getMethodList().forEach(method => {
      const methodName = camelCase(method.getName());
      const inputMessage = messagesCatalog.getMessage(method.getInputType());
      const inputTypeName = importPathToNamespaceName(inputMessage.fileName) + inputMessage.name;
      const outputMessage = messagesCatalog.getMessage(method.getOutputType());
      const outputTypeName = importPathToNamespaceName(outputMessage.fileName) + outputMessage.name;

      if (method.getClientStreaming() === true && method.getServerStreaming() === true)
        builder.appendLineIdented(`${methodName}(message: Iterable<${inputTypeName}>): AsyncIterableIterator<${outputTypeName}>;`, 1);
      else if (method.getClientStreaming() === true)
        builder.appendLineIdented(`${methodName}(message: Iterable<${inputTypeName}>): Promise<${outputTypeName}>;`, 1);
      else if (method.getServerStreaming() === true)
        builder.appendLineIdented(`${methodName}(message: ${inputTypeName}): Promise<Array<${outputTypeName}>>;`, 1);
      else builder.appendLineIdented(`${methodName}(message: ${inputTypeName}): Promise<${outputTypeName}>;`, 1);
    });

    builder.appendLine("};");
  });

  return builder.toString();
};

module.exports = { generateJs, generateTypings };
