/**
 * Route Registry
 *
 * Provides a way to register Angular routes and extract type information
 * while maintaining 100% compatibility with standard Angular routing.
 *
 * Usage:
 * ```typescript
 * // Define routes as normal Angular routes with `as const`
 * export const routes = [
 *   { path: '', component: HomeComponent },
 *   { path: 'users', component: UsersComponent },
 *   { path: 'users/:userId', component: UserDetailComponent },
 *   {
 *     path: 'products/:categoryId',
 *     children: [
 *       { path: ':productId', component: ProductComponent }
 *     ]
 *   }
 * ] as const satisfies Routes;
 *
 * // Create typed router
 * export const AppRouter = createTypedRouter(routes);
 * ```
 */
import type { Route, Routes } from "@angular/router";
import type { HasParams, JoinPath, PathParams, QueryParamValue } from "./route-types";

// =============================================================================
// Route Path Builder Types
// =============================================================================

/**
 * Recursively extracts all valid route paths from a routes configuration
 */
type ExtractAllPaths<
  TRoutes extends ReadonlyArray<Route>,
  Prefix extends string = "",
> = TRoutes extends readonly [infer First extends Route, ...infer Rest extends ReadonlyArray<Route>]
  ?
      | (First extends { path: infer P extends string }
          ? First extends { children: infer C extends ReadonlyArray<Route> }
            ?
                | (P extends "" ? (Prefix extends "" ? never : Prefix) : JoinPath<Prefix, P>)
                | ExtractAllPaths<C, P extends "" ? Prefix : JoinPath<Prefix, P>>
            : P extends ""
              ? Prefix extends ""
                ? ""
                : Prefix
              : JoinPath<Prefix, P>
          : never)
      | ExtractAllPaths<Rest, Prefix>
  : never;

/**
 * Gets the full path for a route, including parent paths
 */
type GetFullPath<
  TRoutes extends ReadonlyArray<Route>,
  TargetPath extends string,
  Prefix extends string = "",
> = TRoutes extends readonly [infer First extends Route, ...infer Rest extends ReadonlyArray<Route>]
  ? First extends { path: infer P extends string }
    ? First extends { children: infer C extends ReadonlyArray<Route> }
      ? TargetPath extends P
        ? JoinPath<Prefix, P>
        : GetFullPath<C, TargetPath, JoinPath<Prefix, P>> | GetFullPath<Rest, TargetPath, Prefix>
      : TargetPath extends P
        ? JoinPath<Prefix, P>
        : GetFullPath<Rest, TargetPath, Prefix>
    : GetFullPath<Rest, TargetPath, Prefix>
  : never;

/**
 * Finds a route definition by its path
 */
type FindRoute<
  TRoutes extends ReadonlyArray<Route>,
  TargetPath extends string,
> = TRoutes extends readonly [infer First extends Route, ...infer Rest extends ReadonlyArray<Route>]
  ? First extends { path: infer P extends string }
    ? TargetPath extends P
      ? First
      : First extends { children: infer C extends ReadonlyArray<Route> }
        ? FindRoute<C, TargetPath> extends never
          ? FindRoute<Rest, TargetPath>
          : FindRoute<C, TargetPath>
        : FindRoute<Rest, TargetPath>
    : FindRoute<Rest, TargetPath>
  : never;

// =============================================================================
// Navigation Options Types
// =============================================================================

/**
 * Navigation extras matching Angular's NavigationExtras
 */
export interface TypedNavigationExtras {
  relativeTo?: unknown;
  queryParams?: Record<string, QueryParamValue>;
  fragment?: string;
  queryParamsHandling?: "merge" | "preserve" | "";
  preserveFragment?: boolean;
  onSameUrlNavigation?: "reload" | "ignore";
  skipLocationChange?: boolean;
  replaceUrl?: boolean;
  state?: Record<string, unknown>;
  info?: unknown;
}

/**
 * Navigation options based on whether path has params
 */
export type NavigateOptions<Path extends string> =
  HasParams<Path> extends true
    ? {
        params: PathParams<Path>;
        queryParams?: Record<string, QueryParamValue>;
        extras?: Omit<TypedNavigationExtras, "queryParams">;
      }
    : {
        params?: never;
        queryParams?: Record<string, QueryParamValue>;
        extras?: Omit<TypedNavigationExtras, "queryParams">;
      };

/**
 * Simplified options for paths without params
 */
