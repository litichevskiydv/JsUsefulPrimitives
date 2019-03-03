import {
  ServiceDefinition,
  MethodDefinition,
  ServerUnaryCall,
  ServerReadableStream,
  ServerWriteableStream,
  ServerDuplexStream,
  UntypedServiceImplementation,
  ServiceError,
  Metadata,
  ServerCredentials,
  Server
} from "grpc";

declare class GrpcServerBuilder {
  /**
   * @param {object} [options] grpc native options https://grpc.io/grpc/cpp/group__grpc__arg__keys.html
   */
  constructor(options?: object);

  /**
   * Changes default loggers factory
   * @param createLogger Factory method for loggers creation.
   */
  useLoggersFactory(loggersFactory: (options?: object) => Logging.ILogger): GrpcServerBuilder;

  /**
   * Adds new interceptor to pipeline.
   * @param interceptor New interceptor.
   */
  addInterceptor(
    /**
     * @param call Server call.
     * @param methodDefinition Metadata for method implementation.
     * @param callback gRPC server callback.
     * @param next Next layers executor.
     */
    interceptor: (
      call: ServiceCall,
      methodDefinition: MethodDefinition<any, any>,
      callback: sendUnaryData | null,
      next: handleServiceCall
    ) => Promise<void>
  ): GrpcServerBuilder;
  /**
   * Adds new interceptor to pipeline.
   * @param interceptor Constructor for new interceptor.
   */
  addInterceptor(interceporConstructor: new (serverContext: ServerContext) => IInterceptor): GrpcServerBuilder;

  /**
   * Adds implementation of a new service.
   * @param definition Definition of the service.
   * @param implementation Implementation of the service.
   */
  addService<ImplementationType = UntypedServiceImplementation>(
    definition: ServiceDefinition<ImplementationType>,
    implementation: ImplementationType
  ): GrpcServerBuilder;

  /**
   * Binds server to endpoint.
   * @param grpcBind Bind for gRPC server in format "address:port".
   * @param [credentials = ServerCredentials.createInsecure()] Server credentials
   */
  bind(grpcBind: string, credentials?: ServerCredentials): GrpcServerBuilder;

  /**
   * Builds the server.
   */
  build(): Server;
}

export = GrpcServerBuilder;

type ServerContext = { createLogger: (options?: object) => Logging.ILogger };

type ServiceCall = ServerUnaryCall<any> | ServerReadableStream<any> | ServerWriteableStream<any> | ServerDuplexStream<any, any>;
type sendUnaryData = (error: ServiceError | null, value: any | null, trailer?: Metadata, flags?: number) => void;

type handleServiceCall = handleUnaryCall | handleClientStreamingCall | handleServerStreamingCall | handleBidiStreamingCall;
type handleUnaryCall = (call: ServerUnaryCall<any>, callback: sendUnaryData) => Promise<void>;
type handleClientStreamingCall = (call: ServerReadableStream<any>, callback: sendUnaryData) => Promise<void>;
type handleServerStreamingCall = (call: ServerWriteableStream<any>) => Promise<void>;
type handleBidiStreamingCall = (call: ServerDuplexStream<any, any>) => Promise<void>;

interface IInterceptor {
  /**
   * Interceptor implementation.
   * @param call Server call.
   * @param methodDefinition Metadata for method implementation.
   * @param callback gRPC server callback.
   * @param next Next layers executor.
   */
  invoke(
    call: ServiceCall,
    methodDefinition: MethodDefinition<any, any>,
    callback: sendUnaryData | null,
    next: handleServiceCall
  ): Promise<void>;
}

declare namespace Logging {
  interface ILogger {
    fatal(message: string, payload?: object): void;
    error(message: string, payload?: object): void;
    warn(message: string, payload?: object): void;
    info(message: string, payload?: object): void;
    debug(message: string, payload?: object): void;
  }
}
