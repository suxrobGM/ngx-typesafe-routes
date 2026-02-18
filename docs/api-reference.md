# API Reference

Complete API documentation for `typesafe-routes`.

---

## Route Registration

### `registerRoutes(routes)`

Creates a typed route registry. The registry is a plain object holding your routes with preserved literal types.

```typescript
import { registerRoutes } from "typesafe-routes";

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
import { buildPath } from "typesafe-routes";

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
import { buildUrl } from "typesafe-routes";

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
import { validateParams } from "typesafe-routes";

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
import { getParamNames } from "typesafe-routes";

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

### `typedNavigator(registry)`

Creates a typed navigation object. Must be called from an **injection context** (component constructor, field initializer, or `runInInjectionContext`). The returned methods capture `inject(Router)` and can be called from any context.

```typescript
import { typedNavigator } from 'typesafe-routes';

@Component({...})
export class MyComponent {
  private nav = typedNavigator(appRouter);

  goToUser(id: string) {
    this.nav.navigate('users/:userId', { params: { userId: id } });
  }

  goHome() {
    this.nav.navigate('');
  }
}
```

**Parameters:**

- `_registry: TRegistry` — A route registry (used only for type inference)

**Returns:** An object with the following methods:

#### `.navigate(path, options?)`

Navigates using `router.navigate([resolvedPath], extras)`.

```typescript
// No params required
nav.navigate("users");

