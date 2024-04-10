/* eslint-disable @typescript-eslint/ban-types, @typescript-eslint/consistent-type-definitions */

export {default} from './lib/index.js'

/**
 * Configuration.
 */
export interface Options {
  /**
   * Check relative values relative to this URL
   * (optional, example: `'https://example.com/from'`).
   */
  from?: string | null | undefined
  /**
   * Whether to ignore `localhost` links such as `http://localhost/*`,
   * `http://127.0.0.1/*`
   * (default: `false`).
   */
  skipLocalhost?: boolean | null | undefined
  /**
   * Whether to let offline runs pass quietly
   * (default: `false`).
   */
  skipOffline?: boolean | null | undefined
  /**
   * List of patterns for URLs that should be skipped
   * (optional);
   * each URL will be tested against each pattern and will be ignored if
   * `new RegExp(pattern).test(url) === true`.
   */
  skipUrlPatterns?: ReadonlyArray<RegExp | string> | null | undefined
}
