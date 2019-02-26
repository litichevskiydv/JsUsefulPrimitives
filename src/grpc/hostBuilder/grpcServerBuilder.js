const { Server, ServerCredentials } = require("grpc");

module.exports = class GrpcServerBuilder {
  /**
   * @param {object} [options] grpc native options https://grpc.io/grpc/cpp/group__grpc__arg__keys.html
   */
  constructor(options) {
    this._index = 0;
    this._interceptorsDefinitions = [];
    this._servicesDefinitions = [];

    this._serverContext = {};
    this._server = new Server(options);
  }

  /**
   * Adds new interceptor to pipeline.
   * @param {interceptorFunction | interceptorConstructor} interceptor New interceptor.
   */
  addInterceptor(interceptor) {
    if (interceptor.prototype && typeof interceptor.prototype.invoke === "function")
      return this.addInterceptor(
        async (call, methodDefinition, callback, next) =>
          await new interceptor(this._serverContext).invoke(call, methodDefinition, callback, next)
      );

    this._interceptorsDefinitions.push({ index: this._index++, interceptor: interceptor });
    return this;
  }

  /**
   * Adds implementation of a new service.
   * @param {*} definition Definition of the service.
   * @param {*} implementation Implementation of the service.
   */
  addService(definition, implementation) {
    this._servicesDefinitions.push({ index: this._index++, definition: definition, implementation: implementation });
    return this;
  }

  /**
   * Binds server to endpoint.
   * @param {string} grpcBind Bind for gRPC server in format "address:port".
   * @param {ServerCredentials} [credentials = ServerCredentials.createInsecure()] Server credentials
   */
  bind(grpcBind, credentials = ServerCredentials.createInsecure()) {
    this._server.bind(grpcBind, credentials);
    return this;
  }

  static _getMethodType(methodDefinition) {
    if (methodDefinition.requestStream) return methodDefinition.responseStream ? "bidi" : "client_stream";
    return methodDefinition.responseStream ? "server_stream" : "unary";
  }

  _getMethodImplementation(serviceIndex, serviceImplementation, methodName, methodDefinition) {
    let methodImplementation = serviceImplementation[methodName];
    if (methodImplementation === undefined) methodImplementation = serviceImplementation[methodDefinition.originalName];
    methodImplementation = methodImplementation.bind(serviceImplementation);

    for (let i = this._interceptorsDefinitions.length - 1; i > -1; i--) {
      const interceptorDefinition = this._interceptorsDefinitions[i];
      if (interceptorDefinition.index > serviceIndex) continue;

      const next = methodImplementation;
      methodImplementation = async (call, callback) => await interceptorDefinition.interceptor(call, methodDefinition, callback, next);
    }

    return methodImplementation;
  }

  _addServices() {
    for (const { index, definition, implementation } of this._servicesDefinitions)
      for (const methodName in definition) {
        const methodDefinition = definition[methodName];
        const methodType = GrpcServerBuilder._getMethodType(methodDefinition);
        const methodImplementation = this._getMethodImplementation(index, implementation, methodName, methodDefinition);

        this._server.register(
          methodDefinition.path,
          methodImplementation,
          methodDefinition.responseSerialize,
          methodDefinition.requestDeserialize,
          methodType
        );
      }
  }

  /**
   * Builds the server.
   */
  build() {
    this._addServices();

    this._server.start();
    return this._server;
  }
};

/**
 * @callback interceptorFunction
 * @param {*} call Server call.
 * @param {*} methodDefinition Metadata for method implementation.
 * @param {*} callback gRPC server callback.
 * @param {*} next Next layers executor.
 * @returns {void}
 */

/**
 * @typedef {Object} Interceptor
 * @property {interceptorFunction} invoke Implementation of the interceptor.
 */

/**
 * @callback interceptorConstructor
 * @param {*} serverContext Context of the gRPC server.
 * @returns {Interceptor}
 */
