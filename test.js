import assert from 'node:assert/strict'
import test from 'node:test'
import {remark} from 'remark'
import {MockAgent, getGlobalDispatcher, setGlobalDispatcher} from 'undici'
import {compareMessage} from 'vfile-sort'
import remarkLintNoDeadUrls from './index.js'

test('works', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)
  const a = mockAgent.get('https://exists.com')
  a.intercept({path: '/'}).reply(200, 'ok')
  a.intercept({path: '/does/not/'}).reply(404, 'nok')

  mockAgent
    .get('https://does-not-exists.com')
    .intercept({path: '/'})
    .reply(404, 'nok')

  const file = await remark().use(remarkLintNoDeadUrls).process(`
# Title

Here is a [good link](https://exists.com).

Here is a [bad link](https://exists.com/does/not/).

Here is another [bad link](https://does-not-exists.com).
  `)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    [
      'Link to https://exists.com/does/not/ is dead',
      'Link to https://does-not-exists.com/ is dead'
    ]
  )
})

test('works w/o URLs', async () => {
  const file = await remark().use(remarkLintNoDeadUrls).process(`
# Title

No URLs in here.
`)

  assert.equal(file.messages.length, 0)
})

test('ignores URLs relative to the current URL normally', async () => {
  const file = await remark().use(remarkLintNoDeadUrls).process(`
[](a.md)
[](/b.md)
[](./c.md)
[](../d.md)
[](#e)
[](?f)
[](//g.com)
[](/h:i)
[](?j:k)
[](#l:m)
`)

  assert.equal(file.messages.length, 0)
})

test('checks full URLs normally', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls, {
    // Note: `[]` to overwrite the default only-http check in `skipUrlPatterns`.
    skipUrlPatterns: []
  }).process(`
[](http://a.com)
[](https://b.com)
[](C:\\Documents\\c.md)
[](file:///Users/tilde/d.js)
`)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    [
      'Link to http://a.com/ is dead',
      'Link to https://b.com/ is dead',
      'Link to c:\\Documents\\c.md is dead',
      'Link to file:///Users/tilde/d.js is dead'
    ]
  )
})

test('checks relative URLs w/ `from`', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls, {
    from: 'https://example.com/from/folder'
  }).process(`
[](a.md)
[](/b.md)
[](./c.md)
[](../d.md)
[](#e)
[](?f)
[](//g.com)
`)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    [
      'Link to https://example.com/from/a.md is dead',
      'Link to https://example.com/b.md is dead',
      'Link to https://example.com/from/c.md is dead',
      'Link to https://example.com/d.md is dead',
      'Link to https://example.com/from/folder#e is dead',
      'Link to https://example.com/from/folder?f is dead',
      'Link to https://g.com/ is dead'
    ]
  )
})

test('checks relative URLs w/ `meta.origin`, `meta.pathname`', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark()
    .use(remarkLintNoDeadUrls)
    .process({
      data: {meta: {origin: 'https://example.com', pathname: '/from/folder'}},
      value: '[](a.md)'
    })

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    ['Link to https://example.com/from/a.md is dead']
  )
})

test('works with definitions and images', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls).process(`
![image](https://example.com/a)

[link](https://example.com/b)

[definition]: https://example.com/c
    `)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    [
      'Link to https://example.com/a is dead',
      'Link to https://example.com/b is dead',
      'Link to https://example.com/c is dead'
    ]
  )
})

test('skips URLs with unsupported protocols', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls).process(`
[a](mailto:me@me.com)

[b](ftp://path/to/file.txt)

[c](flopper://a/b/c)
`)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    []
  )
})

test('ignores localhost when skipLocalhost enabled', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls, {skipLocalhost: true})
    .process(`
* [a](http://localhost)
* [b](http://localhost/alex/test)
* [c](http://localhost:3000)
* [d](http://localhost:3000/alex/test)
* [e](http://127.0.0.1)
* [f](http://127.0.0.1:3000)
`)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    []
  )
})

test('skipUrlPatterns for content', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)

  const file = await remark().use(remarkLintNoDeadUrls, {
    skipUrlPatterns: [/^http:\/\/aaa\.com/, '^http://bbb\\.com']
  }).process(`
[a](http://aaa.com)
[b](http://aaa.com/somePath)
[c](http://aaa.com/somePath?withQuery=wow)
[d](http://bbb.com/somePath/maybe)
`)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    []
  )
})

test('should support anchors', async () => {
  const globalDispatcher = getGlobalDispatcher()
  const mockAgent = new MockAgent()
  mockAgent.enableNetConnect(/(?=a)b/)
  setGlobalDispatcher(mockAgent)
  const site = mockAgent.get('https://example.com')

  site.intercept({path: '/'}).reply(200, '<h1 id=exists>hi</h1>', {
    headers: {'Content-Type': 'text/html'}
  })

  const file = await remark().use(remarkLintNoDeadUrls).process(`
[a](https://example.com#exists)
[b](https://example.com#does-not-exist)
  `)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    ['Link to https://example.com/#does-not-exist is dead']
  )
})

test('should support redirects', async () => {
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

  const file = await remark().use(remarkLintNoDeadUrls).process(`
[a](https://example.com/from)
  `)

  await mockAgent.close()
  await setGlobalDispatcher(globalDispatcher)

  file.messages.sort(compareMessage)

  assert.deepEqual(
    file.messages.map((d) => d.reason),
    ['Link to https://example.com/from redirects to https://example.com/to']
  )
})
