# API Reference

Complete API documentation for `ngx-typesafe-routes`.

---

## Route Registration

### `registerRoutes(routes)`

Creates a typed route registry. The registry is a plain object holding your routes with preserved literal types.

```typescript
import { registerRoutes } from "ngx-typesafe-routes";

const routes = [
  { path: "", component: HomeComponent },
  { path: "users/:userId", component: UserComponent },
  {
    path: "products/:categoryId",
    children: [{ path: ":productId", component: ProductComponent }],
  },
] as const satisfies Routes;

export const appRouter = registerRoutes(routes);
// Type: RouteRegistry<typeof routes>
// appRouter.routes === routes (same reference)
```

**Parameters:**

- `routes: TRoutes` — An Angular routes array declared with `as const satisfies Routes`

**Returns:** `RouteRegistry<TRoutes>` — A typed registry. Pass `registry.routes` to `provideRouter()`.

**Why `as const`?** Without it, TypeScript widens `'users/:userId'` to `string`, losing all type information. The `as const` assertion preserves the literal path strings that power compile-time validation.

---

### `buildPath(path, params)`

Substitutes `:param` segments in a path and returns an absolute URL path.

```typescript
import { buildPath } from "ngx-typesafe-routes";

buildPath("users/:userId", { userId: "42" });
// => "/users/42"

buildPath("products/:categoryId/:productId", { categoryId: "electronics", productId: "99" });
// => "/products/electronics/99"

buildPath("", {});
// => "/"
```

**Parameters:**

- `path: Path` — A route path string (e.g., `'users/:userId'`)
- `params: PathParams<Path>` — An object with all required param values as strings

**Returns:** `string` — The resolved absolute path (always starts with `/`). Param values are URI-encoded.

---

### `buildUrl(path, params, queryParams?)`

Builds a full URL including query parameters.

```typescript
import { buildUrl } from "ngx-typesafe-routes";

buildUrl("users/:userId", { userId: "42" }, { tab: "posts", page: "1" });
// => "/users/42?tab=posts&page=1"

buildUrl("users/:userId", { userId: "42" }, { tags: ["angular", "typescript"] });
// => "/users/42?tags=angular&tags=typescript"

buildUrl("users/:userId", { userId: "42" }, { debug: null });
// => "/users/42" (null/undefined values are omitted)
```

**Parameters:**

- `path: Path` — A route path string
- `params: PathParams<Path>` — Path parameter values
- `queryParams?: Record<string, QueryParamValue>` — Optional query parameters

**Returns:** `string` — Full URL with query string. Array values produce repeated keys. `null`/`undefined` values are omitted.

---

### `validateParams(path, params)`

Runtime validation that all required parameters are present and non-null.

```typescript
import { validateParams } from "ngx-typesafe-routes";

validateParams("users/:userId", { userId: "42" });
// => true

validateParams("users/:userId", {});
// => false

validateParams("users/:userId", { userId: undefined });
// => false
```

**Parameters:**

- `path: Path` — A route path string
- `params: Record<string, unknown>` — An object to validate

**Returns:** `params is PathParams<Path>` — Type guard narrowing `params` to the correct type.

---

### `getParamNames(path)`

Extracts parameter names from a path at runtime.

```typescript
import { getParamNames } from "ngx-typesafe-routes";

getParamNames("users/:userId/posts/:postId");
// => ['userId', 'postId']

getParamNames("users");
// => []
```

**Parameters:**

- `path: string` — A route path string

**Returns:** `string[]` — Array of parameter names (without the `:` prefix).

---

## Navigation

### `createTypedRouter(registry)`

Creates a typed router factory. Call once at module level to get a DI provider and an inject function. This eliminates the need to import the registry in every component.

```typescript
// app.routes.ts
import { registerRoutes, createTypedRouter } from "ngx-typesafe-routes";

const routes = [...] as const satisfies Routes;
export const appRouter = registerRoutes(routes);
export const { provideTypedRouter, injectTypedRouter } = createTypedRouter(appRouter);
```

