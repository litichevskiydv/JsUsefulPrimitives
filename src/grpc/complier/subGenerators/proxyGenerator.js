const camelCase = require("camelcase");
const { ServiceDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const StringBuilder = require("../stringBuilder");

/**
 * @param {StringBuilder} builder String builder
 * @returns {StringBuilder}
 */
const generateArgumentsChecks = (builder) => {
  return builder
    .appendLineIdented("const meta = metadata === undefined || metadata === null ? new Metadata() : metadata;", 2)
    .appendLineIdented("const opts = options === undefined || options === null ? {} : options;", 2)
    .appendLineIdented("", 2);
};

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

  serviceDescriptor.getMethodList().forEach((method) => {
    const methodName = camelCase(method.getName());
    if (method.getClientStreaming() === true && method.getServerStreaming() === true)
      generateArgumentsChecks(builder.appendLineIdented(`${methodName}(messages, metadata, options) {`, 1))
        .appendLineIdented(`const call = this._client.${methodName}(meta, opts);`, 2)
        .appendLineIdented("const proxy = new Subject();", 2)
        .appendLineIdented("streamToRx(call).subscribe({", 2)
        .appendLineIdented("next: message => proxy.next(message),", 3)
        .appendLineIdented("error: err => proxy.error(err),", 3)
        .appendLineIdented("complete: () => proxy.complete()", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("messages.subscribe({", 2)
        .appendLineIdented("next(message) {", 3)
        .appendLineIdented("call.write(message);", 4)
        .appendLineIdented("},", 3)
        .appendLineIdented("error(err) {", 3)
        .appendLineIdented("call.end();", 4)
        .appendLineIdented("proxy.error(err);", 4)
        .appendLineIdented("},", 3)
        .appendLineIdented("complete() {", 3)
        .appendLineIdented("call.end();", 4)
        .appendLineIdented("}", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("return proxy.asObservable();", 2)
        .appendLineIdented("}", 1);
    else if (method.getClientStreaming() === true)
      generateArgumentsChecks(builder.appendLineIdented(`async ${methodName}(messages, metadata, options) {`, 1))
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`const call = this._client.${methodName}(meta, opts, (err, response) => {`, 3)
        .appendLineIdented("if (err) reject(err);", 4)
        .appendLineIdented("else resolve(response);", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("messages.subscribe({", 3)
        .appendLineIdented("next(message) {", 4)
        .appendLineIdented("call.write(message);", 5)
        .appendLineIdented("},", 4)
        .appendLineIdented("error(err) {", 4)
        .appendLineIdented("call.end();", 5)
        .appendLineIdented("reject(err);", 5)
        .appendLineIdented("},", 4)
        .appendLineIdented("complete() {", 4)
        .appendLineIdented("call.end();", 5)
        .appendLineIdented("}", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("}", 1);
    else if (method.getServerStreaming() === true)
      generateArgumentsChecks(builder.appendLineIdented(`${methodName}(message, metadata, options) {`, 1))
        .appendLineIdented(`return streamToRx(this._client.${methodName}(message, meta, opts));`, 2)
        .appendLineIdented("}", 1);
    else
      generateArgumentsChecks(builder.appendLineIdented(`async ${methodName}(message, metadata, options) {`, 1))
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`this._client.${methodName}(message, meta, opts, (error, response) => {`, 3)
        .appendLineIdented("if (error) reject(error);", 4)
        .appendLineIdented("else resolve(response);", 4)
        .appendLineIdented("});", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("}", 1);
  });

  return builder.appendLineIdented("},");
};

module.exports = { generate };
