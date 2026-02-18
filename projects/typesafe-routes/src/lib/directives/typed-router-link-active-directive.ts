/**
 * TypedRouterLinkActive Directive
 *
 * A type-safe wrapper around Angular's RouterLinkActive directive.
 * Delegates all active-state tracking to Angular's RouterLinkActive
 * via hostDirectives composition, ensuring correct reactive updates
 * on navigation events.
 */
import { Directive, effect, inject, input } from "@angular/core";
import { type Route, RouterLinkActive } from "@angular/router";
import { type RouteRegistry } from "../types/route-registry";

/**
 * Creates a TypedRouterLinkActive directive for the given route registry.
 *
 * @example
 * ```typescript
 * export const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);
 *
 * @Component({
 *   imports: [TypedRouterLink, TypedRouterLinkActive],
 *   template: `
 *     <a [typedLink]="'users'"
 *        [typedLinkActive]="'active'"
 *        [routerLinkActiveOptions]="{ exact: false }">
 *       Users
 *     </a>
 *   `
 * })
 * class MyComponent {}
 * ```
 */
export function createTypedRouterLinkActive<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  @Directive({
    selector: "[typedLinkActive]",
    standalone: true,
    hostDirectives: [
      {
        directive: RouterLinkActive,
        inputs: ["routerLinkActiveOptions"],
        outputs: ["isActiveChange"],
      },
    ],
  })
  class TypedRouterLinkActiveDirective {
    /** @internal */
    public readonly _rla = inject(RouterLinkActive);

    /** CSS class(es) to add when the route is active. */
    public readonly activeClass = input.required<string | string[]>({ alias: "typedLinkActive" });

    constructor() {
      effect(() => {
        const classes = this.activeClass();
        this._rla.routerLinkActive = Array.isArray(classes) ? classes : [classes];
      });
    }
  }

  return TypedRouterLinkActiveDirective;
}
