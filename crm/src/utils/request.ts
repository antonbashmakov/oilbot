// types/utils.ts

// Extract all path keys that support PATCH
export type PathsWithMethod<P, M extends string> = {
  [K in keyof P]: P[K] extends { [key in M]: any } ? K : never;
}[keyof P];

// Extract path parameters for a given path and method
export type PathParameters<P, K extends keyof P, M extends string> =
  P[K] extends { [key in M]: { parameters: { path: infer Params } } }
    ? Params extends Record<string, any>
      ? Params
      : never
    : never;

// Extract request body type for a given path and method
export type RequestBody<P, K extends keyof P, M extends string> =
  P[K] extends { [key in M]: { requestBody: { content: { 'application/json': infer Body } } } }
    ? Body
    : never;

// Extract response type for a given path and method (optional)
export type ResponseType<P, K extends keyof P, M extends string> =
  P[K] extends { [key in M]: { responses: { 200: { content: { 'application/json': infer Resp } } } } }
    ? Resp
    : unknown;