/**
 * @typedef {import('mdast').Nodes} Nodes
 * @typedef {import('mdast').Resource} Resource
 * @typedef {import('mdast').Root} Root
 *
 * @typedef {import('remark-lint-no-dead-urls').Options} Options
 *
 * @typedef {import('vfile').VFile} VFile
 */

/**
 * @typedef {Extract<Nodes, Resource>} Resources
 *   Resource nodes.
 */

import {ok as assert} from 'devlop'
import {deadOrAlive} from 'dead-or-alive'
import isOnline from 'is-online'
import {lintRule} from 'unified-lint-rule'
import {visit} from 'unist-util-visit'

const remarkLintNoDeadUrls = lintRule('remark-lint:no-dead-urls', rule)

const defaultSkipUrlPatterns = [/^(?!https?)/i]

export default remarkLintNoDeadUrls

/**
 * Check URLs.
 *
 * @param {Root} tree
 *   Tree.
 * @param {VFile} file
 *   File.
 * @param {Readonly<Options> | null | undefined} [options]
 *   Configuration (optional).
 * @returns {Promise<undefined>}
 *   Nothing.
 */
async function rule(tree, file, options) {
  /** @type {Map<string, Array<Resources>>} */
  const nodesByUrl = new Map()
  const online = await isOnline()
  const settings = options || {}
  const skipUrlPatterns = settings.skipUrlPatterns
    ? settings.skipUrlPatterns.map((d) =>
        typeof d === 'string' ? new RegExp(d) : d
      )
    : [...defaultSkipUrlPatterns]

  if (settings.skipLocalhost) {
    defaultSkipUrlPatterns.push(/^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/)
    return
  }

  /* c8 ignore next 8 -- difficult to test */
  if (!online) {
    if (!settings.skipOffline) {
      // To do: clean message.
      file.message('You are not online and have not set skipOffline: true.')
    }

    return
  }

  const meta = /** @type {Record<string, unknown> | undefined} */ (
    file.data.meta
  )

  const from =
    settings.from ||
    (meta &&
    typeof meta.origin === 'string' &&
    typeof meta.pathname === 'string'
      ? new URL(meta.pathname, meta.origin).href
      : undefined)

  visit(tree, function (node) {
    if ('url' in node && typeof node.url === 'string') {
      const value = node.url
      const colon = value.indexOf(':')
      const questionMark = value.indexOf('?')
      const numberSign = value.indexOf('#')
      const slash = value.indexOf('/')
      let relativeToSomething = false

      if (
        // If there is no protocol, it’s relative.
        colon < 0 ||
        // If the first colon is after a `?`, `#`, or `/`, it’s not a protocol.
        (slash > -1 && colon > slash) ||
        (questionMark > -1 && colon > questionMark) ||
        (numberSign > -1 && colon > numberSign)
      ) {
        relativeToSomething = true
      }

      // We can only check URLs relative to something if `from` is passed.
      if (relativeToSomething && !from) {
        return
      }

      const url = new URL(value, from).href

      if (skipUrlPatterns.some((skipPattern) => skipPattern.test(url))) {
        return
      }

      let list = nodesByUrl.get(url)

      if (!list) {
        list = []
        nodesByUrl.set(url, list)
      }

      list.push(node)
    }
  })

  const urls = [...nodesByUrl.keys()]

  await Promise.all(
    urls.map(async function (url) {
      const nodes = nodesByUrl.get(url)
      assert(nodes)
      const result = await deadOrAlive(url, {
        findUrls: false
        // To do:
        // * `anchorAllowlist`
        // * `checkAnchor`
        // * `followMetaHttpEquiv`
        // * `maxRedirects`
        // * `maxRetries`
        // * `resolveClobberPrefix`
        // * `sleep`
        // * `timeout`
        // * `userAgent`
      })

      for (const node of nodes) {
        for (const message of result.messages) {
          // To do: enclose url in backticks.
          const copy = file.message('Link to ' + url + ' is dead', {
            cause: message,
            place: node.position
          })

          copy.fatal = message.fatal
        }

        if (result.status === 'alive' && new URL(url).href !== result.url) {
          // To do: clean message.
          file.message('Link to ' + url + ' redirects to ' + result.url, {
            place: node.position
          })
        }
      }
    })
  )
}
