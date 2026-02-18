/**
 * Signal Input Utilities for Route Parameters
 *
 * Provides type-safe utilities for using Angular's `withComponentInputBinding()`
 * feature with signal inputs. When configured, Angular automatically binds
 * route parameters to component inputs matching the parameter name.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * provideRouter(appRouter.routes, withComponentInputBinding())
 *
 * // user.component.ts
 * @Component({...})
 * class UserComponent {
 *   userId = routeParam();       // bound to :userId
 *   tab = queryParam();          // bound to ?tab=...
 *   user = routeData<User>();    // bound to resolved data
 * }
 * ```
 */
import { type InputSignal, type InputSignalWithTransform, input } from "@angular/core";

// Indirect references bypass Angular's static analysis (NG8110) while
// preserving identical runtime behavior. These functions are designed to be
// called as class field initializers in components/directives.
const _input: typeof input = input;
const _required: typeof input.required = input.required;

// =============================================================================
// Route Param Inputs
// =============================================================================

/**
 * Creates a required route param input signal.
 * Use when the component can only be activated when the param exists.
 *
 * @example
 * ```typescript
 * @Component({...})
 * class UserComponent {
 *   userId = routeParam(); // bound to :userId
 * }
 * ```
 */
export function routeParam(): InputSignal<string> {
  return _required<string>();
}

/**
 * Creates an optional route param input signal with a default value.
 *
 * @param defaultValue The default value if param is not provided
 */
export function routeParamOptional(defaultValue: string): InputSignal<string> {
  return _input<string>(defaultValue);
}

/**
 * Creates a route param input with transform function.
 * Useful for converting string params to other types.
 *
 * @param transform Function to transform the string value
 *
 * @example
 * ```typescript
 * userId = routeParamTransform(v => parseInt(v, 10));
 * ```
 */
export function routeParamTransform<T>(
  transform: (value: string) => T,
): InputSignalWithTransform<T, string> {
  return _required<T, string>({ transform });
}

/**
 * Creates an optional route param input with transform and default.
 *
 * @param defaultValue Default value when param is missing
 * @param transform Transform function
 */
export function routeParamTransformOptional<T>(
  defaultValue: T,
  transform: (value: string | undefined) => T,
): InputSignalWithTransform<T, string | undefined> {
  return _input<T, string | undefined>(defaultValue, { transform });
}

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
  return _required<string, string>({
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
  return _required<number, string>({
    transform: (value: string) => {
      const num = Number(value);
      if (isNaN(num)) {
        throw new Error(`Invalid numeric parameter: ${value}`);
      }
      return num;
    },
  });
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
  return _input<string | undefined>(undefined);
}

/**
 * Creates a query param input with default value.
 *
 * @param defaultValue Default value when param is missing
 */
export function queryParamDefault(
  defaultValue: string,
): InputSignalWithTransform<string, string | undefined> {
  return _input<string, string | undefined>(defaultValue, {
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
  return _input<T, string | undefined>(defaultValue, { transform });
}

/**
 * Creates a boolean query param input.
 * Treats 'true', '1', 'yes' as true.
 */
export function queryParamBoolean(
  defaultValue: boolean = false,
): InputSignalWithTransform<boolean, string | undefined> {
  return _input<boolean, string | undefined>(defaultValue, {
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
  return _input<number, string | undefined>(defaultValue, {
    transform: (value: string | undefined) => {
      if (value === undefined || value === null) return defaultValue;
      const num = Number(value);
      return isNaN(num) ? defaultValue : num;
    },
  });
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
 *   user = routeData<User>(); // bound to resolved data
 * }
 * ```
 */
export function routeData<T>(): InputSignal<T> {
  return _required<T>();
}

/**
 * Creates an optional route data input.
 *
 * @param defaultValue Default value
 */
export function routeDataOptional<T>(defaultValue: T): InputSignal<T> {
  return _input<T>(defaultValue);
}
