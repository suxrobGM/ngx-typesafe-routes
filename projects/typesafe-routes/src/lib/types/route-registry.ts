/**
 * Route Registry
 *
 * Provides a way to register Angular routes and extract type information
 * while maintaining 100% compatibility with standard Angular routing.
 *
 * Usage:
 * ```typescript
 * const routes = [
 *   { path: '', component: HomeComponent },
 *   { path: 'users/:userId', component: UserDetailComponent },
 *   {
 *     path: 'products/:categoryId',
 *     children: [
 *       { path: ':productId', component: ProductComponent }
 *     ]
 *   }
 * ] as const satisfies Routes;
 *
 * export const appRouter = registerRoutes(routes);
 * // In app.config.ts: provideRouter(appRouter.routes)
 * ```
 */
import type { NavigationExtras, Route } from "@angular/router";
import type { HasParams, JoinPath, PathParams, QueryParamValue } from "./route-types";

// =============================================================================
// Route Path Extraction Types
// =============================================================================

/**
 * Recursively extracts all valid route paths from a routes configuration.
 */
export type ExtractAllPaths<
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
 * Maps all extracted paths to themselves (used for `keyof` extraction).
 */
export type RoutePathMap<TRoutes extends ReadonlyArray<Route>> = {
  [K in ExtractAllPaths<TRoutes>]: K;
};

// =============================================================================
// Route Registry
// =============================================================================

/**
 * A typed route registry that preserves route type information.
 * Pass `registry.routes` to `provideRouter()`.
 */
export interface RouteRegistry<TRoutes extends ReadonlyArray<Route>> {
  readonly routes: TRoutes;
}

/**
 * Extracts all valid path strings from a route registry.
 * Use this to constrain path parameters in navigation functions and directives.
 */
export type ValidPaths<TRegistry extends RouteRegistry<ReadonlyArray<Route>>> = keyof RoutePathMap<
  TRegistry["routes"]
> &
  string;

/**
 * Registers routes and extracts type information.
 *
 * @example
 * ```typescript
 * const routes = [
 *   { path: '', component: HomeComponent },
 *   { path: 'users/:userId', component: UserComponent },
 * ] as const satisfies Routes;
 *
 * export const appRouter = registerRoutes(routes);
 *
 * // In app.config.ts
 * provideRouter(appRouter.routes)
 * ```
 */
export function registerRoutes<const TRoutes extends ReadonlyArray<Route>>(
  routes: TRoutes,
): RouteRegistry<TRoutes> {
  return { routes };
}

// =============================================================================
// Navigation Options
// =============================================================================

/**
 * Navigation options based on whether path has params.
 * When the path contains `:param` segments, `params` is required.
 */
export type NavigateOptions<Path extends string> =
  HasParams<Path> extends true
    ? {
        params: PathParams<Path>;
        queryParams?: Record<string, QueryParamValue>;
        extras?: Omit<NavigationExtras, "queryParams">;
      }
    : {
        params?: never;
        queryParams?: Record<string, QueryParamValue>;
        extras?: Omit<NavigationExtras, "queryParams">;
      };

// =============================================================================
// Path Utilities
// =============================================================================

/**
 * Builds a URL path by substituting parameters.
 */
export function buildPath<Path extends string>(path: Path, params: PathParams<Path>): string {
  let result: string = path;

  for (const [key, value] of Object.entries(params)) {
    result = result.replace(`:${key}`, encodeURIComponent(String(value)));
  }

  return result.startsWith("/") ? result : "/" + result;
}

/**
 * Builds a full URL with query parameters.
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
 * Validates that all required params are provided.
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
 * Extracts parameter names from a path (runtime).
 */
export function getParamNames(path: string): string[] {
  const matches = path.match(/:(\w+)/g);
  return matches ? matches.map((m) => m.slice(1)) : [];
}
