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
    .appendLineIdented(`class ${clientName} {`)
    .appendLineIdented("constructor(address, credentials) {", 1)
    .appendLineIdented(`this._client = new ${clientName}Raw(address, credentials);`, 2)
    .appendLineIdented("grpcPromise.promisifyAll(this._client);", 2)
    .appendLineIdented("}", 1);

  serviceDescriptor.getMethodList().forEach(method => {
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

  return builder.appendLineIdented("};");
};

module.exports = { generate };
