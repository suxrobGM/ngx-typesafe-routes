# Project Overview

`ngx-typesafe-routes` is an Angular library that adds compile-time type-safe routing using TypeScript template literal types. It wraps Angular's standard router with zero runtime overhead — all validation happens at compile time.

## Architecture

- **Monorepo**: Angular workspace with a library project and a sample app
- **Library**: `projects/typesafe-routes/` — published to npm as `ngx-typesafe-routes`
- **Sample app**: `src/` — for development and testing
- **Build**: ng-packagr with partial compilation mode (`ng build typesafe-routes`)

## Key Files

```text
projects/typesafe-routes/src/
  public-api.ts                          # Public API surface (all exports)
  lib/
    types/
      route-types.ts                     # Core type utilities (ExtractPathParams, PathParams, etc.)
      route-registry.ts                  # RouteRegistry, ValidPaths, registerRoutes, buildPath, buildUrl
    navigation/
      typed-navigation.ts               # typedNavigator, typedCreateUrlTree, typedCreateUrl
    inputs/
      route-inputs.ts                    # Signal input factories (routeParam, queryParam, etc.)
    directives/
      typed-router-link-directive.ts     # createTypedRouterLink (hostDirectives wrapper)
      typed-router-link-active-directive.ts  # createTypedRouterLinkActive
    guards/
      typed-guards.ts                    # TypedRouteSnapshot, getTypedParams
```

## Type Safety Chain

The core type flow that must be preserved:

```text
as const satisfies Routes  →  registerRoutes()  →  RouteRegistry<TRoutes>
  →  ExtractAllPaths<TRoutes>  →  ValidPaths<TRegistry>
  →  HasParams<Path>  →  NavigateArgs<Path> (conditionally requires params)
```

Breaking any link in this chain breaks compile-time validation for the entire library.

## Build & Test Commands

```bash
bun run build:lib        # Build the library (ng-packagr)
bun run watch:lib        # Watch mode rebuild
bun run start            # Serve the sample app
bun run test             # Run tests
bun run format           # Prettier formatting
```

## Important Patterns

### NG8110 Workaround

Angular's compiler rejects `input()` and `input.required()` calls outside class member initializers. The input factory functions in `route-inputs.ts` use indirect references to bypass this:

```typescript
const _input: typeof input = input;
const _required: typeof input.required = input.required;
```

Do not refactor these back to direct `input()` calls — ng-packagr will fail with NG8110.

### TS4094: Private Properties in Exported Classes

The directive factories (`createTypedRouterLink`, `createTypedRouterLinkActive`) return anonymous classes from exported functions. Properties like `_routerLink` and `_rla` must use `public readonly` (not `private`) to avoid TS4094. They are marked `/** @internal */` instead.

If a linter changes these to `private`, the build will break.

### hostDirectives Composition

Both typed directives delegate all behavior to Angular's built-in directives via `hostDirectives`. They only add typed inputs and map them to the underlying directive. Do not reimplement RouterLink/RouterLinkActive behavior manually.

### Functional API (No DI Services)

Navigation uses standalone functions instead of injectable services:

- `typedNavigator(registry)` — call in injection context, returns methods object
- `typedCreateUrlTree(registry, ...)` — for guards (injection context)
- `typedCreateUrl(registry, ...)` — pure function, no DI

## Conventions

- Standalone components and directives only (no NgModules)
- Signal inputs (`input()`, `input.required()`) — no decorator-based `@Input()`
- Functional guards (`CanActivateFn`) — no class-based guards
- Prettier for formatting (configured in workspace)
- All library exports must go through `public-api.ts`
