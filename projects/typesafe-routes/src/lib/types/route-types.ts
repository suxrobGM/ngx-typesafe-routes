/**
 * Extracts parameter names from a single path segment.
 * E.g., ":id" -> "id", "users" -> never
 */
export type ExtractParamFromSegment<S extends string> = S extends `:${infer Param}` ? Param : never;

/**
 * Extracts all parameter names from a path string.
 * E.g., "users/:userId/posts/:postId" -> "userId" | "postId"
 */
export type ExtractPathParams<Path extends string> = Path extends `${infer Segment}/${infer Rest}`
  ? ExtractParamFromSegment<Segment> | ExtractPathParams<Rest>
  : ExtractParamFromSegment<Path>;

/**
 * Creates a params object type from a path string.
 * E.g., "users/:userId" -> { userId: string }
 */
export type PathParams<Path extends string> =
  ExtractPathParams<Path> extends never ? {} : { [K in ExtractPathParams<Path>]: string };

/**
 * Checks if a path has parameters.
 */
export type HasParams<Path extends string> = ExtractPathParams<Path> extends never ? false : true;

/** Joins two path segments. */
export type JoinPath<A extends string, B extends string> = A extends ""
  ? B
  : B extends ""
    ? A
    : `${A}/${B}`;

/** Standard query param value types. */
export type QueryParamValue = string | number | boolean | string[] | null | undefined;
