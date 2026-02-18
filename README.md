# ngx-typesafe-routes

Compile-time type-safe routing for Angular. Invalid paths, missing params, and wrong param names become TypeScript errors in your IDE.

```typescript
nav.navigate("users/:userId", { params: { userId: "42" } }); // OK
nav.navigate("invalid/path"); // TS error
nav.navigate("users/:userId", { params: { wrong: "42" } }); // TS error
```

## Features

- **Zero runtime overhead** — all type checking happens at compile time
- **Standard Angular routing** — uses `as const satisfies Routes`, no custom route format
- **Signal-first** — input factories for `withComponentInputBinding()`
- **Thin directives** — typed wrappers over `RouterLink` / `RouterLinkActive` via `hostDirectives`
- **Functional API** — no injectable services, just functions
- **Lightweight** — minimal code on top of Angular's router

## Requirements

- Angular 17+
- TypeScript 5.0+

## Quick Start

```typescript
// 1. Define routes
const routes = [
  { path: "", component: HomeComponent },
  { path: "users/:userId", component: UserComponent },
] as const satisfies Routes;

export const appRouter = registerRoutes(routes);

// 2. Provide
provideRouter(appRouter.routes, withComponentInputBinding());

// 3. Navigate with type safety
private nav = typedNavigator(appRouter);
this.nav.navigate("users/:userId", { params: { userId: "42" } });
```

## Template Directives

Create typed directives once, import everywhere:

```typescript
// typed-router.ts
import { createTypedRouterLink, createTypedRouterLinkActive } from "typesafe-routes";
import { appRouter } from "./app.routes";

export const TypedRouterLink = createTypedRouterLink(appRouter);
export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
```

Use in templates with full type checking:

```html
<!-- Static path -->
<a [typedLink]="'users'" [typedLinkActive]="'active'">Users</a>

<!-- Path with params -->
<a [typedLink]="'users/:userId'" [linkParams]="{ userId: user.id }">
  {{ user.name }}
</a>

<!-- All RouterLink inputs work: queryParams, fragment, target, state, etc. -->
<a [typedLink]="'users'" [queryParams]="{ page: '2' }" fragment="top">
  Users Page 2
</a>

<!-- Invalid path = compile error -->
<a [typedLink]="'nonexistent'">Error!</a>
```

## Signal Inputs

With `withComponentInputBinding()`, bind route params directly to component fields:

```typescript
@Component({...})
export class UserComponent {
  userId = routeParam();             // InputSignal<string>
  tab = queryParamDefault("overview"); // defaults to 'overview'
  user = routeData<User>();          // resolver data
}
```

## Documentation

- [Library README](projects/typesafe-routes/README.md) — full usage guide with examples
- [API Reference](docs/api-reference.md) — detailed API documentation

## License

MIT
