import {
  type EnvironmentProviders,
  InjectionToken,
  inject,
  makeEnvironmentProviders,
} from "@angular/core";
import {
  type NavigationExtras,
  type Route,
  Router,
  type Event as RouterEvent,
  type RouterState,
  type UrlCreationOptions,
  type UrlTree,
} from "@angular/router";
import type { Observable } from "rxjs";
import { type RouteRegistry, type ValidPaths, buildPath, buildUrl } from "../types/route-registry";
import type { HasParams, PathParams, QueryParamValue } from "../types/route-types";

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

function extractArgs(args: [string, any?]) {
  const [path, options] = args;
  const params = options?.params ?? {};
  const queryParams = options?.queryParams;
  const extras: NavigationExtras = { ...options?.extras };
  if (queryParams) extras.queryParams = queryParams;
  return { path, params, queryParams, extras };
}

function buildTypedRouter<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
  router: Router,
) {
  return {
    /** Navigate to a typed route path. */
    navigate<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): Promise<boolean> {
      const { path, params, extras } = extractArgs(args);
      return router.navigate([buildPath(path, params)], extras);
    },

    /** Navigate by full URL string. */
    navigateByUrl<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): Promise<boolean> {
      const [pathArg, options] = args as [string, any?];
      const params = options?.params ?? {};
      const queryParams = options?.queryParams;
      const extras = options?.extras ?? {};
      return router.navigateByUrl(buildUrl(pathArg, params, queryParams), extras);
    },

    /** Create a UrlTree for the typed path. Useful for returning from guards. */
    createUrlTree<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): UrlTree {
      const { path, params, extras } = extractArgs(args);
      return router.createUrlTree([buildPath(path, params)], extras as UrlCreationOptions);
    },

    /** Create a full URL string for the typed path. */
    createUrl<P extends ValidPaths<TRegistry>>(...args: NavigateArgs<P>): string {
      const { path, params, queryParams } = extractArgs(args);
      return buildUrl(path, params, queryParams);
    },

    /** Check if a typed path is currently active. */
    isActive<P extends ValidPaths<TRegistry>>(path: P, exact: boolean = false): boolean {
      const urlTree = router.parseUrl("/" + path);
      return router.isActive(urlTree, {
        paths: exact ? "exact" : "subset",
        queryParams: "ignored",
        fragment: "ignored",
        matrixParams: "ignored",
      });
    },

    get url(): string {
      return router.url;
    },

    get events(): Observable<RouterEvent> {
      return router.events;
    },

    get routerState(): RouterState {
      return router.routerState;
    },

    /** Parse a URL string into a UrlTree. */
    parseUrl(url: string): UrlTree {
      return router.parseUrl(url);
    },

    /** Serialize a UrlTree into a URL string. */
    serializeUrl(url: UrlTree): string {
      return router.serializeUrl(url);
    },

    /** Access to the underlying Angular Router for advanced scenarios. */
    get angularRouter(): Router {
      return router;
    },
  };
}

type TypedRouter<TRegistry extends RouteRegistry<ReadonlyArray<Route>>> = ReturnType<
  typeof buildTypedRouter<TRegistry>
>;

/**
 * Creates a typed router factory for the given route registry.
 * Call once at module level to get a DI provider and an inject function.
 *
 * @example
 * ```typescript
 * // app.routes.ts
 * const routes = [...] as const satisfies Routes;
 * export const appRouter = registerRoutes(routes);
 * export const { provideTypedRouter, injectTypedRouter } = createTypedRouter(appRouter);
 *
 * // app.config.ts
 * providers: [
 *   provideRouter(appRouter.routes, withComponentInputBinding()),
 *   provideTypedRouter,
 * ]
 *
 * // any.component.ts
 * import { injectTypedRouter } from './app.routes';
 *
 * @Component({...})
 * class UserListComponent {
 *   private router = injectTypedRouter();
 *
 *   goToUser(id: string) {
 *     this.router.navigate('users/:userId', { params: { userId: id } });
 *   }
 * }
 * ```
 */
export function createTypedRouter<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  registry: TRegistry,
): {
  provideTypedRouter: EnvironmentProviders;
  injectTypedRouter: () => TypedRouter<TRegistry>;
} {
  const TOKEN = new InjectionToken<TypedRouter<TRegistry>>("TypedRouter");

  return {
    provideTypedRouter: makeEnvironmentProviders([
      {
        provide: TOKEN,
        useFactory: () => buildTypedRouter(registry, inject(Router)),
      },
    ]),
    injectTypedRouter: (): TypedRouter<TRegistry> => inject(TOKEN),
  };
}
