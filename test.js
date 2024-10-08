import assert from 'node:assert/strict'
import test from 'node:test'
import remarkLintNoDeadUrls from 'remark-lint-no-dead-urls'
import {remark} from 'remark'
import {MockAgent, getGlobalDispatcher, setGlobalDispatcher} from 'undici'
import {compareMessage} from 'vfile-sort'

test('remark-lint-no-dead-urls', async function (t) {
  await t.test('should expose the public api', async function () {
    assert.deepEqual(
      Object.keys(await import('remark-lint-no-dead-urls')).sort(),
      ['default']
    )
  })

  await t.test('should work', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)
    const interceptable = mockAgent.get('https://exists.com')
    interceptable.intercept({path: '/'}).reply(200, 'ok')
    interceptable.intercept({path: '/does/not/'}).reply(404, 'nok')

    mockAgent
      .get('https://does-not-exists.com')
      .intercept({path: '/'})
      .reply(404, 'nok')

    const document = `
# Title

Here is a [good link](https://exists.com).

Here is a [bad link](https://exists.com/does/not/).

Here is another [bad link](https://does-not-exists.com).
`

    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '6:11-6:51: Unexpected dead URL `https://exists.com/does/not/`, expected live URL',
      '8:17-8:56: Unexpected dead URL `https://does-not-exists.com/`, expected live URL'
    ])
  })

  await t.test('should work w/o URLs', async function () {
    const document = `# Title

No URLs in here.
`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    assert.equal(file.messages.length, 0)
  })

  await t.test('should normally ignore relative URLs', async function () {
    const document = `[](a.md)
[](/b.md)
[](./c.md)
[](../d.md)
[](#e)
[](?f)
[](//g.com)
[](/h:i)
[](?j:k)
[](#l:m)
`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    assert.equal(file.messages.length, 0)
  })

  await t.test('should checks full URLs', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `[](http://a.com)
[](https://b.com)
[](C:\\Documents\\c.md)
[](file:///Users/tilde/d.js)
`
    const file = await remark()
      // Note: `[]` to overwrite the default only-http check in `skipUrlPatterns`.
      .use(remarkLintNoDeadUrls, {skipUrlPatterns: []})
      .process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '1:1-1:17: Unexpected dead URL `http://a.com/`, expected live URL',
      '2:1-2:18: Unexpected dead URL `https://b.com/`, expected live URL',
      '3:1-3:22: Unexpected dead URL `c:\\Documents\\c.md`, expected live URL',
      '4:1-4:29: Unexpected dead URL `file:///Users/tilde/d.js`, expected live URL'
    ])
  })

  await t.test('should check relative URLs w/ `from`', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `
[](a.md)
[](/b.md)
[](./c.md)
[](../d.md)
[](#e)
[](?f)
[](//g.com)
`

    const file = await remark()
      .use(remarkLintNoDeadUrls, {from: 'https://example.com/from/folder'})
      .process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '2:1-2:9: Unexpected dead URL `https://example.com/from/a.md`, expected live URL',
      '3:1-3:10: Unexpected dead URL `https://example.com/b.md`, expected live URL',
      '4:1-4:11: Unexpected dead URL `https://example.com/from/c.md`, expected live URL',
      '5:1-5:12: Unexpected dead URL `https://example.com/d.md`, expected live URL',
      '6:1-6:7: Unexpected dead URL `https://example.com/from/folder#e`, expected live URL',
      '7:1-7:7: Unexpected dead URL `https://example.com/from/folder?f`, expected live URL',
      '8:1-8:12: Unexpected dead URL `https://g.com/`, expected live URL'
    ])
  })

  await t.test(
    'should check relative URLs w/ `meta.origin`, `meta.pathname`',
    async function () {
      const globalDispatcher = getGlobalDispatcher()
      const mockAgent = new MockAgent()
      mockAgent.enableNetConnect(/(?=a)b/)
      setGlobalDispatcher(mockAgent)

      const document = '[](a.md)'
      const file = await remark()
        .use(remarkLintNoDeadUrls)
        .process({
          data: {
            meta: {origin: 'https://example.com', pathname: '/from/folder'}
          },
          value: document
        })

      await mockAgent.close()
      await setGlobalDispatcher(globalDispatcher)

      file.messages.sort(compareMessage)

      assert.deepEqual(file.messages.map(String), [
        '1:1-1:9: Unexpected dead URL `https://example.com/from/a.md`, expected live URL'
      ])
    }
  )

  await t.test('should check definitions, images', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `
![image](https://example.com/a)

[link](https://example.com/b)

[definition]: https://example.com/c
`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '2:1-2:32: Unexpected dead URL `https://example.com/a`, expected live URL',
      '4:1-4:30: Unexpected dead URL `https://example.com/b`, expected live URL',
      '6:1-6:36: Unexpected dead URL `https://example.com/c`, expected live URL'
    ])
  })

  await t.test('should skip URLs w/ unknown protocols', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `
[a](mailto:me@me.com)

[b](ftp://path/to/file.txt)

[c](flopper://a/b/c)
`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test('should ignore localhost w/ `skipLocalhost`', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `
* [a](http://localhost)
* [b](http://localhost/alex/test)
* [c](http://localhost:3000)
* [d](http://localhost:3000/alex/test)
* [e](http://127.0.0.1)
* [f](http://127.0.0.1:3000)
* [g](http://example.com)
`
    const file = await remark()
      .use(remarkLintNoDeadUrls, {skipLocalhost: true})
      .process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '8:3-8:26: Unexpected dead URL `http://example.com/`, expected live URL'
    ])
  })

  await t.test('should support anchors', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)
    const site = mockAgent.get('https://example.com')

    site.intercept({path: '/'}).reply(200, '<h1 id=exists>hi</h1>', {
      headers: {'Content-Type': 'text/html'}
    })

    const document = `
[a](https://example.com#exists)
[b](https://example.com#does-not-exist)
`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '3:1-3:40: Unexpected dead URL `https://example.com/#does-not-exist`, expected live URL'
    ])
  })

  await t.test('should support `skipUrlPatterns`', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)

    const document = `
[a](http://aaa.com)
[b](http://aaa.com/somePath)
[c](http://aaa.com/somePath?withQuery=wow)
[d](http://bbb.com/somePath/maybe)
`
    const file = await remark()
      .use(remarkLintNoDeadUrls, {
        skipUrlPatterns: [/^http:\/\/aaa\.com/, '^http://bbb\\.com']
      })
      .process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test('should support `deadOrAlive` options', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)
    const site = mockAgent.get('https://example.com')

    site.intercept({path: '/'}).reply(200, '<h1>hi</h1>', {
      headers: {'Content-Type': 'text/html'}
    })

    const document = `[b](https://example.com#does-not-exist)`
    const file = await remark()
      .use(remarkLintNoDeadUrls, {deadOrAliveOptions: {checkAnchor: false}})
      .process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [])
  })

  await t.test('should support permanent redirects', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)
    const site = mockAgent.get('https://example.com')

    site.intercept({path: '/from'}).reply(301, '', {
      headers: {Location: '/to'}
    })

    site.intercept({path: '/to'}).reply(200, 'ok', {
      headers: {'Content-Type': 'text/html'}
    })

    const document = `[a](https://example.com/from)`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [
      '1:1-1:30: Unexpected redirecting URL `https://example.com/from`, expected final URL `https://example.com/to`'
    ])
  })

  await t.test('should support temporary redirects', async function () {
    const globalDispatcher = getGlobalDispatcher()
    const mockAgent = new MockAgent()
    mockAgent.enableNetConnect(/(?=a)b/)
    setGlobalDispatcher(mockAgent)
    const site = mockAgent.get('https://example.com')

    site.intercept({path: '/from'}).reply(302, '', {
      headers: {Location: '/to'}
    })

    site.intercept({path: '/to'}).reply(200, 'ok', {
      headers: {'Content-Type': 'text/html'}
    })

    const document = `[a](https://example.com/from)`
    const file = await remark().use(remarkLintNoDeadUrls).process(document)

    await mockAgent.close()
    await setGlobalDispatcher(globalDispatcher)

    file.messages.sort(compareMessage)

    assert.deepEqual(file.messages.map(String), [])
  })
})
