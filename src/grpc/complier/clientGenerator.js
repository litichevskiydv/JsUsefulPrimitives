const { FileDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

/**
 * Generates JavaScript code for client
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = fileDescriptor => {
  return "abc";
};

/**
 * Generates typings for client
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateTypings = fileDescriptor => {
  return "abc";
};

module.exports = { generateJs, generateTypings };
