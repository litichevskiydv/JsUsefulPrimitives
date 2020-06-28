import { status, Metadata, StatusObject } from "@grpc/grpc-js";

export interface GrpcErrorOptions {
  statusCode?: status;
  details?: string;
  metadata?: Metadata | { [key: string]: string };
  innerError?: Error;
}

export class GrpcError extends Error implements StatusObject {
  constructor(message: string, options?: GrpcErrorOptions);

  code: status;
  details: string;
  metadata: Metadata;
}
