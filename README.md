# remark-lint-no-dead-urls

> [remark-lint](https://github.com/wooorm/remark-lint) plugin to ensure that external URLs in your Markdown are alive.

[![NPM](https://img.shields.io/npm/v/remark-lint-no-dead-urls.svg)](https://www.npmjs.com/package/remark-lint-no-dead-urls) [![Build Status](https://travis-ci.org/davidtheclark/remark-lint-no-dead-urls.svg?branch=master)](https://travis-ci.org/davidtheclark/remark-lint-no-dead-urls)

Checks all of the following:

```md
Checks [links](https://www.github.com).

Checks images: ![horse](/path/to/horse.jpg)

Checks definitions: see the [walrus].

[walrus]: /path/to/walrus.jpg
```

Uses [check-links](https://github.com/transitive-bullshit/check-links) to check URLs for liveness (requires an internet connection).

Options: `Object`. Optional. May contain any of the following properties:

- **concurrency** `number` - Maximum number of urls to resolve concurrently (optional, default `8`)
- **baseUrl** `string` - Used as the base URL against which relative URLs are checked.
  For example, with `baseUrl: 'https://www.github.com'`, the relative URL `/davidtheclark` is checked as `https://www.github.com/davidtheclark`.
  **By default, relative URLs are ignored: you must provide this option to check them.**
- **skipOffline** `boolean` - Default: `false`.
  By default, if you are offline when you run the check you will receive a warning.
  If you want to let offline runs quietly pass, set this option to `true`.

Any other properties will be passed to as options to [got](https://github.com/sindresorhus/got#options), such as customizing retry logic, setting a `baseUrl`, specifying a custom `cache`, custom headers, etc.

**Ignores absolute URLs with protocols other than `http:` and `https:`.**

## Example

When this rule is turned on, the following `valid.md` is ok:

```md
Here is a [good link](https://www.github.com/wooorm/remark)
```

When this rule is turned on, the following `invalid.md` is **not** ok:

```md
Here is a [bad link](https://www.github.com/wooom/remark-dead-link)
```

```
1:11-1:68: Link to https://www.github.com/wooom/remark-dead-link is dead
```

**By default, relative links are ignored.**
To check relative links, you must provide `baseUrl` as an option.

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

## License

MIT © [David Clark](https://github.com/davidtheclark)
