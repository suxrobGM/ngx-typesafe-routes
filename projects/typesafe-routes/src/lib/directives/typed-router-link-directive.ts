/**
 * TypedRouterLink Directive
 *
 * A type-safe wrapper around Angular's RouterLink directive.
 * Delegates all DOM behavior (click handling, href, aria, prefetch)
 * to Angular's RouterLink via hostDirectives composition.
 */
import { Directive, effect, inject, input } from "@angular/core";
import { type Route, RouterLink } from "@angular/router";
import { type RouteRegistry, type ValidPaths, buildPath } from "../types/route-registry";

/**
 * Creates a TypedRouterLink directive for the given route registry.
 * The returned directive class can be imported in component `imports`.
 *
 * @example
 * ```typescript
 * export const TypedRouterLink = createTypedRouterLink(appRouter);
 *
 * @Component({
 *   imports: [TypedRouterLink],
 *   template: `
 *     <a [typedLink]="'users/:userId'" [linkParams]="{ userId: '123' }">
 *       User 123
 *     </a>
 *   `
 * })
 * class MyComponent {}
 * ```
 */
export function createTypedRouterLink<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  type Paths = ValidPaths<TRegistry>;

  @Directive({
    selector: "[typedLink]",
    standalone: true,
    hostDirectives: [
      {
        directive: RouterLink,
        inputs: [
          "queryParams",
          "fragment",
          "queryParamsHandling",
          "preserveFragment",
          "skipLocationChange",
          "replaceUrl",
          "target",
          "state",
          "info",
          "relativeTo",
        ],
      },
    ],
  })
  class TypedRouterLinkDirective {
    /** @internal */
    readonly _routerLink = inject(RouterLink);

    /** The typed route path to navigate to. */
    readonly path = input.required<Paths>({ alias: "typedLink" });

    /** Path parameters for substitution (e.g., `{ userId: '123' }`). */
    readonly linkParams = input<Record<string, string>>();

    constructor() {
      effect(() => {
        const params = this.linkParams() ?? {};
        const resolved = buildPath(this.path() as string, params as any);
        this._routerLink.routerLink = resolved;
      });
    }
  }

  return TypedRouterLinkDirective;
}
