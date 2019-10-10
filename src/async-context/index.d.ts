export function obtain(contextName?: string): Map<any, any>;
export function create(contextName?: string): Map<any, any>;

export namespace defaultContext {
  export function get(key: any): any;
  export function set(key: any, value: any): void;
}
