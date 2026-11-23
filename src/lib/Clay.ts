/**
 * Generic option used in selects/radios
 */
interface ClayOption {
  label?: string;
  value?: string | number | boolean;
  [propName: string]: any;
}

/**
 * A fairly permissive representation of a Clay item/control.
 * Specific control types may add more fields; keep this flexible.
 */
interface ClayItem {
  type?: string;
  messageKey?: string;
  label?: string;
  defaultValue?: any;
  description?: string;
  items?: ClayItem[];
  options?: ClayOption[];
  [propName: string]: any;
}

type ClayConfig = ClayItem[];

export interface Clay {
  /**
   * Returns the URL to open in the webview for configuration.
   */
  generateUrl(): string;

  /**
   * Parse the response from the webview.
   *
   * With `convert` left at its default Clay flattens each setting onto its
   * numeric AppMessage key (`messageKey + optionIndex` for checkbox groups).
   * Passing `false` returns the settings keyed by messageKey *name* with
   * `{ value }` wrappers, which is independent of the numeric key layout.
   */
  getSettings(response: string, convert?: boolean): { [key: string]: any };

  [propName: string]: any;
}

export interface ClayConstructor {
  new (
    config: ClayConfig | object,
    localize?: any,
    options?: { autoHandleEvents?: boolean },
  ): Clay;
}
