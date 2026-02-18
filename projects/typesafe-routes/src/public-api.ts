/*
 * Public API Surface of ngx-typesafe-routes
 */

// Route registry and path utilities
export {
  buildPath,
  buildUrl,
  getParamNames,
  registerRoutes,
  validateParams,
} from "./lib/types/route-registry";

export type { RouteRegistry, ValidPaths } from "./lib/types/route-registry";
export type { PathParams, QueryParamValue } from "./lib/types/route-types";
export { createTypedRouter } from "./lib/navigation/typed-navigation";

// Route param input (mirrors Angular's input() API for route params)
export { input } from "./lib/inputs/route-inputs";

// Query param input (mirrors the input object pattern for query params)
export { queryParam } from "./lib/inputs/route-inputs";

// Directives (typed wrappers over RouterLink/RouterLinkActive)
export { createTypedRouterLink } from "./lib/directives/typed-router-link-directive";
export { createTypedRouterLinkActive } from "./lib/directives/typed-router-link-active-directive";

// Guard utilities
export type { TypedRouteSnapshot } from "./lib/guards/typed-guards";
export { getTypedParams } from "./lib/guards/typed-guards";
