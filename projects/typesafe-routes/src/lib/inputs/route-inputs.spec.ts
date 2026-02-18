import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import { input, queryParam } from "./route-inputs";

function createComponentWithInput<T>(inputFactory: () => T): T {
  let signal: T;

  @Component({ template: "", standalone: true })
  class TestComponent {
    value = inputFactory();
    constructor() {
      signal = this.value;
    }
  }

  TestBed.configureTestingModule({ imports: [TestComponent] });
  TestBed.createComponent(TestComponent);
  return signal!;
}

describe("input", () => {
  it("should be a function with required, number, transform, and validated properties", () => {
    expect(typeof input).toBe("function");
    expect(typeof input.required).toBe("function");
    expect(typeof input.number).toBe("function");
    expect(typeof input.transform).toBe("function");
    expect(typeof input.validated).toBe("function");
  });

  describe("input(defaultValue)", () => {
    it("should create a signal input with default value", () => {
      const signal = createComponentWithInput(() => input("default"));
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBe("default");
    });
  });

  describe("input.required()", () => {
    it("should create a required signal input", () => {
      const signal = createComponentWithInput(() => input.required());
      expect(signal).toBeTruthy();
    });
  });

  describe("input.number()", () => {
    it("should create a numeric transform input", () => {
      const signal = createComponentWithInput(() => input.number());
      expect(signal).toBeTruthy();
    });
  });

  describe("input.transform()", () => {
    it("should create a transform input", () => {
      const signal = createComponentWithInput(() => input.transform((v) => v.toUpperCase()));
      expect(signal).toBeTruthy();
    });
  });

  describe("input.validated()", () => {
    it("should create a validated input", () => {
      const signal = createComponentWithInput(() =>
        input.validated((v) => v.length > 0, "Must not be empty"),
      );
      expect(signal).toBeTruthy();
    });
  });
});

describe("queryParam", () => {
  it("should be a function with withDefault, number, boolean, and transform properties", () => {
    expect(typeof queryParam).toBe("function");
    expect(typeof queryParam.withDefault).toBe("function");
    expect(typeof queryParam.number).toBe("function");
    expect(typeof queryParam.boolean).toBe("function");
    expect(typeof queryParam.transform).toBe("function");
  });

  describe("queryParam()", () => {
    it("should create an optional string input defaulting to undefined", () => {
      const signal = createComponentWithInput(() => queryParam());
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBeUndefined();
    });
  });

  describe("queryParam.withDefault()", () => {
    it("should create an input with a default value", () => {
      const signal = createComponentWithInput(() => queryParam.withDefault("overview"));
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBe("overview");
    });
  });

  describe("queryParam.number()", () => {
    it("should create a numeric input with default", () => {
      const signal = createComponentWithInput(() => queryParam.number(1));
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBe(1);
    });

    it("should default to 0 when no default provided", () => {
      const signal = createComponentWithInput(() => queryParam.number());
      expect((signal as any)()).toBe(0);
    });
  });

  describe("queryParam.boolean()", () => {
    it("should create a boolean input defaulting to false", () => {
      const signal = createComponentWithInput(() => queryParam.boolean());
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBe(false);
    });

    it("should use provided default value", () => {
      const signal = createComponentWithInput(() => queryParam.boolean(true));
      expect((signal as any)()).toBe(true);
    });
  });

  describe("queryParam.transform()", () => {
    it("should create a transform input with default", () => {
      const signal = createComponentWithInput(() =>
        queryParam.transform((v) => (v === "desc" ? "desc" : "asc"), "asc"),
      );
      expect(signal).toBeTruthy();
      expect((signal as any)()).toBe("asc");
    });
  });
});
