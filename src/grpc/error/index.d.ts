import { status, Metadata } from "@grpc/grpc-js";

export interface GrpcErrorOptions {
  statusCode?: status;
  metadata?: Metadata | { [key: string]: string };
  details?: Array<any>;
  innerError?: Error;
}

export class GrpcError extends Error {
  constructor(message: string, options?: GrpcErrorOptions);

  code: status;
  metadata: Metadata;
}
