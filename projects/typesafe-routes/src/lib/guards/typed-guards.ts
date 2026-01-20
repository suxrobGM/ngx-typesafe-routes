/**
 * Type-Safe Guard Utilities
 *
 * Provides typed wrappers for Angular route guards that ensure
 * type safety when accessing route parameters and data.
 */
import { inject } from "@angular/core";
import {
  ActivatedRouteSnapshot,
  type CanActivateChildFn,
  type CanActivateFn,
  type CanDeactivateFn,
  type CanMatchFn,
  type ResolveFn,
  type Route,
  Router,
  RouterStateSnapshot,
  UrlSegment,
  UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import type { RouteRegistry } from "../types/route-registry";
import type { ExtractPathParams, PathParams } from "../types/route-types";

// =============================================================================
// Type Helpers
// =============================================================================

type ValidPaths<TRegistry extends RouteRegistry<any>> =
  TRegistry extends RouteRegistry<infer R> ? keyof TRegistry["paths"] & string : never;

type GuardResult = boolean | UrlTree | Observable<boolean | UrlTree> | Promise<boolean | UrlTree>;

/**
 * Typed route snapshot with params inference
 */
export interface TypedRouteSnapshot<Path extends string> extends ActivatedRouteSnapshot {
  readonly params: PathParams<Path>;
  readonly paramMap: {
    get(name: ExtractPathParams<Path>): string | null;
    getAll(name: ExtractPathParams<Path>): string[];
    has(name: ExtractPathParams<Path>): boolean;
    readonly keys: ExtractPathParams<Path>[];
  };
}

// =============================================================================
// Guard Factory
// =============================================================================

/**
 * Creates a type-safe CanActivate guard.
 *
 * @example
 * ```typescript
 * export const userGuard = createTypedGuard(
 *   appRoutes,
 *   'users/:userId',
 *   (route, state, params) => {
 *     const authService = inject(AuthService);
 *     // params is typed as { userId: string }
 *     return authService.canAccessUser(params.userId);
 *   }
 * );
 *
 * // In routes:
 * { path: 'users/:userId', canActivate: [userGuard] }
 * ```
 */
export function createTypedGuard<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  Path extends ValidPaths<TRegistry>,
>(
  _registry: TRegistry,
  _path: Path,
  guardFn: (
    route: TypedRouteSnapshot<Path>,
    state: RouterStateSnapshot,
    params: PathParams<Path>,
  ) => GuardResult,
): CanActivateFn {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const params = route.params as PathParams<Path>;
    return guardFn(route as TypedRouteSnapshot<Path>, state, params);
  };
}

/**
 * Creates a type-safe CanActivateChild guard.
 */
export function createTypedChildGuard<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  Path extends ValidPaths<TRegistry>,
>(
  _registry: TRegistry,
  _path: Path,
  guardFn: (
    childRoute: TypedRouteSnapshot<Path>,
    state: RouterStateSnapshot,
    params: PathParams<Path>,
  ) => GuardResult,
): CanActivateChildFn {
  return (childRoute: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const params = childRoute.params as PathParams<Path>;
    return guardFn(childRoute as TypedRouteSnapshot<Path>, state, params);
  };
}

/**
 * Creates a type-safe CanMatch guard.
 */
export function createTypedMatchGuard<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
  guardFn: (route: Route, segments: UrlSegment[]) => GuardResult,
): CanMatchFn {
  return guardFn;
}

/**
 * Creates a type-safe CanDeactivate guard.
 */
export function createTypedDeactivateGuard<
  TComponent,
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  Path extends ValidPaths<TRegistry>,
>(
  _registry: TRegistry,
  _path: Path,
  guardFn: (
    component: TComponent,
    currentRoute: TypedRouteSnapshot<Path>,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot,
    params: PathParams<Path>,
  ) => GuardResult,
): CanDeactivateFn<TComponent> {
  return (
    component: TComponent,
    currentRoute: ActivatedRouteSnapshot,
    currentState: RouterStateSnapshot,
    nextState: RouterStateSnapshot,
  ) => {
    const params = currentRoute.params as PathParams<Path>;
    return guardFn(
      component,
      currentRoute as TypedRouteSnapshot<Path>,
      currentState,
      nextState,
      params,
    );
  };
}

// =============================================================================
// Resolver Factory
// =============================================================================

/**
 * Creates a type-safe resolver.
 *
 * @example
 * ```typescript
 * export const userResolver = createTypedResolver(
 *   appRoutes,
 *   'users/:userId',
 *   (route, state, params) => {
 *     const userService = inject(UserService);
 *     // params.userId is typed as string
 *     return userService.getUser(params.userId);
 *   }
 * );
 *
 * // In routes:
 * {
 *   path: 'users/:userId',
 *   resolve: { user: userResolver }
 * }
 * ```
 */
export function createTypedResolver<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  Path extends ValidPaths<TRegistry>,
  TResult,
>(
  _registry: TRegistry,
  _path: Path,
  resolveFn: (
    route: TypedRouteSnapshot<Path>,
    state: RouterStateSnapshot,
    params: PathParams<Path>,
  ) => TResult | Observable<TResult> | Promise<TResult>,
): ResolveFn<TResult> {
  return (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
    const params = route.params as PathParams<Path>;
    return resolveFn(route as TypedRouteSnapshot<Path>, state, params);
  };
}

// =============================================================================
// Redirect Helper
// =============================================================================

/**
 * Creates a typed redirect guard.
 * Redirects to a type-safe route.
 *
 * @example
 * ```typescript
 * export const loginRedirect = createTypedRedirect(
 *   appRoutes,
 *   'auth/login',
 *   {}  // params if needed
 * );
 * ```
 */
export function createTypedRedirect<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  Path extends ValidPaths<TRegistry>,
>(
  registry: TRegistry,
  path: Path,
  params: PathParams<Path>,
  queryParams?: Record<string, string>,
): CanActivateFn {
  return () => {
    const router = inject(Router);

    let url = "/" + path;

    // Substitute params
    if (params && typeof params === "object") {
      for (const [key, value] of Object.entries(params)) {
        url = url.replace(`:${key}`, encodeURIComponent(String(value)));
      }
    }

    return router.createUrlTree([url], { queryParams });
  };
}

// =============================================================================
// Utility Functions
// =============================================================================

/**
 * Extracts typed params from a route snapshot.
 *
 * @example
 * ```typescript
 * const params = getTypedParams<'users/:userId'>(route);
 * // params: { userId: string }
 * ```
 */
export function getTypedParams<Path extends string>(
  route: ActivatedRouteSnapshot,
): PathParams<Path> {
  return route.params as PathParams<Path>;
}

/**
 * Gets a specific typed param from route snapshot.
 *
 * @example
 * ```typescript
 * const userId = getTypedParam<'users/:userId'>(route, 'userId');
 * // userId: string | null
 * ```
 */
export function getTypedParam<Path extends string, Param extends ExtractPathParams<Path>>(
  route: ActivatedRouteSnapshot,
  param: Param,
): string | null {
  return route.paramMap.get(param as string);
}

/**
 * Gets a required typed param (throws if missing).
 */
export function getRequiredTypedParam<Path extends string, Param extends ExtractPathParams<Path>>(
  route: ActivatedRouteSnapshot,
  param: Param,
): string {
  const value = route.paramMap.get(param as string);
  if (value === null) {
    throw new Error(`Required route parameter "${String(param)}" is missing`);
  }
  return value;
}
