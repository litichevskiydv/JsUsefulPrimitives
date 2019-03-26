const { FileDescriptorProto, DescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

module.exports = class FilesCatalog {
  constructor() {
    this._messagesByFullNames = {};
  }

  /**
   * Adds message to catalog
   * @param {FileDescriptorProto} fileDescriptor Proto file descriptor
   * @param {string} namespace Message namespace
   * @param {DescriptorProto} messageDescriptor Message descriptor
   */
  _addMessage(fileDescriptor, namespace, messageDescriptor) {
    const fullName = `${namespace}.${messageDescriptor.getName()}`;
    this._messagesByFullNames[fullName.startsWith(".") ? fullName : `.${fullName}`] = {
      fileName: fileDescriptor.getName(),
      name: fullName.replace(fileDescriptor.getPackage(), "")
    };

    messageDescriptor.getNestedTypeList().forEach(x => this._addMessage(fileDescriptor, fullName, x));
  }

  /**
   * Accumulates information from proto file descriptor
   * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
   */
  processFileDescriptor(fileDescriptor) {
    fileDescriptor.getMessageTypeList().forEach(x => this._addMessage(fileDescriptor, fileDescriptor.getPackage(), x));
  }

  /**
   * Gets message information by full name
   * @param {string} fullName
   * @returns {MessageInfo}
   */
  getMessage(fullName) {
    return this._messagesByFullNames[fullName];
  }
};

/**
 * @typedef {Object} MessageInfo
 * @property {string} fileName Name of the file where message was declared
 * @property {string} name Name of the message
 */
