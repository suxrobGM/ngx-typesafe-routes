# ngx-typesafe-routes

**Compile-time type-safe routing for Angular.** Invalid paths, missing params, and wrong param names become red squiggles in your IDE — before you even run the app.

```typescript
router.navigate("users/:userId", { params: { userId: "42" } }); // OK
router.navigate("invalid/path"); // TS error: not assignable to ValidPaths
router.navigate("users/:userId"); // TS error: options required
router.navigate("users/:userId", { params: { wrong: "42" } }); // TS error: wrong param name
```

**Zero runtime overhead.** Standard Angular routing. Signal-first. Matches Angular's API.

## Install

```bash
npm install ngx-typesafe-routes
```

> Angular 17+ and TypeScript 5.0+ required.

## Setup (3 steps)

**1. Define routes** — add `as const satisfies Routes` to preserve literal types:

```typescript
// app.routes.ts
import {
  createTypedRouter,
  createTypedRouterLink,
  createTypedRouterLinkActive,
  registerRoutes,
} from "ngx-typesafe-routes";

const routes = [
  { path: "", component: HomeComponent },
  { path: "users", component: UserListComponent },
  { path: "users/:userId", component: UserDetailComponent },
  { path: "auth/login", component: LoginComponent },
] as const satisfies Routes;

export const appRouter = registerRoutes(routes);
export const { provideTypedRouter, injectTypedRouter } = createTypedRouter(appRouter);
export const TypedRouterLink = createTypedRouterLink(appRouter);
export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

**2. Provide** — pass `appRouter.routes` to Angular's router and register the typed router:

```typescript
// app.config.ts
providers: [provideRouter(appRouter.routes, withComponentInputBinding()), provideTypedRouter];
```

**3. Use** — every path and param is now type-checked:

```typescript
import { injectTypedRouter } from './app.routes';

@Component({...})
export class MyComponent {
  private router = injectTypedRouter();

  goToUser(id: string) {
    this.router.navigate("users/:userId", { params: { userId: id } });
  }
}
```

---

## Navigation

`injectTypedRouter()` returns a typed router object. Call it in an injection context (field initializer, constructor). Methods work anywhere — event handlers, callbacks, etc.

```typescript
private router = injectTypedRouter();

this.router.navigate("users/:userId", { params: { userId: "42" } });
this.router.navigateByUrl("users/:userId", { params: { userId: "42" }, queryParams: { tab: "posts" } });
this.router.createUrlTree("auth/login");            // UrlTree for guards
this.router.createUrl("users/:userId", { params: { userId: "42" } }); // "/users/42"
this.router.isActive("users");                      // boolean
this.router.url;                                     // current URL
this.router.events;                                  // router events observable
```

## Template Directives

Thin wrappers over `RouterLink` / `RouterLinkActive` using the same selectors. All original inputs (`queryParams`, `fragment`, `target`, etc.) still work.

```typescript
// app.routes.ts — create once, import everywhere
export const TypedRouterLink = createTypedRouterLink(appRouter);
export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

```html
<a [routerLink]="'users'" [routerLinkActive]="'active'">Users</a>

<a
  [routerLink]="'users/:userId'"
  [routerLinkParams]="{ userId: user.id }"
  [routerLinkActive]="'active'"
  [routerLinkActiveOptions]="{ exact: true }"
>
  {{ user.name }}
</a>

<a [routerLink]="'nonexistent'">Compile error!</a>
```

## Signal Inputs

Route parameter inputs that mirror Angular's `input()` / `input.required()` API. Import `input` from the library instead of `@angular/core` for route params.

```typescript
import { input, queryParam, queryParamNumber, queryParamBoolean } from "ngx-typesafe-routes";

@Component({...})
export class UserComponent {
  userId = input.required();                  // InputSignal<string> — required
  tab    = input("overview");                 // optional with default
  id     = input.number();                    // auto-parsed to number
  slug   = input.transform(v => v.toUpperCase()); // custom transform
  code   = input.validated(v => v.length === 6);   // validated

  // Query params
  page   = queryParamNumber(1);               // numeric query param
  debug  = queryParamBoolean(false);          // boolean query param
  q      = queryParam();                      // optional string query param
}
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
