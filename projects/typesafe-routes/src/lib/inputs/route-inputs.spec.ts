import { Component } from "@angular/core";
import { TestBed } from "@angular/core/testing";
import {
  input,
  queryParam,
  queryParamBoolean,
  queryParamDefault,
  queryParamNumber,
  queryParamTransform,
} from "./route-inputs";

// =============================================================================
// Helper: create a component with given inputs and extract the signal
// =============================================================================

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

// =============================================================================
// input object
// =============================================================================

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

// =============================================================================
// queryParam helpers
// =============================================================================

describe("queryParam", () => {
  it("should create an optional string input defaulting to undefined", () => {
    const signal = createComponentWithInput(() => queryParam());
    expect(signal).toBeTruthy();
    expect((signal as any)()).toBeUndefined();
  });
});

describe("queryParamDefault", () => {
  it("should create an input with a default value", () => {
    const signal = createComponentWithInput(() => queryParamDefault("overview"));
    expect(signal).toBeTruthy();
    expect((signal as any)()).toBe("overview");
  });
});

describe("queryParamNumber", () => {
  it("should create a numeric input with default", () => {
    const signal = createComponentWithInput(() => queryParamNumber(1));
    expect(signal).toBeTruthy();
    expect((signal as any)()).toBe(1);
  });

  it("should default to 0 when no default provided", () => {
    const signal = createComponentWithInput(() => queryParamNumber());
    expect((signal as any)()).toBe(0);
  });
});

describe("queryParamBoolean", () => {
  it("should create a boolean input defaulting to false", () => {
    const signal = createComponentWithInput(() => queryParamBoolean());
    expect(signal).toBeTruthy();
    expect((signal as any)()).toBe(false);
  });

  it("should use provided default value", () => {
    const signal = createComponentWithInput(() => queryParamBoolean(true));
    expect((signal as any)()).toBe(true);
  });
});

describe("queryParamTransform", () => {
  it("should create a transform input with default", () => {
    const signal = createComponentWithInput(() =>
      queryParamTransform((v) => (v === "desc" ? "desc" : "asc"), "asc"),
    );
    expect(signal).toBeTruthy();
    expect((signal as any)()).toBe("asc");
  });
});
