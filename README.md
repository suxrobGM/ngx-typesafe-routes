# ngx-typesafe-routes

**Compile-time type-safe routing for Angular.** Invalid paths, missing params, and wrong param names become red squiggles in your IDE - before you even run the app.

```typescript
nav.navigate("users/:userId", { params: { userId: "42" } }); // OK
nav.navigate("invalid/path");                                  // TS error: not assignable to ValidPaths
nav.navigate("users/:userId");                                 // TS error: options required
nav.navigate("users/:userId", { params: { wrong: "42" } });   // TS error: wrong param name
```

**Zero runtime overhead.** Standard Angular routing. Signal-first. No services - just functions.

## Install

```bash
npm install ngx-typesafe-routes
```

> Angular 17+ and TypeScript 5.0+ required.

## Setup (3 steps)

**1. Define routes** - add `as const satisfies Routes` to preserve literal types:

```typescript
// app.routes.ts
import { registerRoutes } from "ngx-typesafe-routes";

const routes = [
  { path: "", component: HomeComponent },
  { path: "users", component: UserListComponent },
  { path: "users/:userId", component: UserDetailComponent },
  { path: "auth/login", component: LoginComponent },
] as const satisfies Routes;

export const appRouter = registerRoutes(routes);
```

**2. Provide** - pass `appRouter.routes` to Angular's router:

```typescript
// app.config.ts
provideRouter(appRouter.routes, withComponentInputBinding());
```

**3. Use** - every path and param is now type-checked:

```typescript
@Component({...})
export class MyComponent {
  private nav = typedNavigator(appRouter);

  goToUser(id: string) {
    this.nav.navigate("users/:userId", { params: { userId: id } });
  }
}
```

---

## Navigation

`typedNavigator()` captures `inject(Router)` at construction time. Methods work anywhere - event handlers, callbacks, etc.

```typescript
private nav = typedNavigator(appRouter);

this.nav.navigate("users/:userId", { params: { userId: "42" } });
this.nav.navigateByUrl("users/:userId", { params: { userId: "42" }, queryParams: { tab: "posts" } });
this.nav.createUrlTree("auth/login");           // UrlTree for guards
this.nav.createUrl("users/:userId", { params: { userId: "42" } }); // "/users/42"
this.nav.isActive("users");                     // boolean
```

**For guards** - standalone functions that work in any injection context:

```typescript
export const authGuard: CanActivateFn = () => {
  return inject(AuthService).isLoggedIn() || typedCreateUrlTree(appRouter, "auth/login");
};
```

## Template Directives

Thin wrappers over `RouterLink` / `RouterLinkActive`. All original inputs (`queryParams`, `fragment`, `target`, etc.) still work.

```typescript
// typed-router.ts - create once, import everywhere
export const TypedRouterLink = createTypedRouterLink(appRouter);
export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

```html
<a [typedLink]="'users'" [typedLinkActive]="'active'">Users</a>

<a [typedLink]="'users/:userId'"
   [linkParams]="{ userId: user.id }"
   [typedLinkActive]="'active'"
   [routerLinkActiveOptions]="{ exact: true }">
  {{ user.name }}
</a>

<a [typedLink]="'nonexistent'">Compile error!</a>
```

## Signal Inputs

Semantic wrappers for `withComponentInputBinding()`. Angular binds route/query params to fields by name.

```typescript
@Component({...})
export class UserComponent {
  userId = routeParam();                // InputSignal<string> - required
  id     = routeParamNumber();          // auto-parsed to number
  tab    = queryParamDefault("overview"); // defaults to 'overview'
  debug  = queryParamBoolean(false);    // parses 'true', '1', 'yes'
  user   = routeData<User>();           // resolver data
}
```

**Transforms and validation:**

```typescript
productId = routeParamTransform(v => parseInt(v, 10));
slug = routeParamValidated(v => /^[a-z0-9-]+$/.test(v), "Invalid slug");
sort = queryParamTransform(v => (v === "desc" ? "desc" : "asc") as "asc" | "desc", "asc");
```

## Typed Guards

```typescript
export const userGuard: CanActivateFn = (route) => {
  const { userId } = getTypedParams<"users/:userId">(route);
  return inject(AuthService).canAccess(userId); // userId: string
};
```

## How It Works

TypeScript template literal types extract route info at compile time. No runtime cost.

```text
as const satisfies Routes  ->  registerRoutes()  ->  RouteRegistry<TRoutes>
  ->  ExtractAllPaths<TRoutes>  ->  ValidPaths<TRegistry>
  ->  HasParams<Path>  ->  conditionally requires { params: { userId: string } }
  ->  IDE red squiggles for invalid paths, missing params, wrong names
```

## API Reference

See the full [API Reference](docs/api-reference.md) for detailed docs on every export.

## License

MIT
