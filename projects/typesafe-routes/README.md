# typesafe-routes

Compile-time type-safe routing for Angular. Get red squiggles in your IDE for invalid paths, missing params, and wrong param names.

```typescript
nav.navigate("users/:userId", { params: { userId: "42" } }); // OK
nav.navigate("invalid/path"); // TS error: not assignable to ValidPaths
nav.navigate("users/:userId"); // TS error: options required
nav.navigate("users/:userId", { params: { wrong: "42" } }); // TS error: wrong param name
```

## Requirements

- Angular 17+ (standalone components, signal inputs)
- TypeScript 5.0+

## Installation

```bash
npm install typesafe-routes
```

## Quick Start

### 1. Define routes with `as const satisfies Routes`

```typescript
// app.routes.ts
import { Routes } from "@angular/router";
import { registerRoutes } from "typesafe-routes";

const routes = [
  { path: "", component: HomeComponent },
  { path: "users", component: UserListComponent },
  {
    path: "users/:userId",
    component: UserDetailComponent,
    children: [{ path: "posts/:postId", component: PostComponent }],
  },
  { path: "auth/login", component: LoginComponent },
] as const satisfies Routes;

export const appRouter = registerRoutes(routes);
```

> **Why `as const`?** It preserves literal path strings so TypeScript can extract `'users/:userId'` instead of `string`. **`satisfies Routes`** validates the config against Angular's route interface. **`registerRoutes()`** wraps it in a typed registry.

### 2. Provide routes

```typescript
// app.config.ts
import { provideRouter, withComponentInputBinding } from "@angular/router";
import { appRouter } from "./app.routes";

export const appConfig = {
  providers: [provideRouter(appRouter.routes, withComponentInputBinding())],
};
```

### 3. Navigate with type safety

```typescript
import { typedNavigator } from "typesafe-routes";
import { appRouter } from "./app.routes";

@Component({...})
export class MyComponent {
  private nav = typedNavigator(appRouter);

  goToUser(id: string) {
    this.nav.navigate("users/:userId", {
      params: { userId: id },
      queryParams: { tab: "posts" },
    });
  }

  goHome() {
    this.nav.navigate(""); // no params required for root
  }
}
```

---

## Features

### Typed Navigation

`typedNavigator()` must be called in an injection context (constructor, field initializer, or `runInInjectionContext`). The returned object can be used from anywhere, including event handlers.

```typescript
private nav = typedNavigator(appRouter);

// Navigate by commands (uses router.navigate)
this.nav.navigate("users/:userId", { params: { userId: "42" } });

// Navigate by full URL (uses router.navigateByUrl)
this.nav.navigateByUrl("users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});

// Create a UrlTree (useful in guards)
const tree = this.nav.createUrlTree("auth/login");

// Build a URL string
const url = this.nav.createUrl("users/:userId", { params: { userId: "42" } });

// Check if path is active
if (this.nav.isActive("users")) { ... }

// Access current URL or the underlying Angular Router
this.nav.url;
this.nav.angularRouter;
```

**Standalone functions** for guards and one-off use:

```typescript
import { typedCreateUrl, typedCreateUrlTree } from "typesafe-routes";

// In a guard (requires injection context):
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() || typedCreateUrlTree(appRouter, "auth/login");
};

// Pure function, no DI required:
const url = typedCreateUrl(appRouter, "users/:userId", {
  params: { userId: "42" },
  queryParams: { tab: "posts" },
});
// => "/users/42?tab=posts"
```

### Typed Router Directives

Thin wrappers over Angular's `RouterLink` and `RouterLinkActive` that add compile-time path validation. All original `RouterLink` inputs (`queryParams`, `fragment`, `target`, `state`, etc.) remain available.

```typescript
// typed-router.ts — create once, import everywhere
import { createTypedRouterLink, createTypedRouterLinkActive } from "typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLink = createTypedRouterLink(appRouter);
export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

```html
<!-- Use in templates -->
<a [typedLink]="'users'" [typedLinkActive]="'active'">Users</a>

<a
  [typedLink]="'users/:userId'"
  [linkParams]="{ userId: user.id }"
  [typedLinkActive]="'active highlighted'"
  [routerLinkActiveOptions]="{ exact: true }"
>
  {{ user.name }}
</a>

<a [typedLink]="'users'" [queryParams]="{ page: '2' }" fragment="top" target="_blank">
  Users Page 2