**Parameters:**

- `registry: TRegistry` — A route registry created by `registerRoutes()`

**Returns:** An object with:

- `provideTypedRouter: EnvironmentProviders` — Add to your app providers array
- `injectTypedRouter: () => TypedRouter` — Call in injection context to get the typed router

#### Setup

```typescript
// app.config.ts
providers: [provideRouter(appRouter.routes, withComponentInputBinding()), provideTypedRouter];
```

#### The Typed Router Object

`injectTypedRouter()` returns an object with the following methods and properties:

##### `.navigate(path, options?)`

Navigates using `router.navigate([resolvedPath], extras)`.

```typescript
private router = injectTypedRouter();

// No params required
router.navigate("users");

// Params required
router.navigate("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
  extras: { replaceUrl: true },
});
```

**Returns:** `Promise<boolean>`

##### `.navigateByUrl(path, options?)`

Navigates using `router.navigateByUrl(fullUrl, extras)`. Query params are encoded in the URL string.

```typescript
router.navigateByUrl("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
```

**Returns:** `Promise<boolean>`

##### `.createUrlTree(path, options?)`

Creates an Angular `UrlTree`. Useful for returning from guards.

```typescript
const tree = router.createUrlTree("auth/login");
const tree = router.createUrlTree("users/:userId", { params: { userId: "42" } });
```

**Returns:** `UrlTree`

##### `.createUrl(path, options?)`

Builds a URL string using `buildUrl()`.

```typescript
const url = router.createUrl("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
// => "/users/42?tab=posts"
```

**Returns:** `string`

##### `.isActive(path, exact?)`

Checks if a path is currently active using Angular's `router.isActive()`.

```typescript
if (router.isActive("users")) {
  /* on any users page */
}
if (router.isActive("users/:userId", true)) {
  /* exact match only */
}
```

**Parameters:**

- `path: P` — A valid path from the registry
- `exact?: boolean` — Whether to require an exact match (default: `false`)

**Returns:** `boolean`

##### `.url`

The current URL string (from `router.url`).

##### `.events`

Router events observable (from `router.events`).

##### `.routerState`

The current router state (from `router.routerState`).

##### `.parseUrl(url)`

Parse a URL string into a `UrlTree`.

##### `.serializeUrl(url)`

Serialize a `UrlTree` into a URL string.

##### `.angularRouter`

The underlying Angular `Router` instance for advanced scenarios.

---

## Directives

### `createTypedRouterLink(registry)`

Creates a typed directive wrapping Angular's `RouterLink` via `hostDirectives`. Uses the `[routerLink]` selector — same as Angular's built-in directive. The directive validates paths at compile time while delegating all DOM behavior (click handling, href, aria attributes, prefetching) to Angular's built-in `RouterLink`.

```typescript
// app.routes.ts — create once, import everywhere
import { createTypedRouterLink } from "ngx-typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLink = createTypedRouterLink(appRouter);
```

**Selector:** `[routerLink]`

**Inputs:**

| Input                   | Type                     | Description                        |
| ----------------------- | ------------------------ | ---------------------------------- |
| `[routerLink]`          | `ValidPaths<TRegistry>`  | The typed route path (required)    |
| `[routerLinkParams]`    | `Record<string, string>` | Path parameters for substitution   |
| `[queryParams]`         | `Params`                 | Query parameters (from RouterLink) |
| `[fragment]`            | `string`                 | URL fragment (from RouterLink)     |
| `[queryParamsHandling]` | `QueryParamsHandling`    | How to handle query params         |
| `[preserveFragment]`    | `boolean`                | Preserve current fragment          |
| `[skipLocationChange]`  | `boolean`                | Don't update browser URL           |
| `[replaceUrl]`          | `boolean`                | Replace current history entry      |
| `[target]`              | `string`                 | Link target (e.g., `'_blank'`)     |
| `[state]`               | `object`                 | Navigation state                   |
| `[info]`                | `unknown`                | Navigation info                    |
| `[relativeTo]`          | `ActivatedRoute`         | Route to resolve relative to       |

