import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { type Routes, provideRouter } from "@angular/router";
import { registerRoutes } from "../types/route-registry";
import { createTypedRouter } from "./typed-navigation";

const routes = [
  { path: "", component: Component },
  { path: "users", component: Component },
  { path: "users/:userId", component: Component },
  {
    path: "products/:categoryId",
    children: [{ path: ":productId", component: Component }],
  },
] as const satisfies Routes;

const appRouter = registerRoutes(routes);
const { provideTypedRouter, injectTypedRouter } = createTypedRouter(appRouter);

describe("createTypedRouter", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter(appRouter.routes), provideTypedRouter],
    });
  });

  it("should provide a typed router via DI", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      expect(router).toBeTruthy();
      expect(typeof router.navigate).toBe("function");
      expect(typeof router.navigateByUrl).toBe("function");
      expect(typeof router.createUrlTree).toBe("function");
      expect(typeof router.createUrl).toBe("function");
      expect(typeof router.isActive).toBe("function");
      expect(typeof router.parseUrl).toBe("function");
      expect(typeof router.serializeUrl).toBe("function");
    });
  });

  it("should expose url property", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      expect(typeof router.url).toBe("string");
    });
  });

  it("should expose events observable", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      expect(router.events).toBeTruthy();
      expect(typeof router.events.subscribe).toBe("function");
    });
  });

  it("should expose routerState", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      expect(router.routerState).toBeTruthy();
    });
  });

  it("should expose angularRouter", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      expect(router.angularRouter).toBeTruthy();
      expect(typeof router.angularRouter.navigate).toBe("function");
    });
  });

  it("should create a URL string for a path without params", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const url = router.createUrl("users");
      expect(url).toBe("/users");
    });
  });

  it("should create a URL string for a path with params", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const url = router.createUrl("users/:userId", { params: { userId: "42" } });
      expect(url).toBe("/users/42");
    });
  });

  it("should create a URL string with query params", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const url = router.createUrl("users/:userId", {
        params: { userId: "42" },
        queryParams: { tab: "posts" },
      });
      expect(url).toBe("/users/42?tab=posts");
    });
  });

  it("should create a UrlTree", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const tree = router.createUrlTree("users");
      expect(tree).toBeTruthy();
      expect(router.serializeUrl(tree)).toBe("/users");
    });
  });

  it("should create a UrlTree with params", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const tree = router.createUrlTree("users/:userId", { params: { userId: "42" } });
      expect(tree).toBeTruthy();
      expect(router.serializeUrl(tree)).toBe("/users/42");
    });
  });

  it("should parse a URL", () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const tree = router.parseUrl("/users/42");
      expect(tree).toBeTruthy();
      expect(router.serializeUrl(tree)).toBe("/users/42");
    });
  });

  it("should navigate to a path without params", async () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const result = router.navigate("users");
      expect(result).toBeInstanceOf(Promise);
    });
  });

  it("should navigate to a path with params", async () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const result = router.navigate("users/:userId", { params: { userId: "42" } });
      expect(result).toBeInstanceOf(Promise);
    });
  });

  it("should navigateByUrl", async () => {
    TestBed.runInInjectionContext(() => {
      const router = injectTypedRouter();
      const result = router.navigateByUrl("users/:userId", {
        params: { userId: "42" },
        queryParams: { tab: "posts" },
      });
      expect(result).toBeInstanceOf(Promise);
    });
  });
});
