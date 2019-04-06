const path = require("path");
const slash = require("slash");
const { set } = require("dot-prop");
const camelCase = require("camelcase");
const { FileDescriptorProto, ServiceDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const ImportsCatalog = require("./importsCatalog");
const StringBuilder = require("./stringBuilder");
const requiresGenerator = require("./subGenerators/requiresGenerator");
const proxyGenerator = require("./subGenerators/proxyGenerator");

/**
 *
 * @param {string} packageName
 * @param {string} clientName
 * @returns {string}
 */
const getClientFullName = (packageName, clientName) => (packageName.length > 0 ? `${packageName}.${clientName}` : clientName);

/**
 * Generates JavaScript code for client
 * @param {ImportsCatalog} importsCatalog Imports catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = (importsCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  builder
    .appendLine('const { set } = require("dot-prop");')
    .appendLine('const grpcPromise = require("grpc-promise");')
    .appendLine();

  builder.appendLine("let root = {};").appendLine();
  importsCatalog.importedFiles.forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    const packageName = fileDescriptor.getPackage();

    if (packageName.length > 0)
      builder.appendLine(`set(root, "${packageName}", require("${requiresGenerator.getRequirePath(fileName)}"));`);
    else builder.appendLine(`root = Object.assign(root, require("${requiresGenerator.getRequirePath(fileName)}"));`);
  });
  builder.appendLine();

  const requirePath = requiresGenerator.getRequirePath(fileDescriptor.getName(), "grpc_pb");
  const clientsList = fileDescriptor.getServiceList().map(x => `${x.getName()}Client: ${x.getName()}ClientRaw`);
  builder.appendLine(`const { ${clientsList.join(", ")} } = require("${requirePath}");`).appendLine();

  fileDescriptor.getServiceList().forEach(service => {
    const clientName = `${service.getName()}Client`;
    proxyGenerator
      .generateProxy(builder, service)
      .appendLine(`set(root, "${getClientFullName(fileDescriptor.getPackage(), clientName)}", ${clientName});`)
      .appendLine();
  });

  return builder.appendLine("module.exports = root;").toString();
};

/**
 * @param {StringBuilder} builder
 * @param {FileDescriptorProto} fileDescriptor
 */
const generateTypingsForMessages = (builder, fileDescriptor) => {
  const namespaceName = requiresGenerator.getNamespace(fileDescriptor.getName());

  fileDescriptor.getMessageTypeList().forEach(messageDescriptor => {
    const messageName = messageDescriptor.getName();
    builder.appendLineIdented(`export import ${messageName} = ${namespaceName}.${messageName};`);
  });
  fileDescriptor.getEnumTypeList().forEach(enumDescriptor => {
    const enumName = enumDescriptor.getName();
    builder.appendLineIdented(`export import ${enumName} = ${namespaceName}.${enumName};`);
  });
};

/**
 * @param {StringBuilder} builder
 * @param {ServiceDescriptorProto} serviceDescriptor
 * @param {ImportsCatalog} importsCatalog
 */
const generateTypingsForServices = (builder, serviceDescriptor, importsCatalog) => {
  builder
    .appendLineIdented(`export class ${serviceDescriptor.getName()}Client {`)
    .appendLineIdented("constructor(address: string, credentials: ServerCredentials);", 1);

  serviceDescriptor.getMethodList().forEach(method => {
    const methodName = camelCase(method.getName());
    const inputMessage = importsCatalog.getMessage(method.getInputType());
    const inputTypeName = requiresGenerator.getNamespace(inputMessage.fileName) + inputMessage.name;
    const outputMessage = importsCatalog.getMessage(method.getOutputType());
    const outputTypeName = requiresGenerator.getNamespace(outputMessage.fileName) + outputMessage.name;

    if (method.getClientStreaming() === true && method.getServerStreaming() === true)
      builder.appendLineIdented(`${methodName}(message: Iterable<${inputTypeName}>): AsyncIterableIterator<${outputTypeName}>;`, 1);
    else if (method.getClientStreaming() === true)
      builder.appendLineIdented(`${methodName}(message: Iterable<${inputTypeName}>): Promise<${outputTypeName}>;`, 1);
    else if (method.getServerStreaming() === true)
      builder.appendLineIdented(`${methodName}(message: ${inputTypeName}): Promise<Array<${outputTypeName}>>;`, 1);
    else builder.appendLineIdented(`${methodName}(message: ${inputTypeName}): Promise<${outputTypeName}>;`, 1);
  });

  builder.appendLineIdented("}");
};

/**
 * @param {StringBuilder} builder
 * @param {*} container
 * @returns {StringBuilder}
 */
const generateTypesStructure = (builder, container) => {
  for (const [key, value] of Object.entries(container))
    if (typeof value === "function") value(builder);
    else
      builder
        .appendLineIdented(`export namespace ${key} {`)
        .append(generateTypesStructure(new StringBuilder(builder.defaultIdent + 1), value).toString())
        .appendLineIdented("}");

  return builder;
};

/**
 * Generates typings for client
 * @param {ImportsCatalog} importsCatalog Imports catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateTypings = (importsCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  builder.appendLineIdented('import { ServerCredentials } from "grpc";').appendLine();

  const root = {};
  importsCatalog.importedFiles.forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    const packageName = fileDescriptor.getPackage();
    const fileBaseName = path.basename(fileName, path.extname(fileName));
    const namespaceName = packageName.length > 0 ? `${packageName}.${fileBaseName}` : fileBaseName;

    builder.appendLine(`import * as ${requiresGenerator.getNamespace(fileName)} from "${requiresGenerator.getRequirePath(fileName)}";`);
    set(root, namespaceName, builder => generateTypingsForMessages(builder, fileDescriptor));
  });
  fileDescriptor.getServiceList().forEach(serviceDescriptor => {
    const clientFullName = getClientFullName(fileDescriptor.getPackage(), `${serviceDescriptor.getName()}Client`);
    set(root, clientFullName, builder => generateTypingsForServices(builder, serviceDescriptor, importsCatalog));
  });

  return generateTypesStructure(builder.appendLine(), root).toString();
};

module.exports = { generateJs, generateTypings };