import {lintRule} from 'unified-lint-rule'
import {visit} from 'unist-util-visit'
import checkLinks from 'check-links'
import isOnline from 'is-online'

/**
 * @typedef {import('mdast').Root} Root
 * @typedef {import('mdast').Link} Link
 * @typedef {import('mdast').Image} Image
 * @typedef {import('mdast').Definition} Definition
 *
 * @typedef {Object} Options
 * @property {import('got').OptionsOfTextResponseBody} [gotOptions]
 * @property {boolean} [skipLocalhost]
 * @property {boolean} [skipOffline]
 * @property {Array<string>} [skipUrlPatterns]
 */

/** @type {import('unified-lint-rule').Rule<Root, Options>} */
function noDeadUrls(ast, file, options) {
  /** @type {{[url: string]: Array<Link | Image | Definition>}} */
  const urlToNodes = {}

  visit(ast, ['link', 'image', 'definition'], (node) => {
    if (!('url' in node) || !node.url) return
    const url = node.url
    if (
      options.skipLocalhost &&
      /^(https?:\/\/)(localhost|127\.0\.0\.1)(:\d+)?/.test(url)
    ) {
      return
    }

    if (
      options.skipUrlPatterns &&
      options.skipUrlPatterns.some((skipPattern) =>
        new RegExp(skipPattern).test(url)
      )
    ) {
      return
    }

    if (!urlToNodes[url]) {
      urlToNodes[url] = []
    }

    urlToNodes[url].push(node)
  })

  return checkLinks(Object.keys(urlToNodes), options.gotOptions).then(
    (results) => {
      for (const url of Object.keys(results)) {
        const result = results[url]
        if (result.status !== 'dead') continue

        const nodes = urlToNodes[url]
        if (!nodes) continue

        for (const node of nodes) {
          file.message(`Link to ${url} is dead`, node)
        }
      }
    }
  )
}

/** @type {import('unified-lint-rule').Rule<Root, Options>} */
function wrapper(ast, file, options = {}) {
  return isOnline().then((online) => {
    if (!online) {
      if (!options.skipOffline) {
        file.message('You are not online and have not set skipOffline: true.')
      }

      return
    }

    return noDeadUrls(ast, file, options)
  })
}

const remarkLintNoDeadLinks = lintRule('remark-lint:no-dead-urls', wrapper)

export default remarkLintNoDeadLinks
