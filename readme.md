# remark-lint-no-dead-urls

[![Build][badge-build-image]][badge-build-url]
[![Coverage][badge-coverage-image]][badge-coverage-url]
[![Downloads][badge-downloads-image]][badge-downloads-url]
[![Size][badge-size-image]][badge-size-url]
[![Sponsors][badge-sponsors-image]][badge-collective-url]
[![Backers][badge-backers-image]][badge-collective-url]
[![Chat][badge-chat-image]][badge-chat-url]

**[`remark-lint`][github-remark-lint]** rule to warn when URLs are dead.

## Contents

* [What is this?](#what-is-this)
* [When should I use this?](#when-should-i-use-this)
* [Install](#install)
* [Use](#use)
* [API](#api)
  * [`Options`](#options)
  * [`unified().use(remarkLintNoDeadUrls[, options])`](#unifieduseremarklintnodeadurls-options)
* [Related](#related)
* [Contribute](#contribute)
* [License](#license)

## What is this?

This package checks whether URLs are alive or not.

## When should I use this?

You can use this package to check that URLs are alive.

It’s similar to [`remark-validate-links`][github-remark-validate-links],
but there’s an important difference.
That package checks the file system locally:
whether `path/to/example.md` exists.
But this package,
`remark-lint-no-dead-urls`,
checks the internet:
whether `https://a.com` is alive,
`/docs/example` is reachable on `https://mydomain.com`,
and even whether certain IDs exist on a web page.

This package uses [`dead-or-alive`][github-dead-or-alive].
You can use it when you want to check URLs programmatically yourself.

## Install

This package is [ESM only][github-gist-esm].
In Node.js (version 16+),
install with [npm][npm-install]:

```sh
npm install remark-lint-no-dead-urls
```

In Deno with [`esm.sh`][esm-sh]:

```js
import remarkLintNoDeadUrls from 'https://esm.sh/remark-lint-no-dead-urls@1'
```

In browsers with [`esm.sh`][esm-sh]:

```html
<script type="module">
  import remarkLintNoDeadUrls from 'https://esm.sh/remark-lint-no-dead-urls@1?bundle'
</script>
```

## Use

On the API:

```js
import remarkLintNoDeadUrls from 'remark-lint-no-dead-urls'
import remarkLint from 'remark-lint'
import remarkParse from 'remark-parse'
import remarkStringify from 'remark-stringify'
import {read} from 'to-vfile'
import {unified} from 'unified'
import {reporter} from 'vfile-reporter'

const file = await read('example.md')

await unified()
  .use(remarkParse)
  .use(remarkLint)
  .use(remarkLintNoDeadUrls)
  .use(remarkStringify)
  .process(file)

console.error(reporter(file))
```

On the CLI:

```sh
remark --frail --use remark-lint --use remark-lint-no-dead-urls .
```

On the CLI in a config file (here a `package.json`):

```diff
 …
 "remarkConfig": {
   "plugins": [
     …
     "remark-lint",
+    "remark-lint-no-dead-urls",
     …
   ]
 }
 …
```

## API

This package exports no identifiers.
It exports the additional [TypeScript][] type
[`Options`][api-options].
The default export is
[`remarkLintNoDeadUrls`][api-remark-lint-no-dead-urls].

### `Options`

Configuration (TypeScript type).

###### Fields

* `deadOrAliveOptions` (`Options` from `dead-or-alive`, optional)
  — options passed to `dead-or-alive`;
  [`deadOrAliveOptions.findUrls`][github-dead-or-alive-options] is always off
  as further URLs are not applicable
* `from` (`string`, optional, example: `'https://example.com/from'`)
  — check relative values relative to this URL;
  you can also define this by setting `origin` and `pathname` in
  `file.data.meta`
* `skipLocalhost` (`boolean`, default: `false`)
  — whether to ignore `localhost` links such as `http://localhost/*`,
  `http://127.0.0.1/*`;
  shortcut for a skip pattern of
  `/^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/`
* `skipOffline` (`boolean`, default: `false`)
  — whether to let offline runs pass quietly
* `skipUrlPatterns` (`Array<RegExp | string>`, optional)
  — list of patterns for URLs that should be skipped;
  each URL will be tested against each pattern and will be ignored if
  `new RegExp(pattern).test(url) === true`

### `unified().use(remarkLintNoDeadUrls[, options])`

Warn when URLs are dead.

###### Notes

To improve performance,
decrease `maxRetries` in [`deadOrAliveOptions`][github-dead-or-alive-options]
and/or decrease the value used for
`sleep` in `deadOrAliveOptions`.
The normal behavior is to assume connections might be flakey and to sleep a
while and retry a couple times.

If you do not care whether anchors exist and don’t need to support HTML
redirects,
you can pass `checkAnchor: false` and `followMetaHttpEquiv: false` in
[`deadOrAliveOptions`][github-dead-or-alive-options],
which enables a fast path without parsing HTML.

###### Parameters

* `options` ([`Options`][api-options], optional)
  — configuration

###### Returns

Transform (`(tree: Root, file: VFile) => Promise<Root>`).

## Related

* [`remark-lint`][github-remark-lint]
  — markdown code style linter
* [`remark-validate-links`][github-remark-validate-links]
  — ensure local links work

## Contribute

See [`contributing.md`][health-contributing] in [`remarkjs/.github`][health]
for ways to get started.
See [`support.md`][health-support] for ways to get help.

This project has a [code of conduct][health-coc].
By interacting with this repository, organization, or community you agree to
abide by its terms.

## License

[MIT][file-license] © [David Clark][github-david-clark]

[api-remark-lint-no-dead-urls]: #unifieduseremarklintnodeadurls-options

[api-options]: #options

[badge-backers-image]: https://opencollective.com/unified/backers/badge.svg

[badge-build-image]: https://github.com/remarkjs/remark-lint-no-dead-urls/actions/workflows/main.yml/badge.svg

[badge-build-url]: https://github.com/remarkjs/remark-lint-no-dead-urls/actions

[badge-collective-url]: https://opencollective.com/unified

[badge-coverage-image]: https://img.shields.io/codecov/c/github/remarkjs/remark-lint-no-dead-urls.svg

[badge-coverage-url]: https://codecov.io/github/remarkjs/remark-lint-no-dead-urls

[badge-downloads-image]: https://img.shields.io/npm/dm/remark-lint-no-dead-urls.svg

[badge-downloads-url]: https://www.npmjs.com/package/remark-lint-no-dead-urls

[badge-size-image]: https://img.shields.io/bundlejs/size/remark-lint-no-dead-urls

[badge-size-url]: https://bundlejs.com/?q=remark-lint-no-dead-urls

[badge-sponsors-image]: https://opencollective.com/unified/sponsors/badge.svg

[badge-chat-image]: https://img.shields.io/badge/chat-discussions-success.svg

[badge-chat-url]: https://github.com/remarkjs/remark/discussions

[esm-sh]: https://esm.sh

[file-license]: license

[github-david-clark]: https://github.com/davidtheclark

[github-dead-or-alive-options]: https://github.com/wooorm/dead-or-alive#options

[github-dead-or-alive]: https://github.com/wooorm/dead-or-alive

[github-gist-esm]: https://gist.github.com/sindresorhus/a39789f98801d908bbc7ff3ecc99d99c

[github-remark-validate-links]: https://github.com/remarkjs/remark-validate-links

[github-remark-lint]: https://github.com/remarkjs/remark-lint

[health-coc]: https://github.com/remarkjs/.github/blob/main/code-of-conduct.md

[health-contributing]: https://github.com/remarkjs/.github/blob/main/contributing.md

[health-support]: https://github.com/remarkjs/.github/blob/main/support.md

[health]: https://github.com/remarkjs/.github

[npm-install]: https://docs.npmjs.com/cli/install

[typescript]: https://www.typescriptlang.org