</a>
```

### Signal Inputs for Route Parameters

Semantic wrappers around Angular's `input()` for use with `withComponentInputBinding()`. Angular binds route params, query params, and resolver data to component inputs by matching the field name.

```typescript
import {
  routeParam, routeParamOptional, routeParamNumber,
  queryParam, queryParamDefault, queryParamBoolean, queryParamNumber,
  routeData,
} from 'typesafe-routes';

@Component({...})
export class UserComponent {
  // Route params (:userId in the path)
  userId = routeParam();                    // InputSignal<string> — required
  page = routeParamOptional("1");           // InputSignal<string> — defaults to '1'
  id = routeParamNumber();                  // InputSignalWithTransform<number, string>

  // Query params (?search=...&tab=...)
  search = queryParam();                    // InputSignal<string | undefined>
  tab = queryParamDefault("overview");       // defaults to 'overview'
  showDetails = queryParamBoolean(false);    // parses 'true', '1', 'yes'
  limit = queryParamNumber(10);              // parses to number

  // Resolver data
  user = routeData<User>();                 // InputSignal<User>
}
```

**Custom transforms and validation:**

```typescript
import {
  routeParamTransform,
  routeParamTransformOptional,
  routeParamValidated,
  queryParamTransform,
} from "typesafe-routes";

@Component({...})
export class ProductComponent {
  // Transform string to number
  productId = routeParamTransform(v => parseInt(v, 10));

  // Optional with transform
  version = routeParamTransformOptional(1, v => v ? parseInt(v, 10) : 1);

  // Throws on invalid input
  slug = routeParamValidated(
    v => /^[a-z0-9-]+$/.test(v),
    "Invalid slug format",
  );

  // Query param with custom transform
  sort = queryParamTransform(
    v => (v === "asc" || v === "desc" ? v : "asc") as "asc" | "desc",
    "asc",
  );
}
```

### Typed Guards

Access route params with type safety in Angular's functional guards:

```typescript
import { getTypedParams } from "typesafe-routes";
import type { TypedRouteSnapshot } from "typesafe-routes";

// Option A: getTypedParams helper
export const userGuard: CanActivateFn = (route) => {
  const { userId } = getTypedParams<"users/:userId">(route);
  return inject(AuthService).canAccess(userId); // userId: string
};

// Option B: cast to TypedRouteSnapshot
export const postGuard: CanActivateFn = (route) => {
  const snap = route as TypedRouteSnapshot<"users/:userId/posts/:postId">;
  snap.params.userId; // string
  snap.params.postId; // string
  snap.params.badName; // TS error: property does not exist
  return inject(PostService).exists(snap.params.userId, snap.params.postId);
};
```

### Path Utilities

Low-level functions for building paths and URLs:

```typescript
import { buildPath, buildUrl, getParamNames, validateParams } from "typesafe-routes";

buildPath("users/:userId", { userId: "42" });
// => "/users/42"

buildUrl("users/:userId", { userId: "42" }, { tab: "posts" });
// => "/users/42?tab=posts"

validateParams("users/:userId", { userId: "42" });
// => true

getParamNames("users/:userId/posts/:postId");
// => ['userId', 'postId']
```

---

## How Type Safety Works

The library uses TypeScript template literal types to extract route information at compile time. No runtime overhead for type checking.

```text
as const satisfies Routes     =>  preserves literal path strings ('users/:userId')
        |
registerRoutes(routes)        =>  RouteRegistry<TRoutes> captures literal types via <const TRoutes>
        |
ExtractAllPaths<TRoutes>      =>  recursively extracts: '' | 'users' | 'users/:userId' | ...
        |
ValidPaths<TRegistry>         =>  keyof RoutePathMap & string = union of all valid path strings
        |
HasParams<Path>               =>  conditionally requires { params: { userId: string } }
        |
IDE / tsc                     =>  red squiggles for invalid paths, missing params, wrong names
```

The type chain:

- `ExtractParamFromSegment<':id'>` => `'id'`
- `ExtractPathParams<'users/:userId/posts/:postId'>` => `'userId' | 'postId'`
- `PathParams<'users/:userId'>` => `{ userId: string }`
- `HasParams<'users/:userId'>` => `true`
- `HasParams<'users'>` => `false`

---

## API Reference

See the full [API Reference](../../docs/api-reference.md) for detailed documentation of every export with signatures, parameters, return types, and examples.

## License

MIT
