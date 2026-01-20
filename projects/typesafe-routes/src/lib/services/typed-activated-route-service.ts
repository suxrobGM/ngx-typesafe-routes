/**
 * TypedActivatedRoute Service
 *
 * A type-safe wrapper around Angular's ActivatedRoute that provides
 * typed access to route parameters, query parameters, and data.
 */
import { DestroyRef, Injectable, type Signal, inject } from "@angular/core";
import { toSignal } from "@angular/core/rxjs-interop";
import { ActivatedRoute, ActivatedRouteSnapshot, type Data, type Route } from "@angular/router";
import { Observable, distinctUntilChanged, map } from "rxjs";
import type { RouteRegistry } from "../types/route-registry";
import type { ExtractPathParams, PathParams } from "../types/route-types";

/**
 * Extracts all valid paths from a route registry
 */
type ValidPaths<TRegistry extends RouteRegistry<any>> =
  TRegistry extends RouteRegistry<infer R> ? keyof TRegistry["paths"] & string : never;

@Injectable({ providedIn: "root" })
class TypedActivatedRouteService<
  TPaths extends ValidPaths<TRegistry>,
  TRegistry extends RouteRegistry<ReadonlyArray<Route>>,
> {
  private readonly activatedRoute = inject(ActivatedRoute);

  /**
   * Gets a path parameter as an Observable.
   *
   * @param _path The route path (for type inference)
   * @param paramName The parameter name
   * @returns Observable of the parameter value
   *
   * @example
   * ```typescript
   * userId$ = this.route.param$('users/:userId', 'userId');
   * ```
   */
  param$<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): Observable<string | null> {
    return this.activatedRoute.paramMap.pipe(
      map((params) => params.get(paramName as string)),
      distinctUntilChanged(),
    );
  }

  /**
   * Gets a path parameter as a required Observable (throws if null).
   *
   * @param _path The route path
   * @param paramName The parameter name
   * @returns Observable of the parameter value (never null)
   */
  paramRequired$<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): Observable<string> {
    return this.activatedRoute.paramMap.pipe(
      map((params) => {
        const value = params.get(paramName as string);
        if (value === null) {
          throw new Error(`Required route parameter "${String(paramName)}" is missing`);
        }
        return value;
      }),
      distinctUntilChanged(),
    );
  }

  /**
   * Gets all path parameters as an Observable.
   *
   * @param _path The route path (for type inference)
   * @returns Observable of all parameters
   */
  params$<P extends TPaths>(_path: P): Observable<PathParams<P>> {
    return this.activatedRoute.params as Observable<PathParams<P>>;
  }

  /**
   * Gets a path parameter as a Signal.
   *
   * @param _path The route path (for type inference)
   * @param paramName The parameter name
   * @returns Signal of the parameter value
   *
   * @example
   * ```typescript
   * userId = this.route.param('users/:userId', 'userId');
   * // In template: {{ userId() }}
   * ```
   */
  param<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): Signal<string | null> {
    return toSignal(this.param$(_path, paramName), { initialValue: null });
  }

  /**
   * Gets a path parameter as a required Signal.
   * Uses the snapshot value as initial value.
   *
   * @param _path The route path
   * @param paramName The parameter name
   * @returns Signal of the parameter value
   */
  paramRequired<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): Signal<string> {
    const initial = this.activatedRoute.snapshot.paramMap.get(paramName as string) ?? "";
    return toSignal(this.paramRequired$(_path, paramName), { initialValue: initial });
  }

  /**
   * Gets all path parameters as a Signal.
   *
   * @param _path The route path
   * @returns Signal of all parameters
   */
  params<P extends TPaths>(_path: P): Signal<PathParams<P>> {
    return toSignal(this.params$(_path), {
      initialValue: this.activatedRoute.snapshot.params as PathParams<P>,
    });
  }

  /**
   * Gets a path parameter from snapshot.
   *
   * @param _path The route path
   * @param paramName The parameter name
   * @returns The parameter value or null
   */
  paramSnapshot<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): string | null {
    return this.activatedRoute.snapshot.paramMap.get(paramName as string);
  }

  /**
   * Gets a required path parameter from snapshot.
   *
   * @param _path The route path
   * @param paramName The parameter name
   * @returns The parameter value
   * @throws Error if parameter is missing
   */
  paramSnapshotRequired<P extends TPaths, K extends ExtractPathParams<P>>(
    _path: P,
    paramName: K,
  ): string {
    const value = this.activatedRoute.snapshot.paramMap.get(paramName as string);
    if (value === null) {
      throw new Error(`Required route parameter "${String(paramName)}" is missing`);
    }
    return value;
  }

  /**
   * Gets all path parameters from snapshot.
   *
   * @param _path The route path
   * @returns All parameters
   */
  paramsSnapshot<P extends TPaths>(_path: P): PathParams<P> {
    return this.activatedRoute.snapshot.params as PathParams<P>;
  }

  /**
   * Gets a query parameter as an Observable.
   *
   * @param paramName The query parameter name
   * @returns Observable of the parameter value
   */
  queryParam$(paramName: string): Observable<string | null> {
    return this.activatedRoute.queryParamMap.pipe(
      map((params) => params.get(paramName)),
      distinctUntilChanged(),
    );
  }

  /**
   * Gets all values of a query parameter (for arrays).
   *
   * @param paramName The query parameter name
   * @returns Observable of all values
   */
  queryParamAll$(paramName: string): Observable<string[]> {
    return this.activatedRoute.queryParamMap.pipe(
      map((params) => params.getAll(paramName)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    );
  }

  /**
   * Gets all query parameters as an Observable.
   *
   * @returns Observable of all query parameters
   */
  queryParams$<T extends Record<string, string> = Record<string, string>>(): Observable<T> {
    return this.activatedRoute.queryParams as Observable<T>;
  }

  /**
   * Gets a query parameter as a Signal.
   *
   * @param paramName The query parameter name
   * @returns Signal of the parameter value
   */
  queryParam(paramName: string): Signal<string | null> {
    return toSignal(this.queryParam$(paramName), { initialValue: null });
  }

  /**
   * Gets all values of a query parameter as a Signal.
   *
   * @param paramName The query parameter name
   * @returns Signal of all values
   */
  queryParamAll(paramName: string): Signal<string[]> {
    return toSignal(this.queryParamAll$(paramName), { initialValue: [] });
  }

  /**
   * Gets all query parameters as a Signal.
   *
   * @returns Signal of all query parameters
   */
  queryParams<T extends Record<string, string> = Record<string, string>>(): Signal<T> {
    return toSignal(this.queryParams$<T>(), {
      initialValue: this.activatedRoute.snapshot.queryParams as T,
    });
  }

  /**
   * Gets a query parameter from snapshot.
   *
   * @param paramName The query parameter name
   * @returns The parameter value or null
   */
  queryParamSnapshot(paramName: string): string | null {
    return this.activatedRoute.snapshot.queryParamMap.get(paramName);
  }

  /**
   * Gets all query parameters from snapshot.
   *
   * @returns All query parameters
   */
  queryParamsSnapshot<T extends Record<string, string> = Record<string, string>>(): T {
    return this.activatedRoute.snapshot.queryParams as T;
  }

  /**
   * Gets route data as an Observable.
   *
   * @returns Observable of route data
   */
  data$<T extends Data = Data>(): Observable<T> {
    return this.activatedRoute.data as Observable<T>;
  }

  /**
   * Gets route data as a Signal.
   *
   * @returns Signal of route data
   */
  data<T extends Data = Data>(): Signal<T> {
    return toSignal(this.data$<T>(), {
      initialValue: this.activatedRoute.snapshot.data as T,
    });
  }

  /**
   * Gets route data from snapshot.
   *
   * @returns Route data
   */
  dataSnapshot<T extends Data = Data>(): T {
    return this.activatedRoute.snapshot.data as T;
  }

  /**
   * Gets the URL fragment as an Observable.
   */
  get fragment$(): Observable<string | null> {
    return this.activatedRoute.fragment;
  }

  /**
   * Gets the URL fragment as a Signal.
   */
  get fragment(): Signal<string | null> {
    return toSignal(this.fragment$, { initialValue: null });
  }

  /**
   * Gets the URL fragment from snapshot.
   */
  get fragmentSnapshot(): string | null {
    return this.activatedRoute.snapshot.fragment;
  }

  /**
   * Gets the URL as an Observable.
   */
  get url$(): Observable<string> {
    return this.activatedRoute.url.pipe(
      map((segments) => "/" + segments.map((s) => s.path).join("/")),
    );
  }

  /**
   * Access to the underlying Angular ActivatedRoute.
   */
  get angularRoute(): ActivatedRoute {
    return this.activatedRoute;
  }

  /**
   * The route snapshot
   */
  get snapshot(): ActivatedRouteSnapshot {
    return this.activatedRoute.snapshot;
  }
}

/**
 * Creates a TypedActivatedRoute service class for the given route registry.
 *
 * @example
 * ```typescript
 * export const TypedActivatedRoute = createTypedActivatedRoute(appRoutes);
 *
 * @Component({...})
 * class UserComponent {
 *   private route = inject(TypedActivatedRoute);
 *
 *   // Get typed param
 *   userId = this.route.param('users/:userId', 'userId');
 *   userId$ = this.route.param$('users/:userId', 'userId');
 * }
 * ```
 */
export function createTypedActivatedRoute<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  return TypedActivatedRouteService<ValidPaths<TRegistry>, TRegistry>;
}

/**
 * Type helper to get the instance type
 */
export type TypedActivatedRouteInstance<TRegistry extends RouteRegistry<any>> = InstanceType<
  ReturnType<typeof createTypedActivatedRoute<TRegistry>>
>;
