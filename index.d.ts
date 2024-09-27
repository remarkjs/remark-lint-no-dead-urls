import type {Options as RawDeadOrAliveOptions} from 'dead-or-alive'

export {default} from './lib/index.js'

/**
 * Configuration.
 */
export interface Options {
  /**
   * Options passed to `dead-or-alive`
   * (optional);
   * `deadOrAliveOptions.findUrls` is always off as further URLs are not
   * applicable.
   */
  deadOrAliveOptions?: Readonly<DeadOrAliveOptions> | null | undefined
  /**
   * Check relative values relative to this URL
   * (optional, example: `'https://example.com/from'`);
   * you can also define this by setting `origin` and `pathname` in
   * `file.data.meta`.
   */
  from?: string | null | undefined
  /**
   * Whether to ignore `localhost` links such as `http://localhost/*`,
   * `http://127.0.0.1/*`
   * (default: `false`);
   * shortcut for a skip pattern of
   * `/^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/`.
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

/**
 * Configuration for `dead-or-alive` as supported by
 * `remark-lint-no-dead-urls`.
 */
interface DeadOrAliveOptions extends RawDeadOrAliveOptions {
  /**
   * Find URLs in the final resource;
   * not supported in `remark-lint-no-dead-urls` as it’s not applicable.
   */
  findUrls?: never
}
