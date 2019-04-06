const { FileDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const StringBuilder = require("../stringBuilder");
const requiresGenerator = require("./requiresGenerator");

/**
 * Generates typings for proto file top level messages and enums
 * @param {StringBuilder} builder String builder
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generate = (builder, fileDescriptor) => {
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

module.exports = { generate };
