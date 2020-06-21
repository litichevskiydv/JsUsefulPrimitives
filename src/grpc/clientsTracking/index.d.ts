import {
  MethodDefinition,
  InterceptingCall,
  ServerUnaryCall,
  ServerWritableStream,
  ServerReadableStream,
  ServerDuplexStream,
} from "@grpc/grpc-js";

interface ClientInterceptorsFactoryOptions {
  consumerName?: string;
  consumerVersion?: string;
  clientVersion?: string;
}

interface ClientInterceptorOptions {
  method_definition: MethodDefinition<any, any>;
}

export function clientInterceptorsFactory(
  options?: ClientInterceptorsFactoryOptions
): (options: ClientInterceptorOptions, nextCall: Function) => InterceptingCall;

export function serverInterceptor(
  call: ServerUnaryCall<any> | ServerWritableStream<any> | ServerReadableStream<any> | ServerDuplexStream<any, any>,
  methodDefinition: MethodDefinition<any, any>,
  next: Function
): Promise<any>;
