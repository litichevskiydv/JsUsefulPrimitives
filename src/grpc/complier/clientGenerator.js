const { FileDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const MessagesCatalog = require("./messagesCatalog");

/**
 * Generates JavaScript code for client
 * @param {MessagesCatalog} messagesCatalog Messages catalog
 * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
 */
const generateJs = (messagesCatalog, fileDescriptor) => {
  return JSON.stringify(messagesCatalog);
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
