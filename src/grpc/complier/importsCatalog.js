const { FileDescriptorProto, DescriptorProto, EnumDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

module.exports = class ImportsCatalog {
  constructor() {
    /**  @type {Array<FileDescriptorProto>} */
    this.importedFiles = [];
    /**  @type {{ [fullName: string]: MessageInfo }} */
    this._messagesByFullNames = {};
    /**  @type {{ [fullName: string]: EnumInfo }} */
    this._enumsByFullNames = {};
  }

  /**
   * @param {string} fullName
   * @returns {string}
   */
  _prepareTypeFullName(fullName) {
    return fullName.startsWith(".") ? fullName : `.${fullName}`;
  }

  /**
   * @param {string} packageName
   * @param {string} fullName
   * @returns {string}
   */
  _prepareTypeName(packageName, fullName) {
    return fullName.replace(packageName, "");
  }

  /**
   * Adds message to catalog
   * @param {FileDescriptorProto} fileDescriptor Proto file descriptor
   * @param {string} namespace Message namespace
   * @param {DescriptorProto} messageDescriptor Message descriptor
   */
  _addMessage(fileDescriptor, namespace, messageDescriptor) {
    const fullName = `${namespace}.${messageDescriptor.getName()}`;

    this._messagesByFullNames[this._prepareTypeFullName(fullName)] = {
      fileName: fileDescriptor.getName(),
      name: this._prepareTypeName(fileDescriptor.getPackage(), fullName),
      descriptor: messageDescriptor
    };

    this._addEnums(fileDescriptor, fullName, messageDescriptor.getEnumTypeList());
    messageDescriptor.getNestedTypeList().forEach(x => this._addMessage(fileDescriptor, fullName, x));
  }

  /**
   * Adds enums to catalog
   * @param {FileDescriptorProto} fileDescriptor Proto file descriptor
   * @param {string} namespace Enums namespace
   * @param {Array<EnumDescriptorProto>} enumsDescriptors Enums descriptors
   */
  _addEnums(fileDescriptor, namespace, enumsDescriptors) {
    enumsDescriptors.forEach(enumDescriptor => {
      const fullName = `${namespace}.${enumDescriptor.getName()}`;

      this._enumsByFullNames[this._prepareTypeFullName(fullName)] = {
        fileName: fileDescriptor.getName(),
        name: this._prepareTypeName(fileDescriptor.getPackage(), fullName),
        descriptor: enumDescriptor
      };
    });
  }

  /**
   * Accumulates information from proto file descriptor
   * @param {FileDescriptorProto} fileDescriptor Descriptor for proto file
   */
  processFileDescriptor(fileDescriptor) {
    this.importedFiles.push(fileDescriptor);
    this._addEnums(fileDescriptor, fileDescriptor.getPackage(), fileDescriptor.getEnumTypeList());
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
 * @property {DescriptorProto} descriptor Message descriptor
 */

/**
 * @typedef {Object} EnumInfo
 * @property {string} fileName Name of the file where enum was declared
 * @property {string} name Name of the enum
 * @property {EnumDescriptorProto} descriptor Enum descriptor
 */
