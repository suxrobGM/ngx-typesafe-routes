/**
 * TypedRouterLinkActive Directive
 *
 * A type-safe wrapper around Angular's RouterLink directive.
 * Provides compile-time checking for route paths and parameters.
 */
import { Directive, ElementRef, type OnChanges, Renderer2, inject, input } from "@angular/core";
import { type Route, Router } from "@angular/router";
import { type RouteRegistry } from "../types/route-registry";

type ValidPaths<TRegistry extends RouteRegistry<any>> =
  TRegistry extends RouteRegistry<infer R> ? keyof TRegistry["paths"] & string : never;

@Directive({
  selector: "[typedLinkActive]",
  standalone: true,
})
class TypedRouterLinkActiveDirective<TPaths> implements OnChanges {
  private readonly router = inject(Router);
  private readonly el = inject(ElementRef);
  private readonly renderer = inject(Renderer2);

  /**
   * Classes to add when active
   */
  public readonly activeClass = input.required<string | string[]>({ alias: "typedLinkActive" });

  /**
   * The path to check for active state
   */
  public readonly typedLinkActiveFor = input<TPaths>();

  /**
   * Options for active matching
   */
  public readonly typedLinkActiveOptions = input<{ exact?: boolean }>({ exact: false });

  private isActive = false;

  ngOnChanges(): void {
    this.updateActiveState();
  }

  private updateActiveState(): void {
    if (!this.typedLinkActiveFor) {
      return;
    }

    const path = "/" + this.typedLinkActiveFor();
    const pattern = path.replace(/:(\w+)/g, "[^/]+");
    const regex = new RegExp(this.typedLinkActiveOptions().exact ? `^${pattern}$` : `^${pattern}`);

    const currentPath = this.router.url.split("?")[0].split("#")[0];
    const nowActive = regex.test(currentPath);

    if (nowActive !== this.isActive) {
      this.isActive = nowActive;
      this.updateClasses();
    }
  }

  private updateClasses(): void {
    const activeClass = this.activeClass();
    const classes = Array.isArray(activeClass) ? activeClass : activeClass.split(" ");

    for (const cls of classes) {
      if (this.isActive) {
        this.renderer.addClass(this.el.nativeElement, cls);
      } else {
        this.renderer.removeClass(this.el.nativeElement, cls);
      }
    }
  }
}

/**
 * Creates a TypedRouterLinkActive directive.
 *
 * @example
 * ```typescript
 * export const TypedRouterLinkActive = createTypedRouterLinkActive(appRoutes);
 *
 * @Component({
 *   imports: [TypedRouterLink, TypedRouterLinkActive],
 *   template: `
 *     <a [typedLink]="'users'"
 *        [typedLinkActive]="'active'"
 *        [typedLinkActiveOptions]="{ exact: false }">
 *       Users
 *     </a>
 *   `
 * })
 * ```
 */
export function createTypedRouterLinkActive<TRegistry extends RouteRegistry<ReadonlyArray<Route>>>(
  _registry: TRegistry,
) {
  return TypedRouterLinkActiveDirective<ValidPaths<TRegistry>>;
}
