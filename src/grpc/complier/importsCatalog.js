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
    const typeFullName = this._prepareTypeFullName(fullName);

    this._messagesByFullNames[typeFullName] = {
      fileName: fileDescriptor.getName(),
      descriptor: messageDescriptor,
      fullName: typeFullName,
      name: this._prepareTypeName(fileDescriptor.getPackage(), fullName)
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
      const typeFullName = this._prepareTypeFullName(fullName);

      this._enumsByFullNames[typeFullName] = {
        fileName: fileDescriptor.getName(),
        descriptor: enumDescriptor,
        fullName: typeFullName,
        name: this._prepareTypeName(fileDescriptor.getPackage(), fullName)
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

  /**
   * Gets enum information by full name
   * @param {string} fullName
   * @returns {EnumInfo}
   */
  getEnum(fullName) {
    return this._enumsByFullNames[fullName];
  }
};

/**
 * @typedef {Object} MessageInfo
 * @property {string} fileName Name of the file where message was declared
 * @property {DescriptorProto} descriptor Message descriptor
 * @property {string} name Name of the message
 * @property {string} fullName Full name of the mesage
 */

/**
 * @typedef {Object} EnumInfo
 * @property {string} fileName Name of the file where enum was declared
 * @property {EnumDescriptorProto} descriptor Enum descriptor
 * @property {string} name Name of the enum
 * @property {string} fullName Full name of the enum
 */
