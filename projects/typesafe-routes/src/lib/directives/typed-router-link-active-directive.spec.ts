import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { type Routes, provideRouter } from "@angular/router";
import { registerRoutes } from "../types/route-registry";
import { createTypedRouterLinkActive } from "./typed-router-link-active-directive";
import { createTypedRouterLink } from "./typed-router-link-directive";

// =============================================================================
// Test Route Setup
// =============================================================================

const routes = [
  { path: "", component: Component },
  { path: "users", component: Component },
  { path: "users/:userId", component: Component },
] as const satisfies Routes;

const appRouter = registerRoutes(routes);
const TypedRouterLink = createTypedRouterLink(appRouter);
const TypedRouterLinkActive = createTypedRouterLinkActive(appRouter);

// =============================================================================
// Host Components — use NO_ERRORS_SCHEMA so AOT skips unknown binding checks.
// The directive is added at runtime via TestBed.overrideComponent.
// =============================================================================

@Component({
  template: `<a [routerLink]="'users'" [routerLinkActive]="'active'">Users</a>`,
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
class SingleClassHost {}

@Component({
  template: `<a [routerLink]="'users'" [routerLinkActive]="['active', 'highlighted']">Users</a>`,
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
class MultiClassHost {}

// =============================================================================
// createTypedRouterLinkActive
// =============================================================================

describe("createTypedRouterLinkActive", () => {
  it("should return a directive class", () => {
    expect(TypedRouterLinkActive).toBeTruthy();
    expect(typeof TypedRouterLinkActive).toBe("function");
  });

  it("should render with routerLinkActive alongside routerLink", async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes)],
    });

    const fixture = TestBed.overrideComponent(SingleClassHost, {
      add: { imports: [TypedRouterLink, TypedRouterLinkActive] },
    }).createComponent(SingleClassHost);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
  });

  it("should accept an array of CSS classes", async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes)],
    });

    const fixture = TestBed.overrideComponent(MultiClassHost, {
      add: { imports: [TypedRouterLink, TypedRouterLinkActive] },
    }).createComponent(MultiClassHost);
    await fixture.whenStable();

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
  });
});
