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
      typed-navigation.ts               # createTypedRouter (DI provider + inject factory)
    inputs/
      route-inputs.ts                    # input object (route params), queryParam helpers
    directives/
      typed-router-link-directive.ts     # createTypedRouterLink ([routerLink] selector)
      typed-router-link-active-directive.ts  # createTypedRouterLinkActive ([routerLinkActive] selector)
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
const _input: typeof _ngInput = _ngInput;
const _required: typeof _ngInput.required = _ngInput.required;
```

Do not refactor these back to direct `input()` calls — ng-packagr will fail with NG8110.

### TS4094: Private Properties in Exported Classes

The directive factories (`createTypedRouterLink`, `createTypedRouterLinkActive`) return anonymous classes from exported functions. Properties like `_routerLink` and `_rla` must use `public readonly` (not `private`) to avoid TS4094. They are marked `/** @internal */` instead.

If a linter changes these to `private`, the build will break.

### hostDirectives Composition

Both typed directives delegate all behavior to Angular's built-in directives via `hostDirectives`. They only add typed inputs and map them to the underlying directive. Do not reimplement RouterLink/RouterLinkActive behavior manually.

### Navigation via DI (createTypedRouter)

Navigation uses a factory pattern with Angular DI:

- `createTypedRouter(registry)` — called once at module level, returns `{ provideTypedRouter, injectTypedRouter }`
- `provideTypedRouter` — add to app providers (registers an InjectionToken)
- `injectTypedRouter()` — call in injection context, returns typed router object with `navigate`, `navigateByUrl`, `createUrlTree`, etc.

This eliminates the need to import the registry in every component.

## Conventions

- Standalone components and directives only (no NgModules)
- Signal inputs (`input()`, `input.required()`) — no decorator-based `@Input()`
- Functional guards (`CanActivateFn`) — no class-based guards
- Prettier for formatting (configured in workspace)
- All library exports must go through `public-api.ts`
