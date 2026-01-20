/**
 * TypedRouterLink Directive
 *
 * A type-safe wrapper around Angular's RouterLink directive.
 * Provides compile-time checking for route paths and parameters.
 */
import {
  Directive,
  HostBinding,
  HostListener,
  type OnChanges,
  type OnDestroy,
  type SimpleChanges,
  inject,
  input,
} from "@angular/core";
import { type Route, Router } from "@angular/router";
import { type RouteRegistry, buildPath } from "../types/route-registry";
import type { PathParams } from "../types/route-types";

type ValidPaths<TRegistry extends RouteRegistry<any>> =
  TRegistry extends RouteRegistry<infer R> ? keyof TRegistry["paths"] & string : never;

@Directive({ selector: "[typedLink]", standalone: true })
class TypedRouterLinkDirective<
  TPaths extends ValidPaths<TRegistry>,
  TRegistry extends RouteRegistry<any>,
>
  implements OnChanges, OnDestroy
{
  private readonly router = inject(Router);

  /**
   * The route path to navigate to
   */
  public readonly path = input.required<TPaths>({ alias: "typedLink" });

  /**
   * Path parameters for the route
   */
  public readonly linkParams = input<Record<string, string | number>>();

  /**
   * Query parameters
   */

  public readonly queryParams = input<Record<string, string | number | boolean | string[]>>();

  /**
   * URL fragment
   */
  public readonly fragment = input<string>();

  /**
   * Target for the link
   */
  public readonly target = input<string>();

  /**
   * Whether to replace the URL (instead of push)
   */
  public readonly replaceUrl = input<boolean>();

  /**
   * Skip location change
   */
  public readonly skipLocationChange = input<boolean>();

  /**
   * Preserve fragment from current URL
   */
  public readonly preserveFragment = input<boolean>();

  /**
   * The computed href
   */
  @HostBinding("attr.href")
  public href: string | null = null;

  private updateHref(): void {
    if (!this.path()) {
      this.href = null;
      return;
    }

    try {
      const params = this.linkParams() ?? {};
      let url = buildPath(this.path(), params as PathParams<typeof this.path>);

      // Add query params
      if (this.queryParams()) {
        const searchParams = new URLSearchParams();
        for (const [key, value] of Object.entries(this.queryParams()!)) {
          if (value === null || value === undefined) continue;
          if (Array.isArray(value)) {
            value.forEach((v) => searchParams.append(key, v));
          } else {
            searchParams.set(key, String(value));
          }
        }
        const query = searchParams.toString();
        if (query) {
          url += "?" + query;
        }
      }

      // Add fragment
      if (this.fragment()) {
        url += "#" + this.fragment();
      }

      this.href = url;
    } catch {
      this.href = null;
    }
  }

  ngOnChanges(_changes: SimpleChanges): void {
    this.updateHref();
  }

  ngOnDestroy(): void {}

  @HostListener("click", ["$event"])
  onClick(event: MouseEvent): boolean {
    // Allow normal behavior for modified clicks
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return true;
    }

    // Allow normal behavior for target="_blank" etc
    if (this.target && this.target() !== "_self") {
      return true;
    }

    event.preventDefault();

    if (!this.href) {
      return false;
    }

    const params = this.linkParams() ?? {};
    const url = buildPath(this.path(), params as PathParams<typeof this.path>);

    this.router.navigate([url], {
      queryParams: this.queryParams() as Record<string, unknown>,
      fragment: this.fragment(),
      replaceUrl: this.replaceUrl(),
      skipLocationChange: this.skipLocationChange(),
      preserveFragment: this.preserveFragment(),
    });

    return false;
  }
}

/**
 * Creates a TypedRouterLink directive for the given route registry.
 *
 * @example
 * ```typescript
 * export const TypedRouterLink = createTypedRouterLink(appRoutes);
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
  return TypedRouterLinkDirective<ValidPaths<TRegistry>, TRegistry>;
}
