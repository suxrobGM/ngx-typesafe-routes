/**
 * Signal Input Utilities for Route Parameters
 *
 * Provides `input` — a drop-in replacement for Angular's `input()` / `input.required()`
 * tailored to route parameter binding via `withComponentInputBinding()`.
 *
 * Also provides query param helpers (`queryParam`, `queryParamNumber`, etc.)
 * for typed query parameter binding.
 *
 * @example
 * ```typescript
 * // app.config.ts
 * provideRouter(appRouter.routes, withComponentInputBinding())
 *
 * // user.component.ts
 * import { input, queryParam } from 'ngx-typesafe-routes';
 *
 * @Component({...})
 * class UserComponent {
 *   userId = input.required();       // bound to :userId
 *   tab = queryParam();              // bound to ?tab=...
 * }
 * ```
 */
import { type InputSignal, type InputSignalWithTransform, input as _ngInput } from "@angular/core";

// Indirect references bypass Angular's static analysis (NG8110) while
// preserving identical runtime behavior. These functions are designed to be
// called as class field initializers in components/directives.
const _input: typeof _ngInput = _ngInput;
const _required: typeof _ngInput.required = _ngInput.required;

// =============================================================================
// Route Param Input — `input` object
// =============================================================================

interface InputFunction {
  /** Creates an optional route param input with a default value. */
  (defaultValue: string): InputSignal<string>;

  /** Creates a required route param input signal. */
  required(): InputSignal<string>;

  /** Creates a numeric route param input. Automatically parses to number. */
  number(): InputSignalWithTransform<number, string>;

  /** Creates a route param input with a custom transform function. */
  transform<T>(transform: (value: string) => T): InputSignalWithTransform<T, string>;

  /**
   * Creates a validated route param input. Throws if validation fails.
   * @param validate Validation function
   * @param errorMessage Error message if validation fails
   */
  validated(
    validate: (value: string) => boolean,
    errorMessage?: string,
  ): InputSignalWithTransform<string, string>;
}

/**
 * Type-safe route parameter input — mirrors Angular's `input()` / `input.required()` API.
 * Import this instead of `input` from `@angular/core` for route parameter binding.
 *
 * @example
 * ```typescript
 * import { input } from 'ngx-typesafe-routes';
 *
 * @Component({...})
 * class UserComponent {
 *   userId = input.required();                       // required string
 *   tab = input('overview');                          // optional with default
 *   postId = input.number();                          // auto-parsed to number
 *   slug = input.transform(v => v.toUpperCase());     // custom transform
 *   code = input.validated(v => v.length === 6);      // validated
 * }
 * ```
 */
export const input: InputFunction = Object.assign(
  function inputFn(defaultValue: string): InputSignal<string> {
    return _input<string>(defaultValue);
  },
  {
    required(): InputSignal<string> {
      return _required<string>();
    },

    number(): InputSignalWithTransform<number, string> {
      return _required<number, string>({
        transform: (value: string) => {
          const num = Number(value);
          if (isNaN(num)) {
            throw new Error(`Invalid numeric parameter: ${value}`);
          }
          return num;
        },
      });
    },

    transform<T>(transform: (value: string) => T): InputSignalWithTransform<T, string> {
      return _required<T, string>({ transform });
    },

    validated(
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
    },
  },
);

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