export type SimpleNavigateOptions = {
  queryParams?: Record<string, QueryParamValue>;
  extras?: Omit<TypedNavigationExtras, "queryParams">;
};

// =============================================================================
// Route Registry Interface
// =============================================================================

/**
 * Route path map - maps route identifiers to their full paths
 */
export type RoutePathMap<TRoutes extends ReadonlyArray<Route>> = {
  [K in ExtractAllPaths<TRoutes>]: K;
};

/**
 * Gets params type for a specific path
 */
export type ParamsFor<Path extends string> = PathParams<Path>;

/**
 * Registration result that provides type information
 */
export interface RouteRegistry<TRoutes extends ReadonlyArray<Route>> {
  /**
   * The original routes array (pass to provideRouter)
   */
  readonly routes: TRoutes;

  /**
   * All valid paths in the route configuration
   */
  readonly paths: RoutePathMap<TRoutes>;

  /**
   * Type helper to get params for a path (compile-time only)
   */
  readonly _params: <P extends ExtractAllPaths<TRoutes>>(path: P) => PathParams<P>;
}

// =============================================================================
// Route Registration
// =============================================================================

/**
 * Registers routes and extracts type information.
 * Use this to wrap your routes array for type-safe navigation.
 *
 * @example
 * ```typescript
 * const routes = [
 *   { path: '', component: HomeComponent },
 *   { path: 'users/:userId', component: UserComponent },
 * ] as const satisfies Routes;
 *
 * export const appRoutes = registerRoutes(routes);
 *
 * // In app.config.ts
 * provideRouter(appRoutes.routes)
 * ```
 */
export function registerRoutes<const TRoutes extends ReadonlyArray<Route>>(
  routes: TRoutes,
): RouteRegistry<TRoutes> {
  // Build paths map at runtime for validation
  const paths = buildPathsMap(routes as unknown as Routes);

  return {
    routes,
    paths: paths as RoutePathMap<TRoutes>,
    _params: (() => ({})) as RouteRegistry<TRoutes>["_params"],
  };
}

/**
 * Builds a map of all paths in the route configuration (runtime)
 */
function buildPathsMap(
  routes: Routes,
  prefix: string = "",
  result: Record<string, string> = {},
): Record<string, string> {
  for (const route of routes) {
    if (route.path !== undefined) {
      const fullPath = prefix ? `${prefix}/${route.path}` : route.path;
      const normalizedPath = fullPath.replace(/\/+/g, "/").replace(/^\//, "");

      if (normalizedPath || prefix === "") {
        result[normalizedPath || "/"] = normalizedPath || "/";
      }

      if (route.children) {
        buildPathsMap(route.children, fullPath, result);
      }
    }
  }
  return result;
}

// =============================================================================
// Path Utilities
// =============================================================================

/**
 * Builds a URL path by substituting parameters
 */
export function buildPath<Path extends string>(path: Path, params: PathParams<Path>): string {
  let result: string = path;

  if (params && typeof params === "object") {
    for (const [key, value] of Object.entries(params)) {
      result = result.replace(`:${key}`, encodeURIComponent(String(value)));
    }
  }

  // Ensure leading slash
  if (!result.startsWith("/")) {
    result = "/" + result;
  }

  return result;
}

/**
 * Builds a full URL with query parameters
 */
export function buildUrl<Path extends string>(
  path: Path,
  params: PathParams<Path>,
  queryParams?: Record<string, QueryParamValue>,
): string {
  let url = buildPath(path, params);

  if (queryParams) {
    const searchParams = new URLSearchParams();

    for (const [key, value] of Object.entries(queryParams)) {
      if (value === null || value === undefined) continue;

      if (Array.isArray(value)) {
        value.forEach((v) => searchParams.append(key, v));
      } else {
        searchParams.set(key, String(value));
      }
    }

    const queryString = searchParams.toString();
    if (queryString) {
      url += "?" + queryString;
    }
  }

  return url;
}

/**
 * Validates that all required params are provided
 */
export function validateParams<Path extends string>(
  path: Path,
  params: Record<string, unknown>,
): params is PathParams<Path> {
  const requiredParams = path.match(/:(\w+)/g)?.map((p) => p.slice(1)) ?? [];

  for (const param of requiredParams) {
    if (!(param in params) || params[param] === undefined || params[param] === null) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts parameter names from a path (runtime)
 */
export function getParamNames(path: string): string[] {
  const matches = path.match(/:(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}