**Usage:**

```html
<!-- Static path, no params -->
<a [routerLink]="'users'">Users</a>

<!-- Path with params -->
<a [routerLink]="'users/:userId'" [routerLinkParams]="{ userId: user.id }"> {{ user.name }} </a>

<!-- With query params and fragment -->
<a [routerLink]="'users'" [queryParams]="{ page: '2' }" fragment="top"> Users Page 2 </a>

<!-- Invalid path = TS error -->
<a [routerLink]="'nonexistent'">Error!</a>
```

---

### `createTypedRouterLinkActive(registry)`

Creates a typed directive wrapping Angular's `RouterLinkActive` via `hostDirectives`. Uses the `[routerLinkActive]` selector — same as Angular's built-in directive. Adds CSS class(es) when the associated route is active.

```typescript
import { createTypedRouterLinkActive } from "ngx-typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

**Selector:** `[routerLinkActive]`

**Inputs:**

| Input                       | Type                   | Description                      |
| --------------------------- | ---------------------- | -------------------------------- |
| `[routerLinkActive]`        | `string \| string[]`   | CSS class(es) to add when active |
| `[routerLinkActiveOptions]` | `IsActiveMatchOptions` | Active matching options          |

**Outputs:**

| Output             | Type                    | Description                     |
| ------------------ | ----------------------- | ------------------------------- |
| `(isActiveChange)` | `EventEmitter<boolean>` | Emits when active state changes |

**Usage:**

```html
<!-- Single class -->
<a [routerLink]="'users'" [routerLinkActive]="'active'">Users</a>

<!-- Multiple classes -->
<a [routerLink]="'users'" [routerLinkActive]="['active', 'highlighted']">Users</a>

<!-- Exact matching -->
<a [routerLink]="'users'" [routerLinkActive]="'active'" [routerLinkActiveOptions]="{ exact: true }">
  Users
</a>
```

---

## Signal Inputs

### Route Params — `input`

The `input` object mirrors Angular's `input()` / `input.required()` API for route parameter binding. Import from `ngx-typesafe-routes` instead of `@angular/core` for route params.

Requires `withComponentInputBinding()` in your router config. Angular binds route params to component inputs by matching the **field name** to the param name.

```typescript
// app.config.ts — required for signal inputs to work
provideRouter(appRouter.routes, withComponentInputBinding());
```

#### `input.required()`

Creates a required string input for a route parameter.

```typescript
import { input } from "ngx-typesafe-routes";

// Route: { path: 'users/:userId', component: UserComponent }
@Component({...})
class UserComponent {
  userId = input.required(); // InputSignal<string>
}
```

#### `input(defaultValue)`

Creates an optional string input with a default value.

```typescript
tab = input("overview"); // InputSignal<string>, defaults to 'overview'
```

#### `input.number()`

Creates a required input that auto-parses to `number`. Throws `Error` if the value is not numeric.

```typescript
userId = input.number(); // InputSignalWithTransform<number, string>
```

#### `input.transform(transform)`

Creates a required input with a custom transform function.

```typescript
userId = input.transform((v) => parseInt(v, 10));
// InputSignalWithTransform<number, string>

status = input.transform((v) => v as "active" | "inactive");
// InputSignalWithTransform<'active' | 'inactive', string>
```

#### `input.validated(validate, errorMessage?)`

Creates a required input that throws if validation fails.

```typescript
slug = input.validated((v) => /^[a-z0-9-]+$/.test(v), "Invalid slug format");
// InputSignalWithTransform<string, string>
```

### Query Params

#### `queryParam()`

Creates an optional string input for a query parameter.

```typescript
import { queryParam } from "ngx-typesafe-routes";

