const camelCase = require("camelcase");
const { ServiceDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const StringBuilder = require("../stringBuilder");

/**
 * Generates client proxy for given service
 * @param {StringBuilder} builder String builder
 * @param {ServiceDescriptorProto} serviceDescriptor Service descriptor
 * @returns {StringBuilder}
 */
const generate = (builder, serviceDescriptor) => {
  const clientName = `${serviceDescriptor.getName()}Client`;

  builder
    .appendLineIdented(`${clientName}: class ${clientName} {`)
    .appendLineIdented("constructor(address, credentials, options) {", 1)
    .appendLineIdented(`this._client = new ${clientName}Raw(address, credentials, options);`, 2)
    .appendLineIdented("}", 1)
    .appendLineIdented("close() {", 1)
    .appendLineIdented("this._client.close();", 2)
    .appendLineIdented("}", 1);

  serviceDescriptor.getMethodList().forEach(method => {
    const methodName = camelCase(method.getName());
    if (method.getClientStreaming() === true && method.getServerStreaming() === true)
      builder
        .appendLineIdented(`async *${methodName}(messages, metadata, options) {`, 1)
        .appendLineIdented(`const channel = this._client.${methodName}();`, 2)
        .appendLineIdented("for (const message of messages) yield await channel.sendMessage(message);", 2)
        .appendLineIdented("channel.end();", 2)
        .appendLineIdented("}", 1);
    else if (method.getClientStreaming() === true)
      builder
        .appendLineIdented(`async ${methodName}(messages, metadata, options) {`, 1)
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`const stream = this._client.${methodName}(message, metadata, options, (error, response) => {`, 3)
        .appendLineIdented("if (error) reject(error);", 4)
        .appendLineIdented("else resolve(response);", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("messages.subscribe({", 3)
        .appendLineIdented("next(message) {", 4)
        .appendLineIdented("stream.write(message);", 5)
        .appendLineIdented("},", 4)
        .appendLineIdented("error(err) {", 4)
        .appendLineIdented("throw err;", 5)
        .appendLineIdented("},", 4)
        .appendLineIdented("complete() {", 4)
        .appendLineIdented("stream.end();", 5)
        .appendLineIdented("}", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("}", 1);
    else if (method.getServerStreaming() === true)
      builder
        .appendLineIdented(`async ${methodName}(message, metadata, options) {`, 1)
        .appendLineIdented(`return await this._client.${methodName}().sendMessage(message);`, 2)
        .appendLineIdented("}", 1);
    else
      builder
        .appendLineIdented(`async ${methodName}(message, metadata, options) {`, 1)
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`this._client.${methodName}(message, metadata, options, (error, response) => {`, 3)
        .appendLineIdented("if (error) reject(error);", 4)
        .appendLineIdented("else resolve(response);", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("}", 1);
  });

  return builder.appendLineIdented("},");
};

module.exports = { generate };
