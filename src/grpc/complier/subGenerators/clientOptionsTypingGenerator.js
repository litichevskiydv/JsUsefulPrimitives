const StringBuilder = require("../stringBuilder");

/**
 * Generates typings for client options
 * @param {StringBuilder} builder
 */
const generate = builder =>
  builder
    .appendLine("type NextCall = (options: CallOptions) => InterceptingCall;")
    .appendLine("type Interceptor = (options: CallOptions, nextCall: NextCall) => InterceptingCall;")
    .appendLine("type InterceptorProvider = (methodDefinition: MethodDefinition<any, any>) => Interceptor | null;")
    .appendLine("export interface ClientlOptions {")
    .appendLineIdented("interceptors?: Array<Interceptor>;", 1)
    .appendLineIdented("interceptor_providers?: Array<InterceptorProvider>;", 1)
    .appendLineIdented("[key: string]: any;", 1)
    .appendLine("};");

module.exports = { generate };