// Params required
nav.navigate("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
  extras: { replaceUrl: true },
});
```

**Returns:** `Promise<boolean>`

#### `.navigateByUrl(path, options?)`

Navigates using `router.navigateByUrl(fullUrl, extras)`. Query params are encoded in the URL string.

```typescript
nav.navigateByUrl("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
```

**Returns:** `Promise<boolean>`

#### `.createUrlTree(path, options?)`

Creates an Angular `UrlTree`. Useful for returning from guards.

```typescript
const tree = nav.createUrlTree('auth/login');
const tree = nav.createUrlTree('users/:userId', { params: { userId: '42' } });
```

**Returns:** `UrlTree`

#### `.createUrl(path, options?)`

Builds a URL string using `buildUrl()`.

```typescript
const url = nav.createUrl("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
// => "/users/42?tab=posts"
```

**Returns:** `string`

#### `.isActive(path, exact?)`

Checks if a path is currently active using Angular's `router.isActive()`.

```typescript
if (nav.isActive("users")) {
  /* on any users page */
}
if (nav.isActive("users/:userId", true)) {
  /* exact match only */
}
```

**Parameters:**

- `path: P` — A valid path from the registry
- `exact?: boolean` — Whether to require an exact match (default: `false`)

**Returns:** `boolean`

#### `.url`

The current URL string (from `router.url`).

#### `.angularRouter`

The underlying Angular `Router` instance for advanced scenarios.

---

### `typedCreateUrlTree(registry, path, options?)`

Creates a `UrlTree` for a typed path. Must be called from an **injection context**. Primary use case: returning redirects from `CanActivateFn` guards.

```typescript
import { typedCreateUrlTree } from "typesafe-routes";

export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() || typedCreateUrlTree(appRouter, "auth/login");
};

export const adminGuard: CanActivateFn = () => {
  return (
    inject(AuthService).isAdmin() ||
    typedCreateUrlTree(appRouter, "users/:userId", {
      params: { userId: "me" },
    })
  );
};
```

**Parameters:**

- `_registry: TRegistry` — Route registry (type inference only)
- `path: P` — A valid path
- `options?` — Object with `params`, `queryParams`, `extras`

**Returns:** `UrlTree`

---

### `typedCreateUrl(registry, path, options?)`

Creates a URL string for a typed path. **Pure function** — no injection context required.

```typescript
import { typedCreateUrl } from "typesafe-routes";

const url = typedCreateUrl(appRouter, "users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
// => "/users/42?tab=posts"
```

**Parameters:**

- `_registry: TRegistry` — Route registry (type inference only)
- `path: P` — A valid path
- `options?` — Object with `params`, `queryParams`

**Returns:** `string`

---

## Directives

### `createTypedRouterLink(registry)`

Creates a typed directive wrapping Angular's `RouterLink` via `hostDirectives`. The directive validates paths at compile time while delegating all DOM behavior (click handling, href, aria attributes, prefetching) to Angular's built-in `RouterLink`.

```typescript
// typed-router.ts — create once, import everywhere
import { createTypedRouterLink } from "typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLink = createTypedRouterLink(appRouter);
```

**Selector:** `[typedLink]`

**Inputs:**

| Input                   | Type                     | Description                        |
| ----------------------- | ------------------------ | ---------------------------------- |
| `[typedLink]`           | `ValidPaths<TRegistry>`  | The typed route path (required)    |
| `[linkParams]`          | `Record<string, string>` | Path parameters for substitution   |
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
<a [typedLink]="'users'">Users</a>

<!-- Path with params -->
<a [typedLink]="'users/:userId'" [linkParams]="{ userId: user.id }"> {{ user.name }} </a>

<!-- With query params and fragment -->
<a [typedLink]="'users'" [queryParams]="{ page: '2' }" fragment="top"> Users Page 2 </a>

<!-- Invalid path = TS error -->
<a [typedLink]="'nonexistent'">Error!</a>
```

---

### `createTypedRouterLinkActive(registry)`

Creates a typed directive wrapping Angular's `RouterLinkActive` via `hostDirectives`. Adds CSS class(es) when the associated route is active.

```typescript
import { createTypedRouterLinkActive } from "typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

**Selector:** `[typedLinkActive]`

**Inputs:**

| Input                       | Type                   | Description                      |
| --------------------------- | ---------------------- | -------------------------------- |
| `[typedLinkActive]`         | `string \| string[]`   | CSS class(es) to add when active |
| `[routerLinkActiveOptions]` | `IsActiveMatchOptions` | Active matching options          |

**Outputs:**

| Output             | Type                    | Description                     |
| ------------------ | ----------------------- | ------------------------------- |
| `(isActiveChange)` | `EventEmitter<boolean>` | Emits when active state changes |

**Usage:**

```html
<!-- Single class -->
<a [typedLink]="'users'" [typedLinkActive]="'active'">Users</a>

<!-- Multiple classes -->
<a [typedLink]="'users'" [typedLinkActive]="['active', 'highlighted']">Users</a>

<!-- Exact matching -->
<a [typedLink]="'users'" [typedLinkActive]="'active'" [routerLinkActiveOptions]="{ exact: true }">
  Users
</a>
```

---

## Signal Inputs

All input factories are designed for use with `withComponentInputBinding()`. Angular binds route params, query params, and resolver data to component inputs by matching the **field name** to the param/data key.

```typescript
// app.config.ts — required for signal inputs to work
provideRouter(appRouter.routes, withComponentInputBinding());
```

### Route Params

#### `routeParam()`

Creates a required string input for a route parameter.

```typescript
// Route: { path: 'users/:userId', component: UserComponent }
@Component({...})
class UserComponent {
  userId = routeParam(); // InputSignal<string>
}
```

#### `routeParamOptional(defaultValue)`

Creates an optional string input with a default value.

```typescript
tab = routeParamOptional("overview"); // InputSignal<string>, defaults to 'overview'
```

#### `routeParamNumber()`

Creates a required input that auto-parses to `number`. Throws `Error` if the value is not numeric.

```typescript
userId = routeParamNumber(); // InputSignalWithTransform<number, string>
```

#### `routeParamTransform(transform)`

Creates a required input with a custom transform function.

```typescript
userId = routeParamTransform((v) => parseInt(v, 10));
// InputSignalWithTransform<number, string>

status = routeParamTransform((v) => v as "active" | "inactive");
// InputSignalWithTransform<'active' | 'inactive', string>
```

#### `routeParamTransformOptional(defaultValue, transform)`

Creates an optional input with a transform and default.

```typescript
page = routeParamTransformOptional(1, (v) => (v ? parseInt(v, 10) : 1));
// InputSignalWithTransform<number, string | undefined>
```

#### `routeParamValidated(validate, errorMessage?)`

Creates a required input that throws if validation fails.

```typescript
slug = routeParamValidated((v) => /^[a-z0-9-]+$/.test(v), "Invalid slug format");
// InputSignalWithTransform<string, string>
```

### Query Params

#### `queryParam()`

Creates an optional string input for a query parameter.

```typescript
// URL: /search?q=angular
@Component({...})
class SearchComponent {
  q = queryParam(); // InputSignal<string | undefined>
}
```

#### `queryParamDefault(defaultValue)`

Creates a query param input with a default value. The transform ensures the output is always a string.

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
// showDetails() => true when ?showDetails=1
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

### Route Data

#### `routeData<T>()`

Creates a required input for resolver data or static route data.

```typescript
// Route: { path: 'users/:userId', resolve: { user: userResolver } }
@Component({...})
class UserComponent {
  user = routeData<User>(); // InputSignal<User>
}
```

#### `routeDataOptional<T>(defaultValue)`

Creates an optional route data input with a default value.

```typescript
config = routeDataOptional<AppConfig>({ theme: "light" });
// InputSignal<AppConfig>
```

---

## Guard Utilities

### `getTypedParams<Path>(route)`

Extracts typed params from an `ActivatedRouteSnapshot`. Returns the same `params` object cast to `PathParams<Path>`.

```typescript
import { getTypedParams } from "typesafe-routes";

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
import type { TypedRouteSnapshot } from "typesafe-routes";

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

```typescript
type ValidPaths<TRegistry extends RouteRegistry<ReadonlyArray<Route>>> = keyof RoutePathMap<
  TRegistry["routes"]
> &
  string;
```

Extracts the union of all valid path strings from a registry. Used to constrain path parameters in navigation functions and directives.

```typescript
type Paths = ValidPaths<typeof appRouter>;
// => '' | 'users' | 'users/:userId' | 'users/:userId/posts/:postId' | 'auth/login'
```

### `PathParams<Path>`

```typescript
type PathParams<'users/:userId/posts/:postId'> = { userId: string; postId: string }
type PathParams<'users'> = {}
```

Creates a params object type from a path string. Params with `:param` syntax become required `string` properties.

### `ExtractPathParams<Path>`

```typescript
type ExtractPathParams<'users/:userId/posts/:postId'> = 'userId' | 'postId'
type ExtractPathParams<'users'> = never
```

Extracts the union of parameter names from a path string.

### `HasParams<Path>`

```typescript
type HasParams<'users/:userId'> = true
type HasParams<'users'> = false
```

Boolean type: `true` if the path contains `:param` segments, `false` otherwise. Used internally to conditionally require `params` in navigation options.

### `NavigateOptions<Path>`

Typed options object for navigation. When `HasParams<Path>` is `true`, `params` is required. When `false`, `params` must not be provided.

```typescript
// HasParams<'users/:userId'> = true
type Opts = NavigateOptions<"users/:userId">;
// => { params: { userId: string }; queryParams?: ...; extras?: ... }

// HasParams<'users'> = false
type Opts = NavigateOptions<"users">;
// => { params?: never; queryParams?: ...; extras?: ... }
```

### `ExtractAllPaths<TRoutes>`

Recursively extracts all valid route paths from a routes array, including nested children with proper prefix joining.

### `RoutePathMap<TRoutes>`

Maps all extracted paths to themselves. Used internally to enable `keyof` extraction for `ValidPaths`.

### `JoinPath<A, B>`

Joins two path segments, handling empty strings correctly.

```typescript
type R = JoinPath<"users", ":userId">; // => 'users/:userId'
type R = JoinPath<"", "users">; // => 'users'
type R = JoinPath<"users", "">; // => 'users'
```

### `QueryParamValue`

```typescript
type QueryParamValue = string | number | boolean | string[] | null | undefined;
```

The set of types accepted as query parameter values by `buildUrl()` and navigation options.
