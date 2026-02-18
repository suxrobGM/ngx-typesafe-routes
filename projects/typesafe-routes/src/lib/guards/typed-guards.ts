/**
 * Type-Safe Guard Utilities
 *
 * Provides typed views of route snapshots for use in standard Angular guards.
 *
 * @example
 * ```typescript
 * export const userGuard: CanActivateFn = (route) => {
 *   const { userId } = getTypedParams<'users/:userId'>(route);
 *   return inject(AuthService).canAccess(userId);
 * };
 * ```
 */
import type { ActivatedRouteSnapshot } from "@angular/router";
import type { ExtractPathParams, PathParams } from "../types/route-types";

/**
 * A typed view of an ActivatedRouteSnapshot for a specific path.
 * Use in standard Angular guard functions to get typed params.
 *
 * @example
 * ```typescript
 * export const userGuard: CanActivateFn = (route) => {
 *   const snap = route as TypedRouteSnapshot<'users/:userId'>;
 *   const { userId } = snap.params; // typed as string
 *   return inject(AuthService).canAccess(userId);
 * };
 * ```
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

/**
 * Extracts typed params from a route snapshot.
 *
 * @example
 * ```typescript
 * export const userGuard: CanActivateFn = (route) => {
 *   const { userId } = getTypedParams<'users/:userId'>(route);
 *   return inject(AuthService).canAccess(userId);
 * };
 * ```
 */
export function getTypedParams<Path extends string>(
  route: ActivatedRouteSnapshot,
): PathParams<Path> {
  return route.params as PathParams<Path>;
}