// URL: /search?q=angular
@Component({...})
class SearchComponent {
  q = queryParam(); // InputSignal<string | undefined>
}
```

#### `queryParamDefault(defaultValue)`

Creates a query param input with a default value.

```typescript
tab = queryParamDefault("overview");
// InputSignalWithTransform<string, string | undefined>
// tab() => 'overview' when ?tab is absent
```

#### `queryParamNumber(defaultValue?)`

Creates a numeric query param input.

```typescript
page = queryParamNumber(1);
// InputSignalWithTransform<number, string | undefined>
// page() => 1 when ?page is absent
// page() => 5 when ?page=5
```

#### `queryParamBoolean(defaultValue?)`

Creates a boolean query param input. Treats `'true'`, `'1'`, `'yes'` (case-insensitive) as `true`.

```typescript
showDetails = queryParamBoolean(false);
// InputSignalWithTransform<boolean, string | undefined>
// showDetails() => true when ?showDetails=true
// showDetails() => false when ?showDetails is absent
```

#### `queryParamTransform(transform, defaultValue)`

Creates a query param input with a custom transform.

```typescript
sort = queryParamTransform(
  (v) => (v === "asc" || v === "desc" ? v : "asc") as "asc" | "desc",
  "asc",
);
// InputSignalWithTransform<'asc' | 'desc', string | undefined>
```

---

## Guard Utilities

### `getTypedParams<Path>(route)`

Extracts typed params from an `ActivatedRouteSnapshot`. Returns the same `params` object cast to `PathParams<Path>`.

```typescript
import { getTypedParams } from "ngx-typesafe-routes";

export const userGuard: CanActivateFn = (route) => {
  const { userId } = getTypedParams<"users/:userId">(route);
  // userId: string (typed)
  return inject(AuthService).canAccess(userId);
};
```

**Type parameter:**

- `Path` — The route path string (e.g., `'users/:userId'`)

**Parameters:**

- `route: ActivatedRouteSnapshot`

**Returns:** `PathParams<Path>` — e.g., `{ userId: string }` for path `'users/:userId'`

---

### `TypedRouteSnapshot<Path>`

An interface extending `ActivatedRouteSnapshot` with typed `params` and `paramMap`. Use as a type assertion.

```typescript
import type { TypedRouteSnapshot } from "ngx-typesafe-routes";

export const postGuard: CanActivateFn = (route) => {
  const snap = route as TypedRouteSnapshot<"users/:userId/posts/:postId">;

  snap.params.userId; // string
  snap.params.postId; // string
  snap.params.badName; // TS error: property does not exist

  snap.paramMap.get("userId"); // string | null
  snap.paramMap.has("postId"); // boolean
  snap.paramMap.get("badName"); // TS error
};
```

**Properties:**

- `params: PathParams<Path>` — Typed params object
- `paramMap.get(name)` — Get param by typed name
- `paramMap.getAll(name)` — Get all values for typed name
- `paramMap.has(name)` — Check if typed param exists
- `paramMap.keys` — Typed array of param names

---

## Type Utilities

### `RouteRegistry<TRoutes>`

```typescript
interface RouteRegistry<TRoutes extends ReadonlyArray<Route>> {
  readonly routes: TRoutes;
}
```

The registry interface. Created by `registerRoutes()`.

### `ValidPaths<TRegistry>`

Extracts the union of all valid path strings from a registry. Used to constrain path parameters in navigation functions and directives.

```typescript
type Paths = ValidPaths<typeof appRouter>;
// => '' | 'users' | 'users/:userId' | 'users/:userId/posts/:postId' | 'auth/login'
```

### `PathParams<Path>`

```typescript
type PathParams<"users/:userId/posts/:postId"> = { userId: string; postId: string };
type PathParams<"users"> = {};
```

Creates a params object type from a path string. Params with `:param` syntax become required `string` properties.

### `QueryParamValue`

```typescript
type QueryParamValue = string | number | boolean | string[] | null | undefined;
```

The set of types accepted as query parameter values by `buildUrl()` and navigation options.
