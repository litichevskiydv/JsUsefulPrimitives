const path = require("path");
const slash = require("slash");
const { set } = require("dot-prop");
const camelCase = require("camelcase");
const { FileDescriptorProto, DescriptorProto, FieldDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const ImportsCatalog = require("./importsCatalog");
const StringBuilder = require("./stringBuilder");
const requiresGenerator = require("./subGenerators/requiresGenerator");
const messagesGenerator = require("./subGenerators/messagesGenerator");
const messagesTypingsGenerator = require("./subGenerators/messagesTypingsGenerator");
const clientOptionsTypingGenerator = require("./subGenerators/clientOptionsTypingGenerator");
const proxyGenerator = require("./subGenerators/proxyGenerator");
const proxyTypingsGenerator = require("./subGenerators/proxyTypingsGenerator");

/**
 * @param {ImportsCatalog} importsCatalog
 * @param {{fileName: string, descriptor: DescriptorProto, fullName: string}} message
 * @param {Set<string>} usedImports
 */
const scanMesage = (importsCatalog, message, usedImports) => {
  usedImports.add(message.fileName);
  const messageDescriptor = message.descriptor;

  for (const field of messageDescriptor.getFieldList().concat(messageDescriptor.getExtensionList())) {
    const type = field.getType();
    const typeName = field.getTypeName();

    if (type === FieldDescriptorProto.Type.TYPE_MESSAGE) scanMesage(importsCatalog, importsCatalog.getMessage(typeName), usedImports);
    else if (type === FieldDescriptorProto.Type.TYPE_ENUM) usedImports.add(importsCatalog.getEnum(typeName).fileName);
  }

  messageDescriptor.getNestedTypeList().forEach(nestedMessage => {
    scanMesage(importsCatalog, importsCatalog.getMessage(`${message.fullName}.${nestedMessage.getName()}`), usedImports);
  });
};

/**
 * @param {ImportsCatalog} importsCatalog
 * @param {FileDescriptorProto} fileDescriptor
 * @returns {Set<string>}
 */
const getUsedImports = (importsCatalog, fileDescriptor) => {
  const usedImports = new Set();

  fileDescriptor.getServiceList().forEach(service =>
    service.getMethodList().forEach(method => {
      scanMesage(importsCatalog, importsCatalog.getMessage(method.getInputType()), usedImports);
      scanMesage(importsCatalog, importsCatalog.getMessage(method.getOutputType()), usedImports);
    })
  );

  return usedImports;
};

/**
 *
 * @param {string} packageName
 * @param {string} clientName
 * @returns {string}
 */
const getClientFullName = (packageName, clientName) => (packageName.length > 0 ? `${packageName}.${clientName}` : clientName);

/**
 * @param {StringBuilder} builder
 * @param {*} container
 * @returns {StringBuilder}
 */
const generateExportsStructure = (builder, container) => {
  for (const [key, value] of Object.entries(container))
    if (typeof value === "function") value(builder);
    else
      builder
        .appendLineIdented(`${key}: {`)
        .append(generateExportsStructure(new StringBuilder(builder.defaultIdent + 1), value).toString())
        .appendLineIdented("},");

  return builder;
};

/**
 * Generates JavaScript code for client
 * @param {ImportsCatalog} importsCatalog Imports catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = (importsCatalog, fileDescriptor) => {
  const builder = new StringBuilder();

  const root = {};
  const usedImports = getUsedImports(importsCatalog, fileDescriptor);

  importsCatalog.importedFiles.forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    if (usedImports.has(fileName) === false) return;

    const packageName = fileDescriptor.getPackage();
    const fileBaseName = path.basename(fileName, path.extname(fileName));
    const namespaceName = packageName.length > 0 ? `${packageName}.${fileBaseName}` : fileBaseName;

    builder.appendLine(`const ${requiresGenerator.getNamespace(fileName)} = require("${requiresGenerator.getRequirePath(fileName)}");`);
    set(root, namespaceName, builder => messagesGenerator.generate(builder, fileDescriptor));
  });

  const requirePath = requiresGenerator.getRequirePath(fileDescriptor.getName(), "grpc_pb");
  const clientsList = fileDescriptor.getServiceList().map(x => `${x.getName()}Client: ${x.getName()}ClientRaw`);
  builder.appendLine(`const { ${clientsList.join(", ")} } = require("${requirePath}");`).appendLine();

  fileDescriptor.getServiceList().forEach(serviceDescriptor => {
    const clientFullName = getClientFullName(fileDescriptor.getPackage(), `${serviceDescriptor.getName()}Client`);
    set(root, clientFullName, builder => proxyGenerator.generate(builder, serviceDescriptor, importsCatalog));
  });

  return builder
    .appendLine("module.exports = {")
    .append(generateExportsStructure(new StringBuilder(builder.defaultIdent + 1), root))
    .appendLine("};")
    .toString();
};

/**
 * @param {FileDescriptorProto} fileDescriptor
 * @returns {boolean}
 */
const isRxJsNeeded = fileDescriptor =>
  fileDescriptor
    .getServiceList()
    .some(serviceDescriptor =>
      serviceDescriptor.getMethodList().some(method => method.getClientStreaming() === true || method.getServerStreaming() === true)
    );

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

  if (isRxJsNeeded(fileDescriptor)) builder.appendLine('import { Subscribable } from "rxjs";');
  builder.appendLine('import { ChannelCredentials, Metadata, CallOptions, InterceptingCall, MethodDefinition } from "grpc";').appendLine();

  const root = {};
  const usedImports = getUsedImports(importsCatalog, fileDescriptor);
  importsCatalog.importedFiles.forEach(fileDescriptor => {
    const fileName = fileDescriptor.getName();
    if (usedImports.has(fileName) === false) return;

    const packageName = fileDescriptor.getPackage();
    const fileBaseName = path.basename(fileName, path.extname(fileName));
    const namespaceName = packageName.length > 0 ? `${packageName}.${fileBaseName}` : fileBaseName;

    builder.appendLine(`import * as ${requiresGenerator.getNamespace(fileName)} from "${requiresGenerator.getRequirePath(fileName)}";`);
    set(root, namespaceName, builder => messagesTypingsGenerator.generate(builder, fileDescriptor));
  });
  fileDescriptor.getServiceList().forEach(serviceDescriptor => {
    const clientFullName = getClientFullName(fileDescriptor.getPackage(), `${serviceDescriptor.getName()}Client`);
    set(root, clientFullName, builder => proxyTypingsGenerator.generate(builder, serviceDescriptor, importsCatalog));
  });

  clientOptionsTypingGenerator.generate(builder.appendLine());
  return generateTypesStructure(builder.appendLine(), root).toString();
};

module.exports = { generateJs, generateTypings };
