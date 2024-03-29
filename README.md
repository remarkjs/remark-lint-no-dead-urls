# remark-lint-no-dead-urls

> [remark-lint][] plugin to ensure that external URLs in your Markdown are
> alive.

[![Build Status](https://github.com/remarkjs/remark-lint-no-dead-urls/workflows/main/badge.svg)](https://github.com/remarkjs/remark-lint-no-dead-urls/actions)
[![Coverage](https://img.shields.io/codecov/c/github/remarkjs/remark-lint-no-dead-urls.svg)](https://codecov.io/github/remarkjs/remark-lint-no-dead-urls)
[![NPM](https://img.shields.io/npm/v/remark-lint-no-dead-urls.svg)](https://www.npmjs.com/package/remark-lint-no-dead-urls)
[![Size](https://img.shields.io/bundlephobia/minzip/remark-lint-no-dead-urls.svg)](https://bundlephobia.com/result?p=remark-lint-no-dead-urls)

Checks all of the following:

```md
Checks [links](https://www.github.com).

Checks images: ![horse](/path/to/horse.jpg)

Checks definitions: see the [walrus].

[walrus]: /path/to/walrus.jpg
```

Uses [check-links][] to check URLs for liveness.

A few details to keep in mind:

*   By default, relative URLs are skipped.
    To check relative URLs, set `gotOptions.baseUrl` (see below).
*   Ignores absolute URLs with protocols other than `http:` and `https:`.
*   [check-links][] memoizes results, so on any given run each URL will only be
    pinged once; subsequent checks will be returned from the cache.

## Usage

Use like any other [remark-lint][] plugin.
Check out the [remark-lint][] documentation for details.

## Options

All options are optional.
The options object may contain any of the following properties:

*   **skipOffline** `{boolean}` - Default: `false`.
    By default, if you are offline when you run the check you will receive a
    warning.
    If you want to let offline runs quietly pass, set this option to `true`.
*   **skipLocalhost** `{boolean}` - Default: `false`.
    By default, `localhost` links are treated the same as other links, so if
    your project is not running locally you’ll receive a warning.
    If you want to ignore `localhost` links (e.g. `http://localhost/*`,
    `http://127.0.0.1/*`), set this option to `true`.
*   **skipUrlPatterns** `{Array}` - Array of `String` | `RegExp`.
    A list of patterns for URLs that should be skipped.
    Each URL will be tested against each pattern, and will be ignored if `new RegExp(pattern).test(url) === true`.
    For example, with `skipUrlPatterns: [/^http:\/\/(.*)url-to-ignore\.com/, 'https://never-check.com']`,
    links with the URLs `http://www.url-to-ignore.com/foo` and `https://never-check.com/foo/bar`
    will not be checked.
*   **gotOptions** `{Object}` - Passed through [check-links][] to [Got][].
    See documentation for [Got options](https://github.com/sindresorhus/got#options).
    With these options, you can customize retry logic, specify custom headers,
    and more.
    Here are some specific Got options that you might want to use:
    *   **gotOptions.prefixUrl** `{string}` - Used as the base URL against
        which relative URLs are checked.
        By default, relative URLs are ignored: you must provide this option to
        check them.
        For example, with `prefixUrl: 'https://www.github.com'`, the relative
        URL `/davidtheclark` is checked as `https://www.github.com/davidtheclark`.
    *   **gotOptions.concurrency** `{number}` - Maximum number of URLs to check
        concurrently (default `8`).

## Example

When this rule is turned on, the following `valid.md` is ok:

```md
Here is a [good link](https://www.github.com/wooorm/remark)
```

When this rule is turned on, the following `invalid.md` is **not** ok:

```md
Here is a [bad link](https://www.github.com/wooom/remark-dead-link)
```

```text
1:11-1:68: Link to https://www.github.com/wooom/remark-dead-link is dead
```

**By default, relative links are ignored.**
To check relative links, you must provide `gotOptions.baseUrl` as an option.

When nothing is passed, the following `valid.md` is ok:

```md
Here is a [good relative link](wooorm/remark)

Here is a [bad relative link](wooorm/remark-dead-link)
```

When `https://www.github.com` is passed in, the following `valid.md` is ok:

```md
Here is a [good relative link](wooorm/remark)
```

But the following `invalid.md` is **not** ok:

```md
Here is a [bad relative link](wooorm/remark-dead-link)
```

[check-links]: https://github.com/transitive-bullshit/check-links

[got]: https://github.com/sindresorhus/got

[remark-lint]: https://github.com/remarkjs/remark-lint
