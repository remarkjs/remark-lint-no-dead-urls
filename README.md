# remark-lint-no-dead-urls

[![Build Status](https://travis-ci.org/davidtheclark/remark-lint-no-dead-urls.svg?branch=master)](https://travis-ci.org/davidtheclark/remark-lint-no-dead-urls)

[remark-lint](https://github.com/wooorm/remark-lint) plugin to ensure that external URLs in your Markdown are alive.
Checks all of the following:

```md
Checks [links](https://www.github.com).

Checks images: ![horse](/path/to/horse.jpg)

Checks definitions: see the [walrus].

[walrus]: /path/to/walrus.jpg
```

Uses [link-check](https://github.com/tcort/link-check) to check URLs against the real internet.

Options: `Object` or `string`. Optional.

An options `Object` can have the following properties:

- **baseUrl** `string` - Used as the base URL against which relative URLs are checked.
  For example, with `baseUrl: 'https://www.github.com'`, the relative URL `/davidtheclark` is checked as `https://www.github.com/davidtheclark`.
  **By default, relative URLs are ignored: you must provide this option to check them.**
- **cache** `Object` - By default, URLs are cached internally to avoid repeated checks.
  If you want to manage the cache yourself (maybe even write it to disk between runs), you can provide a cache `Object` that will be read from and written to.
  The cache will be populated with properties whose keys are URLs are values are `'alive'` or `'dead'`.
- **skipOffline** `boolean` - Default: `false`.
  By default, if you are offline when you run the check you will receive a warning.
  If you want to let offline runs quietly pass, set this option to `true`.

An options `string` is interpreted as `baseUrl` (above).

**Does not check absolute URLs with protocols other than `http:` and `https:`.**

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
To check relative links, you must provide a base URL string as an option.

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
