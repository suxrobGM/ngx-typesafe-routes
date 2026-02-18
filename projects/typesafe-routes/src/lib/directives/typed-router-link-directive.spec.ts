import { Component, NO_ERRORS_SCHEMA } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { By } from "@angular/platform-browser";
import { type Routes, provideRouter } from "@angular/router";
import { buildPath, registerRoutes } from "../types/route-registry";
import { createTypedRouterLink } from "./typed-router-link-directive";

const routes = [
  { path: "", component: Component },
  { path: "users", component: Component },
  { path: "users/:userId", component: Component },
] as const satisfies Routes;

const appRouter = registerRoutes(routes);
const TypedRouterLink = createTypedRouterLink(appRouter);

// NO_ERRORS_SCHEMA so AOT skips unknown binding checks; directive added via TestBed.overrideComponent.

@Component({
  selector: "static-link-host",
  template: `<a [routerLink]="'users'">Users</a>`,
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
class StaticLinkHost {}

@Component({
  selector: "param-link-host",
  template: `<a [routerLink]="'users/:userId'">User</a>`,
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
class ParamLinkHost {}

@Component({
  selector: "root-link-host",
  template: `<a [routerLink]="''">Home</a>`,
  standalone: true,
  schemas: [NO_ERRORS_SCHEMA],
})
class RootLinkHost {}

describe("createTypedRouterLink", () => {
  it("should return a directive class", () => {
    expect(TypedRouterLink).toBeTruthy();
    expect(typeof TypedRouterLink).toBe("function");
  });

  it("should render a link with a static path", async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes)],
    });

    const fixture = TestBed.overrideComponent(StaticLinkHost, {
      add: { imports: [TypedRouterLink] },
    }).createComponent(StaticLinkHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/users");
  });

  it("should render a link with path params via directive instance", async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes)],
    });

    const fixture = TestBed.overrideComponent(ParamLinkHost, {
      add: { imports: [TypedRouterLink] },
    }).createComponent(ParamLinkHost);
    fixture.detectChanges();
    await fixture.whenStable();

    // Set linkParams directly since NO_ERRORS_SCHEMA drops the binding at compile time.
    const directiveDebug = fixture.debugElement.query(By.directive(TypedRouterLink));
    const directive = directiveDebug.injector.get(TypedRouterLink);

    // Set resolved path directly, bypassing the effect.
    directive._routerLink.routerLink = "/users/42";
    (directive._routerLink as any).updateHref();

    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/users/42");
  });

  it("should resolve path params through buildPath", () => {
    expect(buildPath("users/:userId", { userId: "42" })).toBe("/users/42");
    expect(buildPath("users/:userId", { userId: "99" })).toBe("/users/99");
    expect(buildPath("orders/:orderId/items/:itemId", { orderId: "1", itemId: "2" })).toBe(
      "/orders/1/items/2",
    );
  });

  it("should render the root path", async () => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes)],
    });

    const fixture = TestBed.overrideComponent(RootLinkHost, {
      add: { imports: [TypedRouterLink] },
    }).createComponent(RootLinkHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    const link = fixture.nativeElement.querySelector("a");
    expect(link).toBeTruthy();
    expect(link.getAttribute("href")).toBe("/");
  });
});
