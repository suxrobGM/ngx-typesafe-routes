/**
 * Signal Input Utilities for Route Parameters
 *
 * Provides type-safe decorators and utilities for using Angular's
 * `withComponentInputBinding()` feature with signal inputs.
 *
 * When using `withComponentInputBinding()` in your router config,
 * Angular automatically binds route parameters to component inputs.
 * These utilities provide type safety for that binding.
 */
import {
  type InputSignal,
  type InputSignalWithTransform,
  type Signal,
  computed,
  input,
} from "@angular/core";
import type { ExtractPathParams } from "../types/route-types";

// =============================================================================
// Type Definitions
// =============================================================================

/**
 * Creates a type for route input signals based on a path.
 *
 * @example
 * ```typescript
 * type UserInputs = RouteInputSignals<'users/:userId/posts/:postId'>;
 * // { userId: InputSignal<string>; postId: InputSignal<string>; }
 * ```
 */
export type RouteInputSignals<Path extends string> = {
  [K in ExtractPathParams<Path>]: InputSignal<string>;
};

/**
 * Creates a type for required route inputs.
 */
export type RouteInputsRequired<Path extends string> = {
  [K in ExtractPathParams<Path>]: InputSignal<string>;
};

/**
 * Creates a type for optional route inputs with default values.
 */
export type RouteInputsOptional<Path extends string> = {
  [K in ExtractPathParams<Path>]: InputSignal<string | undefined>;
};

// =============================================================================
// Input Factories
// =============================================================================

/**
 * Creates a required route param input signal.
 * Use this when the component can only be activated when the param exists.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserComponent {
 *   // Bound automatically by withComponentInputBinding()
 *   userId = routeParam();
 * }
 * ```
 */
export function routeParam(): InputSignal<string> {
  return input.required<string>();
}

/**
 * Creates an optional route param input signal with a default value.
 *
 * @param defaultValue The default value if param is not provided
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserComponent {
 *   tab = routeParamOptional('overview');
 * }
 * ```
 */
export function routeParamOptional<T extends string>(defaultValue: T): InputSignal<string> {
  return input<string>(defaultValue);
}

/**
 * Creates a route param input with transform function.
 * Useful for converting string params to other types.
 *
 * @param transform Function to transform the string value
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserComponent {
 *   // Automatically converts to number
 *   userId = routeParamTransform(v => parseInt(v, 10));
 *
 *   // With validation
 *   page = routeParamTransform(v => Math.max(1, parseInt(v, 10) || 1));
 * }
 * ```
 */
export function routeParamTransform<T>(
  transform: (value: string) => T,
): InputSignalWithTransform<T, string> {
  return input.required<T, string>({ transform });
}

/**
 * Creates an optional route param input with transform and default.
 *
 * @param defaultValue Default value when param is missing
 * @param transform Transform function
 *
 * @example
 * ```typescript
 * @Component({...})
 * class ProductComponent {
 *   page = routeParamTransformOptional(1, v => parseInt(v, 10));
 * }
 * ```
 */
export function routeParamTransformOptional<T>(
  defaultValue: T,
  transform: (value: string | undefined) => T,
): InputSignalWithTransform<T, string | undefined> {
  return input<T, string | undefined>(defaultValue, { transform });
}

// =============================================================================
// Query Param Inputs
// =============================================================================

/**
 * Creates a query param input signal.
 * Query params are always optional strings.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class SearchComponent {
 *   q = queryParam();
 *   page = queryParam();
 * }
 * ```
 */
export function queryParam(): InputSignal<string | undefined> {
  return input<string | undefined>(undefined);
}

/**
 * Creates a query param input with default value.
 *
 * @param defaultValue Default value when param is missing
 */
export function queryParamDefault<T extends string>(
  defaultValue: T,
): InputSignal<string, string | undefined> {
  return input<string, string | undefined>(defaultValue, {
    transform: (v: string | undefined) => v ?? defaultValue,
  });
}

/**
 * Creates a query param input with transform.
 *
 * @param transform Transform function
 * @param defaultValue Default value
 */
export function queryParamTransform<T>(
  transform: (value: string | undefined) => T,
  defaultValue: T,
): InputSignalWithTransform<T, string | undefined> {
  return input<T, string | undefined>(defaultValue, { transform });
}

// =============================================================================
// Route Data Inputs
// =============================================================================

/**
 * Creates a route data input signal.
 * Use for data from resolvers or static route data.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserComponent {
 *   // Bound to resolved data
 *   user = routeData<User>();
 * }
 * ```
 */
export function routeData<T>(): InputSignal<T> {
  return input.required<T>();
}

/**
 * Creates an optional route data input.
 *
 * @param defaultValue Default value
 */
export function routeDataOptional<T>(defaultValue: T): InputSignal<T> {
  return input<T>(defaultValue);
}

// =============================================================================
// Type-Safe Input Creator
// =============================================================================

/**
 * Creates type-safe input definitions for a route path.
 * Returns an object with input factories for each param in the path.
 *
 * @example
 * ```typescript
 * const inputs = createRouteInputs('users/:userId/posts/:postId');
 *
 * @Component({...})
 * class PostComponent {
 *   userId = inputs.userId();
 *   postId = inputs.postId();
 * }
 * ```
 */
export function createRouteInputs<Path extends string>(
  _path: Path,
): { [K in ExtractPathParams<Path>]: () => InputSignal<string> } {
  return new Proxy({} as any, {
    get(_target, prop) {
      return () => input.required<string>();
    },
  });
}

/**
 * Creates computed signals from route params.
 * Useful for deriving values from multiple params.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class Component {
 *   userId = routeParam();
 *   postId = routeParam();
 *
 *   // Computed from params
 *   fullId = combineParams([this.userId, this.postId],
 *     ([uid, pid]) => `${uid}/${pid}`
 *   );
 * }
 * ```
 */
export function combineParams<T extends Signal<string>[], R>(
  params: [...T],
  combiner: (values: { [K in keyof T]: string }) => R,
): Signal<R> {
  return computed(() => {
    const values = params.map((p) => p()) as { [K in keyof T]: string };
    return combiner(values);
  });
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Creates a validated route param input.
 * Throws if validation fails.
 *
 * @param validate Validation function
 * @param errorMessage Error message if validation fails
 */
export function routeParamValidated(
  validate: (value: string) => boolean,
  errorMessage: string = "Invalid route parameter",
): InputSignalWithTransform<string, string> {
  return input.required<string, string>({
    transform: (value: string) => {
      if (!validate(value)) {
        throw new Error(errorMessage);
      }
      return value;
    },
  });
}

/**
 * Creates a numeric route param input.
 * Automatically parses to number.
 */
export function routeParamNumber(): InputSignalWithTransform<number, string> {
  return input.required<number, string>({
    transform: (value: string) => {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid numeric parameter: ${value}`);
      }
      return num;
    },
  });
}

/**
 * Creates a boolean query param input.
 * Treats 'true', '1', 'yes' as true.
 */
export function queryParamBoolean(
  defaultValue: boolean = false,
): InputSignalWithTransform<boolean, string | undefined> {
  return input<boolean, string | undefined>(defaultValue, {
    transform: (value: string | undefined) => {
      if (value === undefined || value === null) return defaultValue;
      return ["true", "1", "yes"].includes(value.toLowerCase());
    },
  });
}

/**
 * Creates a numeric query param input.
 */
export function queryParamNumber(
  defaultValue: number = 0,
): InputSignalWithTransform<number, string | undefined> {
  return input<number, string | undefined>(defaultValue, {
    transform: (value: string | undefined) => {
      if (value === undefined || value === null) return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    },
  });
}
