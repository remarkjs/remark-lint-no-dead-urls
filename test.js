import test from 'node:test'
import assert from 'node:assert/strict'
import {remark} from 'remark'
import esmock from 'esmock'

/**
 * Wrapper for calling remark with the linter plugin
 * @param {string} markdown
 * @param {import("esmock").MockMap} [globalMockDefinitions]
 * @param {import("./index.js").Options} [linterOptions]
 * @returns {Promise<import("vfile").VFile>}
 */
async function processMarkdown(markdown, globalMockDefinitions, linterOptions) {
  /** @type {import('unified').Plugin<[import('./index.js').Options?], import('mdast').Root, import('mdast').Root>} */
  const remarkLintNoDeadLinks = await esmock(
    './index.js',
    {},
    globalMockDefinitions
  )
  return remark().use(remarkLintNoDeadLinks, linterOptions).process(markdown)
}

test('works with no URLs', async () => {
  const vfile = await processMarkdown(`
# Title

No URLs in here.
`)
  assert.equal(vfile.messages.length, 0)
})

test('works with mix of valid and invalid links', async () => {
  const vfile = await processMarkdown(
    `
# Title

Here is a [good link](https://www.github.com).

Here is a [bad link](https://github.com/unified/oops).

Here is a [local link](http://localhost:3000).
  `,
    {
      'check-links': () =>
        Promise.resolve({
          'https://www.github.com': {status: 'alive', statusCode: 200},
          'https://github.com/unified/oops': {
            status: 'dead',
            statusCode: 404
          },
          'http://localhost:3000': {status: 'dead', statusCode: 404}
        }),
      'is-online': () => Promise.resolve(true)
    }
  )

  assert.equal(vfile.messages.length, 2)
  assert.equal(
    vfile.messages[0].reason,
    'Link to https://github.com/unified/oops is dead'
  )
  assert.equal(
    vfile.messages[1].reason,
    'Link to http://localhost:3000 is dead'
  )
})

test('works with definitions and images', async () => {
  const vfile = await processMarkdown(
    `
# Title

Here is a good pig: ![picture of pig](/pig-photos/384).

Download the pig picture [here](/pig-photos/384).

Here is a [bad link]. Here is that [bad link] again.

[bad link]: /oops/broken
    `,
    {
      'check-links': () =>
        Promise.resolve({
          '/pig-photos/384': {status: 'alive', statusCode: 200},
          '/oops/broken': {status: 'dead', statusCode: 404}
        }),
      'is-online': () => Promise.resolve(true)
    }
  )

  assert.equal(vfile.messages.length, 1)
  assert.equal(vfile.messages[0].reason, 'Link to /oops/broken is dead')
})

test('skips URLs with unsupported protocols', async () => {
  const vfile = await processMarkdown(`
[Send me an email.](mailto:me@me.com)
[Look at this file.](ftp://path/to/file.txt)
[Special schema.](flopper://a/b/c)
    `)

  assert.equal(vfile.messages.length, 0)
})

test('warns if you are not online', async () => {
  const vfile = await processMarkdown(
    `
Here is a [bad link](https://github.com/davidtheclark/oops).
    `,
    {
      'is-online': () => Promise.resolve(false)
    }
  )

  assert.equal(vfile.messages.length, 1)
  assert.equal(
    vfile.messages[0].reason,
    'You are not online and have not set skipOffline: true.'
  )
})

test('works offline with skipOffline enabled', async () => {
  const vfile = await processMarkdown(
    `
Here is a [bad link](https://github.com/davidtheclark/oops).
    `,
    {
      'is-online': () => Promise.resolve(false)
    },
    {
      skipOffline: true
    }
  )

  assert.equal(vfile.messages.length, 0)
})

test('ignores localhost when skipLocalhost enabled', async () => {
  const vfile = await processMarkdown(
    `
- [http://localhost](http://localhost)
- [http://localhost/alex/test](http://localhost/alex/test)
- [http://localhost:3000](http://localhost:3000)
- [http://localhost:3000/alex/test](http://localhost:3000/alex/test)
- [https://localhost](http://localhost)
- [https://localhost/alex/test](http://localhost/alex/test)
- [https://localhost:3000](http://localhost:3000)
- [https://localhost:3000/alex/test](http://localhost:3000/alex/test)
        `,
    {},
    {
      skipLocalhost: true
    }
  )

  assert.equal(vfile.messages.length, 0)
})

test('ignore loop back IP (127.0.0.1) when skipLocalhost is enabled', async () => {
  const vfile = await processMarkdown(
    `
- [http://127.0.0.1](http://127.0.0.1)
- [http://127.0.0.1:3000](http://127.0.0.1:3000)
- [http://127.0.0.1/alex/test](http://127.0.0.1)
- [http://127.0.0.1:3000/alex/test](http://127.0.0.1:3000)
- [https://127.0.0.1](http://127.0.0.1)
- [https://127.0.0.1:3000](http://127.0.0.1:3000)
- [https://127.0.0.1/alex/test](http://127.0.0.1)
- [https://127.0.0.1:3000/alex/test](http://127.0.0.1:3000)
        `,
    {},
    {
      skipLocalhost: true
    }
  )

  assert.equal(vfile.messages.length, 0)
})

test('skipUrlPatterns for content:', async () => {
  const vfile = await processMarkdown(
    `
[Ignore this](http://www.url-to-ignore.com)
[Ignore this](http://www.url-to-ignore.com/somePath)
[Ignore this](http://www.url-to-ignore.com/somePath?withQuery=wow)
[its complicated](http://url-to-ignore.com/somePath/maybe)
        `,
    {},
    {
      skipUrlPatterns: [/^http:\/\/(.*)url-to-ignore\.com/]
    }
  )

  assert.equal(vfile.messages.length, 0)
})
