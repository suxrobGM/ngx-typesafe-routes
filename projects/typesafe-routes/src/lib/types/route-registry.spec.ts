import { type Routes } from "@angular/router";
import {
  buildPath,
  buildUrl,
  getParamNames,
  registerRoutes,
  validateParams,
} from "./route-registry";

// =============================================================================
// registerRoutes
// =============================================================================

describe("registerRoutes", () => {
  it("should return a registry wrapping the routes", () => {
    const routes = [{ path: "", component: {} as any }] as const satisfies Routes;
    const registry = registerRoutes(routes);
    expect(registry.routes).toBe(routes);
  });

  it("should preserve the same route references", () => {
    const routes = [
      { path: "users", component: {} as any },
      { path: "users/:userId", component: {} as any },
    ] as const satisfies Routes;
    const registry = registerRoutes(routes);
    expect(registry.routes.length).toBe(2);
    expect(registry.routes[0]).toBe(routes[0]);
    expect(registry.routes[1]).toBe(routes[1]);
  });
});

// =============================================================================
// buildPath
// =============================================================================

describe("buildPath", () => {
  it("should return / for empty path", () => {
    expect(buildPath("", {} as any)).toBe("/");
  });

  it("should add leading slash to simple path", () => {
    expect(buildPath("users", {} as any)).toBe("/users");
  });

  it("should not double leading slash", () => {
    expect(buildPath("/users", {} as any)).toBe("/users");
  });

  it("should substitute a single param", () => {
    expect(buildPath("users/:userId", { userId: "42" } as any)).toBe("/users/42");
  });

  it("should substitute multiple params", () => {
    expect(
      buildPath("products/:categoryId/:productId", {
        categoryId: "electronics",
        productId: "99",
      } as any),
    ).toBe("/products/electronics/99");
  });

  it("should URI-encode param values", () => {
    expect(buildPath("search/:query", { query: "hello world" } as any)).toBe(
      "/search/hello%20world",
    );
  });

  it("should handle params with special characters", () => {
    expect(buildPath("users/:userId", { userId: "a/b" } as any)).toBe("/users/a%2Fb");
  });
});

// =============================================================================
// buildUrl
// =============================================================================

describe("buildUrl", () => {
  it("should build URL without query params", () => {
    expect(buildUrl("users/:userId", { userId: "42" } as any)).toBe("/users/42");
  });

  it("should append query params", () => {
    const url = buildUrl("users/:userId", { userId: "42" } as any, {
      tab: "posts",
      page: "1",
    });
    expect(url).toBe("/users/42?tab=posts&page=1");
  });

  it("should handle array query params", () => {
    const url = buildUrl("users", {} as any, { tags: ["angular", "typescript"] });
    expect(url).toBe("/users?tags=angular&tags=typescript");
  });

  it("should omit null query params", () => {
    const url = buildUrl("users", {} as any, { tab: "posts", debug: null });
    expect(url).toBe("/users?tab=posts");
  });

  it("should omit undefined query params", () => {
    const url = buildUrl("users", {} as any, { tab: "posts", debug: undefined });
    expect(url).toBe("/users?tab=posts");
  });

  it("should handle number query param values", () => {
    const url = buildUrl("users", {} as any, { page: 2 });
    expect(url).toBe("/users?page=2");
  });

  it("should handle boolean query param values", () => {
    const url = buildUrl("users", {} as any, { active: true });
    expect(url).toBe("/users?active=true");
  });

  it("should return path only when all query params are null/undefined", () => {
    const url = buildUrl("users", {} as any, { a: null, b: undefined });
    expect(url).toBe("/users");
  });

  it("should return path only when no query params provided", () => {
    expect(buildUrl("users", {} as any)).toBe("/users");
  });
});

// =============================================================================
// validateParams
// =============================================================================

describe("validateParams", () => {
  it("should return true when all params are provided", () => {
    expect(validateParams("users/:userId", { userId: "42" })).toBe(true);
  });

  it("should return true for path with no params", () => {
    expect(validateParams("users", {})).toBe(true);
  });

  it("should return false when a param is missing", () => {
    expect(validateParams("users/:userId", {})).toBe(false);
  });

  it("should return false when a param is undefined", () => {
    expect(validateParams("users/:userId", { userId: undefined })).toBe(false);
  });

  it("should return false when a param is null", () => {
    expect(validateParams("users/:userId", { userId: null })).toBe(false);
  });

  it("should validate multiple params", () => {
    expect(
      validateParams("products/:categoryId/:productId", {
        categoryId: "electronics",
        productId: "99",
      }),
    ).toBe(true);
  });

  it("should return false when one of multiple params is missing", () => {
    expect(
      validateParams("products/:categoryId/:productId", {
        categoryId: "electronics",
      }),
    ).toBe(false);
  });
});

// =============================================================================
// getParamNames
// =============================================================================

describe("getParamNames", () => {
  it("should return empty array for path with no params", () => {
    expect(getParamNames("users")).toEqual([]);
  });

  it("should return empty array for empty path", () => {
    expect(getParamNames("")).toEqual([]);
  });

  it("should extract single param name", () => {
    expect(getParamNames("users/:userId")).toEqual(["userId"]);
  });

  it("should extract multiple param names", () => {
    expect(getParamNames("users/:userId/posts/:postId")).toEqual(["userId", "postId"]);
  });

  it("should handle params at start of path", () => {
    expect(getParamNames(":id")).toEqual(["id"]);
  });
});
