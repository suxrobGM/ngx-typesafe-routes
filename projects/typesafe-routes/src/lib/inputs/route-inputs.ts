import { type InputSignal, type InputSignalWithTransform, input as _ngInput } from "@angular/core";

// Indirect references bypass Angular's static analysis (NG8110) while
// preserving identical runtime behavior. These functions are designed to be
// called as class field initializers in components/directives.
const _input: typeof _ngInput = _ngInput;
const _required: typeof _ngInput.required = _ngInput.required;

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

interface QueryParamFunction {
  /** Creates an optional string query param input (undefined when absent). */
  (): InputSignal<string | undefined>;

  /** Creates a string query param input with a default value. */
  withDefault(defaultValue: string): InputSignalWithTransform<string, string | undefined>;

  /** Creates a numeric query param input. Returns `defaultValue` when absent or non-numeric. */
  number(defaultValue?: number): InputSignalWithTransform<number, string | undefined>;

  /** Creates a boolean query param input. Treats 'true', '1', 'yes' as true. */
  boolean(defaultValue?: boolean): InputSignalWithTransform<boolean, string | undefined>;

  /** Creates a query param input with a custom transform function. */
  transform<T>(
    transform: (value: string | undefined) => T,
    defaultValue: T,
  ): InputSignalWithTransform<T, string | undefined>;
}

/**
 * Type-safe query parameter input — mirrors the `input` object pattern.
 *
 * @example
 * ```typescript
 * import { queryParam } from 'ngx-typesafe-routes';
 *
 * @Component({...})
 * class SearchComponent {
 *   q     = queryParam();                  // optional string
 *   tab   = queryParam.withDefault('all'); // string with default
 *   page  = queryParam.number(1);          // numeric, defaults to 1
 *   debug = queryParam.boolean(false);     // boolean, defaults to false
 *   sort  = queryParam.transform(          // custom transform
 *     v => (v === 'desc' ? 'desc' : 'asc'),
 *     'asc'
 *   );
 * }
 * ```
 */
export const queryParam: QueryParamFunction = Object.assign(
  function queryParamFn(): InputSignal<string | undefined> {
    return _input<string | undefined>(undefined);
  },
  {
    withDefault(defaultValue: string): InputSignalWithTransform<string, string | undefined> {
      return _input<string, string | undefined>(defaultValue, {
        transform: (v: string | undefined) => v ?? defaultValue,
      });
    },

    number(defaultValue: number = 0): InputSignalWithTransform<number, string | undefined> {
      return _input<number, string | undefined>(defaultValue, {
        transform: (value: string | undefined) => {
          if (value === undefined || value === null) return defaultValue;
          const num = Number(value);
          return isNaN(num) ? defaultValue : num;
        },
      });
    },

    boolean(defaultValue: boolean = false): InputSignalWithTransform<boolean, string | undefined> {
      return _input<boolean, string | undefined>(defaultValue, {
        transform: (value: string | undefined) => {
          if (value === undefined || value === null) return defaultValue;
          return ["true", "1", "yes"].includes(value.toLowerCase());
        },
      });
    },

    transform<T>(
      transform: (value: string | undefined) => T,
      defaultValue: T,
    ): InputSignalWithTransform<T, string | undefined> {
      return _input<T, string | undefined>(defaultValue, { transform });
    },
  },
);
