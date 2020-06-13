import { Schema } from "protocol-buffers-schema/types";
import { PackageDefinition } from "grpc";

export interface DefinitionLoadingOptions {
  keepCase?: boolean;
  includeDirs?: string[];
}

export namespace scheme {
  export function load(protoFilePath: string, options?: DefinitionLoadingOptions): Promise<Schema>;
  export function loadSync(protoFilePath: string, options?: DefinitionLoadingOptions): Schema;
}

export namespace packageDefinition {
  export function load(protoFilePath: string, options?: DefinitionLoadingOptions): Promise<PackageDefinition>;
  export function loadSync(protoFilePath: string, options?: DefinitionLoadingOptions): PackageDefinition;
}
