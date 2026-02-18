/**
 * Typed Navigation Functions
 *
 * Functional API for type-safe navigation. Replaces injectable services
 * with pure functions that work in Angular's injection context.
 *
 * Usage:
 * ```typescript
 * @Component({...})
 * class MyComponent {
 *   private nav = typedNavigator(appRouter);
 *
 *   goToUser(id: string) {
 *     this.nav.navigate('users/:userId', { params: { userId: id } });
 *   }
 * }
 * ```
 */
import { inject } from "@angular/core";
import {
  type NavigationExtras,
  type Route,
  Router,
  type UrlCreationOptions,
  type UrlTree,
} from "@angular/router";
import { type RouteRegistry, type ValidPaths, buildPath, buildUrl } from "../types/route-registry";
import type { HasParams, PathParams, QueryParamValue } from "../types/route-types";

// =============================================================================
// Navigation Args Type
// =============================================================================

/**
 * Navigation arguments — conditionally requires params based on the path.
 * If the path contains `:param` segments, `options.params` is required.
 */
type NavigateArgs<Path extends string> =
  HasParams<Path> extends true
    ? [
        path: Path,
        options: {
          params: PathParams<Path>;
          queryParams?: Record<string, QueryParamValue>;
          extras?: Omit<NavigationExtras, "queryParams">;
        },
      ]
    : [
        path: Path,
        options?: {
          queryParams?: Record<string, QueryParamValue>;
          extras?: Omit<NavigationExtras, "queryParams">;
        },
      ];

// =============================================================================
// Internal Helpers
// =============================================================================

function extractArgs(args: [string, any?]) {
  const [path, options] = args;
  const params = options?.params ?? {};
  const queryParams = options?.queryParams;
  const extras: NavigationExtras = { ...options?.extras };
  if (queryParams) extras.queryParams = queryParams;
  return { path, params, queryParams, extras };
}

// =============================================================================
// Primary API: typedNavigator
// =============================================================================

/**
 * Creates a typed navigation object. Must be called from an injection context
 * (component constructor, field initializer, or `runInInjectionContext`).
 * The returned methods can be called from any context (event handlers, etc.).
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserListComponent {
 *   private nav = typedNavigator(appRouter);
 *
 *   goToUser(id: string) {
 *     this.nav.navigate('users/:userId', { params: { userId: id } });
 *   }
 *
 *   goHome() {
 *     this.nav.navigate('');
 *   }
 * }
 * ```
 */
export function typedNavigator<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  const router = inject(Router);

  return {
    /**
     * Navigate to a typed route path.
     */
    navigate<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): Promise<boolean> {
      const { path, params, extras } = extractArgs(args);
      return router.navigate([buildPath(path, params)], extras);
    },

    /**
     * Navigate by full URL string.
     */
    navigateByUrl<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): Promise<boolean> {
      const [pathArg, options] = args as [string, any?];
      const params = options?.params ?? {};
      const queryParams = options?.queryParams;
      const extras = options?.extras ?? {};
      return router.navigateByUrl(buildUrl(pathArg, params, queryParams), extras);
    },

    /**
     * Create a UrlTree for the typed path.
     * Useful for returning from guards.
     */
    createUrlTree<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): UrlTree {
      const { path, params, extras } = extractArgs(args);
      return router.createUrlTree([buildPath(path, params)], extras as UrlCreationOptions);
    },

    /**
     * Create a full URL string for the typed path.
     */
    createUrl<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): string {
      const { path, params, queryParams } = extractArgs(args);
      return buildUrl(path, params, queryParams);
    },

    /**
     * Check if a typed path is currently active.
     * Uses Angular's native `router.isActive()` for correct matching.
     */
    isActive<P extends ValidPaths<TRegistry>>(path: P, exact: boolean = false): boolean {
      const urlTree = router.parseUrl("/" + path);
      return router.isActive(urlTree, {
        paths: exact ? "exact" : "subset",
        queryParams: "ignored",
        fragment: "ignored",
        matrixParams: "ignored",
      });
    },

    /** The current URL. */
    get url(): string {
      return router.url;
    },

    /** Access to the underlying Angular Router for advanced scenarios. */
    get angularRouter(): Router {
      return router;
    },
  };
}

// =============================================================================
// Standalone Functions (for guards and injection contexts)
// =============================================================================

/**
 * Creates a UrlTree for a typed path. Must be called from an injection context.
 * Primary use case: returning redirects from `CanActivateFn` guards.
 *
 * @example
 * ```typescript
 * export const authGuard: CanActivateFn = () => {
 *   return inject(AuthService).isLoggedIn()
 *     || typedCreateUrlTree(appRouter, 'auth/login');
 * };
 * ```
 */
export function typedCreateUrlTree<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  P extends ValidPaths<TRegistry>,
>(_registry: TRegistry, ...args: NavigateArgs<P>): UrlTree {
  const router = inject(Router);
  const { path, params, extras } = extractArgs(args);
  return router.createUrlTree([buildPath(path, params)], extras as UrlCreationOptions);
}

/**
 * Creates a full URL string for a typed path. Pure function — no DI required.
 *
 * @example
 * ```typescript
 * const url = typedCreateUrl(appRouter, 'users/:userId', {
 *   params: { userId: '42' },
 *   queryParams: { tab: 'posts' }
 * });
 * // → "/users/42?tab=posts"
 * ```
 */
export function typedCreateUrl<
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
  P extends ValidPaths<TRegistry>,
>(_registry: TRegistry, ...args: NavigateArgs<P>): string {
  const { path, params, queryParams } = extractArgs(args);
  return buildUrl(path, params, queryParams);
}
