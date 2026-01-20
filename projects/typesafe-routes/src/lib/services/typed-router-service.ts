/**
 * TypedRouter Service
 *
 * A type-safe wrapper around Angular's Router that provides compile-time
 * checking for route paths and parameters while delegating all actual
 * routing work to Angular's Router.
 */
import { Injectable, inject } from "@angular/core";
import {
  type Navigation,
  type NavigationExtras,
  type Route,
  Router,
  type UrlCreationOptions,
  UrlTree,
} from "@angular/router";
import { Observable } from "rxjs";
import { type RouteRegistry, buildPath, buildUrl } from "../types/route-registry";
import type { HasParams, PathParams, QueryParamValue } from "../types/route-types";

/**
 * Extracts all valid paths from a route registry
 */
type ValidPaths<TRegistry extends RouteRegistry<any>> =
  TRegistry extends RouteRegistry<infer R> ? keyof TRegistry["paths"] & string : never;

/**
 * Navigation arguments based on whether path requires params
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

@Injectable({ providedIn: "root" })
class TypedRouterService<
  TPaths extends ValidPaths<TRegistry>,
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
> {
  private readonly router = inject(Router);

  /**
   * Navigate to a route by path.
   *
   * @param path The route path (e.g., 'users/:userId')
   * @param options Navigation options including params and queryParams
   * @returns Promise that resolves to true if navigation succeeds
   *
   * @example
   * ```typescript
   * // Path without params
   * router.navigate('users');
   *
   * // Path with params
   * router.navigate('users/:userId', { params: { userId: '123' } });
   *
   * // With query params
   * router.navigate('users/:userId', {
   *   params: { userId: '123' },
   *   queryParams: { tab: 'posts' }
   * });
   * ```
   */
  navigate<P extends TPaths>(...args: NavigateArgs<P>): Promise<boolean> {
    const [path, options] = args;
    const params = (options as any)?.params ?? {};
    const queryParams = (options as any)?.queryParams;
    const extras = (options as any)?.extras ?? {};

    const url = buildPath(path, params);

    const navigationExtras: NavigationExtras = {
      ...extras,
    };

    if (queryParams) {
      navigationExtras.queryParams = queryParams;
    }

    return this.router.navigate([url], navigationExtras);
  }

  /**
   * Navigate by URL string.
   *
   * @param path The route path
   * @param options Navigation options
   * @returns Promise that resolves to true if navigation succeeds
   */
  navigateByUrl<P extends TPaths>(...args: NavigateArgs<P>): Promise<boolean> {
    const [path, options] = args;
    const params = (options as any)?.params ?? {};
    const queryParams = (options as any)?.queryParams;
    const extras = (options as any)?.extras ?? {};

    const url = buildUrl(path, params, queryParams);

    return this.router.navigateByUrl(url, extras);
  }

  /**
   * Creates a URL string for a route.
   *
   * @param path The route path
   * @param options Options including params and queryParams
   * @returns The full URL string
   */
  createUrl<P extends TPaths>(...args: NavigateArgs<P>): string {
    const [path, options] = args;
    const params = (options as any)?.params ?? {};
    const queryParams = (options as any)?.queryParams;

    return buildUrl(path, params, queryParams);
  }

  /**
   * Creates a UrlTree for a route.
   * Useful for route guards returning UrlTree.
   *
   * @param path The route path
   * @param options Options including params and queryParams
   * @returns UrlTree instance
   */
  createUrlTree<P extends TPaths>(...args: NavigateArgs<P>): UrlTree {
    const [path, options] = args;
    const params = (options as any)?.params ?? {};
    const queryParams = (options as any)?.queryParams;
    const extras = (options as any)?.extras ?? {};

    const url = buildPath(path, params);

    const urlCreationOptions: UrlCreationOptions = {
      ...extras,
    };

    if (queryParams) {
      urlCreationOptions.queryParams = queryParams;
    }

    return this.router.createUrlTree([url], urlCreationOptions);
  }

  /**
   * Checks if a route is currently active.
   *
   * @param path The route path to check
   * @param exact Whether to match exactly (default: false)
   * @returns True if the route is active
   */
  isActive<P extends TPaths>(path: P, exact: boolean = false): boolean {
    // Create a regex pattern from the path
    const pattern = "/" + path.replace(/:(\w+)/g, "[^/]+");
    const regex = new RegExp(exact ? `^${pattern}$` : `^${pattern}`);

    const currentPath = this.router.url.split("?")[0].split("#")[0];
    return regex.test(currentPath);
  }

  /**
   * Gets the path template for route.
   *
   * @param path The route path
   * @returns The path with leading slash
   */
  getPath<P extends TPaths>(path: P): string {
    return "/" + path;
  }

  /**
   * Serializes route params into a path.
   *
   * @param path The route path template
   * @param params The params to substitute
   * @returns The resolved path
   */
  serializePath<P extends TPaths>(
    path: P,
    ...args: HasParams<P> extends true ? [params: PathParams<P>] : [params?: undefined]
  ): string {
    const params = args[0] ?? {};
    return buildPath(path, params as PathParams<P>);
  }

  /**
   * Access to the underlying Angular Router.
   * Use this for advanced scenarios not covered by typed methods.
   */
  get angularRouter(): Router {
    return this.router;
  }

  /**
   * Observable of router events
   */
  get events(): Observable<any> {
    return this.router.events;
  }

  /**
   * The current URL
   */
  get url(): string {
    return this.router.url;
  }

  /**
   * The current navigation
   */
  get currentNavigation(): Navigation | null {
    return this.router.currentNavigation();
  }

  /**
   * The route configuration
   */
  get config(): Route[] {
    return this.router.config;
  }
}

/**
 * Creates a TypedRouter service class for the given route registry.
 *
 * @example
 * ```typescript
 * // routes.ts
 * export const routes = [...] as const satisfies Routes;
 * export const appRoutes = registerRoutes(routes);
 * export const TypedRouter = createTypedRouter(appRoutes);
 *
 * // some.component.ts
 * @Component({...})
 * class SomeComponent {
 *   private router = inject(TypedRouter);
 *
 *   goToUser(id: string) {
 *     this.router.navigate('users/:userId', { params: { userId: id } });
 *   }
 * }
 * ```
 */
export function createTypedRouter<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  return TypedRouterService<ValidPaths<TRegistry>, TRegistry>;
}

/**
 * Type helper to get the instance type of a created TypedRouter
 */
export type TypedRouterInstance<TRegistry extends RouteRegistry<any>> = InstanceType<
  ReturnType<typeof createTypedRouter<TRegistry>>
>;
