const { Server, ServerCredentials } = require("grpc");

module.exports = class GrpcServerBuilder {
  constructor() {
    this._interceptors = [];
    this._server = new Server();
  }

  /**
   * Adds new interceptor to pipeline.
   * @param {interceptorFunction} interceptor New interceptor.
   */
  useInterceptor(interceptor) {
    this._interceptors.push(interceptor);
    return this;
  }

  /**
   * Adds implementation of a new service.
   * @param {*} definition Definition of the service.
   * @param {*} implementation Implementation of the service.
   */
  addService(definition, implementation) {
    for (const methodName in definition) {
      const methodDefinition = definition[methodName];

      let methodType;
      if (methodDefinition.requestStream) {
        if (methodDefinition.responseStream) methodType = "bidi";
        else methodType = "client_stream";
      } else {
        if (methodDefinition.responseStream) methodType = "server_stream";
        else methodType = "unary";
      }

      let methodImplementation = implementation[methodName];
      if (methodImplementation === undefined) methodImplementation = implementation[methodDefinition.originalName];
      methodImplementation = methodImplementation.bind(implementation);
      for (let i = this._interceptors.length - 1; i > -1; i--) {
        const next = methodImplementation;
        methodImplementation = async (call, callback) => await this._interceptors[i](call, methodDefinition, callback, next);
      }

      this._server.register(
        methodDefinition.path,
        methodImplementation,
        methodDefinition.responseSerialize,
        methodDefinition.requestDeserialize,
        methodType
      );
    }

    return this;
  }

  /**
   * Binds server to endpoint.
   * @param {string} address Binded address.
   * @param {number} port Binded port.
   * @param {ServerCredentials} [credentials = ServerCredentials.createInsecure()] Server credentials
   */
  bind(address, port, credentials = ServerCredentials.createInsecure()) {
    this._server.bind(`${address}:${port}`, credentials);
    return this;
  }

  /**
   * Builds the server.
   */
  build() {
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
