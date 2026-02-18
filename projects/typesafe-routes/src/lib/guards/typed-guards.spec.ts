import { type ActivatedRouteSnapshot } from "@angular/router";
import { getTypedParams } from "./typed-guards";

describe("getTypedParams", () => {
  it("should extract params from a route snapshot", () => {
    const route = { params: { userId: "42" } } as unknown as ActivatedRouteSnapshot;
    const params = getTypedParams<"users/:userId">(route);
    expect(params).toEqual({ userId: "42" });
  });

  it("should extract multiple params", () => {
    const route = {
      params: { userId: "42", postId: "7" },
    } as unknown as ActivatedRouteSnapshot;
    const params = getTypedParams<"users/:userId/posts/:postId">(route);
    expect(params).toEqual({ userId: "42", postId: "7" });
  });

  it("should return the same params reference", () => {
    const originalParams = { userId: "42" };
    const route = { params: originalParams } as unknown as ActivatedRouteSnapshot;
    const params = getTypedParams<"users/:userId">(route);
    expect(params).toBe(originalParams);
  });

  it("should return empty object for path without params", () => {
    const route = { params: {} } as unknown as ActivatedRouteSnapshot;
    const params = getTypedParams<"users">(route);
    expect(params).toEqual({});
  });
});
