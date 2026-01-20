/**
 * Core type utilities for extracting type information from Angular Routes.
 * These types work with standard Angular route definitions using `as const`.
 */
import type { ResolveFn, Route } from "@angular/router";

// =============================================================================
// Path Parameter Extraction
// =============================================================================

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
 * Checks if a path has parameters
 */
export type HasParams<Path extends string> = ExtractPathParams<Path> extends never ? false : true;

// =============================================================================
// Route Tree Type Extraction
// =============================================================================

/**
 * Represents a typed route definition (extends Angular"s Route)
 */
export interface TypedRoute<
  TPath extends string = string,
  TData extends object = object,
  TQueryParams extends Record<string, string> = Record<string, string>,
> extends Route {
  path?: TPath;
  data?: TData;
  queryParams?: TQueryParams;
  children?: TypedRoutes;
}

/**
 * Array of typed routes
 */
export type TypedRoutes = ReadonlyArray<TypedRoute>;

/**
 * Extracts a route from routes array by path
 */
export type FindRouteByPath<
  TRoutes extends TypedRoutes,
  TPath extends string,
> = TRoutes extends readonly [infer First extends TypedRoute, ...infer Rest extends TypedRoutes]
  ? First["path"] extends TPath
    ? First
    : FindRouteByPath<Rest, TPath>
  : never;

/**
 * Gets all top-level paths from routes
 */
export type GetRoutePaths<TRoutes extends TypedRoutes> = TRoutes extends readonly [
  infer First extends TypedRoute,
  ...infer Rest extends TypedRoutes,
]
  ? (First["path"] extends string ? First["path"] : never) | GetRoutePaths<Rest>
  : never;

/**
 * Recursively builds all possible route paths including children
 */
export type BuildRoutePaths<
  TRoutes extends TypedRoutes,
  Prefix extends string = "",
> = TRoutes extends readonly [infer First extends TypedRoute, ...infer Rest extends TypedRoutes]
  ? First["path"] extends string
    ? First["children"] extends TypedRoutes
      ?
          | JoinPath<Prefix, First["path"]>
          | BuildRoutePaths<First["children"], JoinPath<Prefix, First["path"]>>
          | BuildRoutePaths<Rest, Prefix>
      : JoinPath<Prefix, First["path"]> | BuildRoutePaths<Rest, Prefix>
    : BuildRoutePaths<Rest, Prefix>
  : never;

/**
 * Joins two path segments
 */
export type JoinPath<A extends string, B extends string> = A extends ""
  ? B
  : B extends ""
    ? A
    : `${A}/${B}`;

/**
 * Normalizes path by removing leading/trailing slashes
 */
export type NormalizePath<T extends string> = T extends `/${infer Rest}`
  ? NormalizePath<Rest>
  : T extends `${infer Rest}/`
    ? NormalizePath<Rest>
    : T;

// =============================================================================
// Route Data & Resolve Types
// =============================================================================

/**
 * Extracts the resolved data type from a route"s resolve config
 */
export type ExtractResolveData<TResolve> =
  TResolve extends Record<string, ResolveFn<infer R> | unknown>
    ? { [K in keyof TResolve]: TResolve[K] extends ResolveFn<infer R> ? R : unknown }
    : {};

/**
 * Combined route data (static data + resolved data)
 */
export type RouteData<TRoute extends TypedRoute> = (TRoute["data"] extends object
  ? TRoute["data"]
  : {}) &
  (TRoute["resolve"] extends object ? ExtractResolveData<TRoute["resolve"]> : {});

// =============================================================================
// Signal Input Types (Angular 16+)
// =============================================================================

/**
 * Creates input signal types for route params
 * Used with `withComponentInputBinding()` router feature
 */
export type RouteInputs<Path extends string> = {
  [K in ExtractPathParams<Path>]: () => string;
};

/**
 * Creates required input types for route params
 */
export type RequiredRouteInputs<Path extends string> = {
  [K in ExtractPathParams<Path>]: { required: true };
};

// =============================================================================
// Query Parameter Types
// =============================================================================

/**
 * Standard query param value types
 */
export type QueryParamValue = string | number | boolean | string[] | null | undefined;

/**
 * Query params object
 */
export type QueryParams<
  T extends Record<string, QueryParamValue> = Record<string, QueryParamValue>,
> = T;
