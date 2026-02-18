/*
 * Public API Surface of typesafe-routes
 */

// Route registry and path utilities
export {
  buildPath,
  buildUrl,
  getParamNames,
  registerRoutes,
  validateParams,
} from "./lib/types/route-registry";

export type {
  ExtractAllPaths,
  NavigateOptions,
  RoutePathMap,
  RouteRegistry,
  ValidPaths,
} from "./lib/types/route-registry";

// Core type utilities
export type {
  ExtractPathParams,
  HasParams,
  JoinPath,
  PathParams,
  QueryParamValue,
} from "./lib/types/route-types";

// Navigation functions
export {
  typedCreateUrl,
  typedCreateUrlTree,
  typedNavigator,
} from "./lib/navigation/typed-navigation";

// Signal inputs for withComponentInputBinding()
export {
  queryParam,
  queryParamBoolean,
  queryParamDefault,
  queryParamNumber,
  queryParamTransform,
  routeData,
  routeDataOptional,
  routeParam,
  routeParamNumber,
  routeParamOptional,
  routeParamTransform,
  routeParamTransformOptional,
  routeParamValidated,
} from "./lib/inputs/route-inputs";

// Directives (typed wrappers over RouterLink/RouterLinkActive)
export { createTypedRouterLink } from "./lib/directives/typed-router-link-directive";
export { createTypedRouterLinkActive } from "./lib/directives/typed-router-link-active-directive";

// Guard utilities
export type { TypedRouteSnapshot } from "./lib/guards/typed-guards";
export { getTypedParams } from "./lib/guards/typed-guards";
