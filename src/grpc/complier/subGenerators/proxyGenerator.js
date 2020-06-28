const camelCase = require("camelcase");
const { ServiceDescriptorProto } = require("google-protobuf/google/protobuf/descriptor_pb");

const StringBuilder = require("../stringBuilder");

/**
 * @param {StringBuilder} builder String builder
 * @returns {StringBuilder}
 */
const generateArgumentsChecks = (builder) =>
  builder
    .appendLineIdented("const meta = metadata === undefined || metadata === null ? new Metadata() : metadata;")
    .appendLineIdented("const opts = options === undefined || options === null ? {} : options;");

/**
 * @param {StringBuilder} builder String builder
 * @returns {StringBuilder}
 */
const generateErrorEnhancement = (builder) =>
  builder
    .appendLineIdented('const details = err.metadata.get("details-bin");')
    .appendLineIdented("if (Array.isArray(details) === true && details.length > 0) {")
    .appendLineIdented('err.metadata.remove("details-bin");', 1)
    .appendLineIdented("err.details = details.map(detail => JSON.parse(detail.toString()));", 1)
    .appendLineIdented("}");

/**
 * @param {StringBuilder} builder String builder
 * @returns {StringBuilder}
 */
const generateErrorHandlingForServerUnaryCalls = (builder) =>
  builder
    .appendLineIdented("if (err) {")
    .appendLine(generateErrorEnhancement(new StringBuilder(builder.defaultIdent + 1)))
    .appendLineIdented("reject(err);", 1)
    .appendIdented("}");

/**
 * @param {StringBuilder} builder String builder
 * @returns {StringBuilder}
 */
const generateErrorHandlingForServerStreamingCalls = (builder) =>
  builder
    .appendLine(".pipe(")
    .appendLineIdented("catchError(err => {", 1)
    .appendLine(generateErrorEnhancement(new StringBuilder(builder.defaultIdent + 2)))
    .appendLineIdented("throw err;", 2)
    .appendLineIdented("})", 1)
    .appendIdented(")");

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
      builder
        .appendLineIdented(`${methodName}(messages, metadata, options) {`, 1)
        .appendLine(generateArgumentsChecks(new StringBuilder(builder.defaultIdent + 2)))
        .appendLineIdented(`const call = this._client.${methodName}(meta, opts);`, 2)
        .appendLineIdented("const proxy = new Subject();", 2)
        .appendLineIdented("streamToRx(call)", 2)
        .appendLineIdented(generateErrorHandlingForServerStreamingCalls(new StringBuilder(builder.defaultIdent + 3)), 3)
        .appendLineIdented(".subscribe({", 3)
        .appendLineIdented("next: message => proxy.next(message),", 4)
        .appendLineIdented("error: err => proxy.error(err),", 4)
        .appendLineIdented("complete: () => proxy.complete()", 4)
        .appendLineIdented("});", 3)
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
      builder
        .appendLineIdented(`async ${methodName}(messages, metadata, options) {`, 1)
        .appendLine(generateArgumentsChecks(new StringBuilder(builder.defaultIdent + 2)))
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`const call = this._client.${methodName}(meta, opts, (err, response) => {`, 3)
        .append(generateErrorHandlingForServerUnaryCalls(new StringBuilder(builder.defaultIdent + 4)))
        .appendLine(" else resolve(response);")
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
      builder
        .appendLineIdented(`${methodName}(message, metadata, options) {`, 1)
        .appendLine(generateArgumentsChecks(new StringBuilder(builder.defaultIdent + 2)))
        .appendIdented(`return streamToRx(this._client.${methodName}(message, meta, opts))`, 2)
        .append(generateErrorHandlingForServerStreamingCalls(new StringBuilder(builder.defaultIdent + 2)))
        .appendLine(";")
        .appendLineIdented("}", 1);
    else
      builder
        .appendLineIdented(`async ${methodName}(message, metadata, options) {`, 1)
        .appendLine(generateArgumentsChecks(new StringBuilder(builder.defaultIdent + 2)))
        .appendLineIdented("return await new Promise((resolve, reject) => {", 2)
        .appendLineIdented(`this._client.${methodName}(message, meta, opts, (err, response) => {`, 3)
        .append(generateErrorHandlingForServerUnaryCalls(new StringBuilder(builder.defaultIdent + 4)))
        .appendLine(" else resolve(response);")
        .appendLineIdented("});", 3)
        .appendLineIdented("});", 2)
        .appendLineIdented("}", 1);
  });

  return builder.appendLineIdented("},");
};

module.exports = { generate };
