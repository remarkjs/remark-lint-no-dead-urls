'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const checkLinks = require('check-links');
const isOnline = require('is-online');

function noDeadUrls(ast, file, options) {
  const urlToNodes = {};

  const aggregate = node => {
    const url = node.url;
    if (!url) return;

    if (!urlToNodes[url]) {
      urlToNodes[url] = [];
    }

    urlToNodes[url].push(node);
  };

  visit(ast, 'link', aggregate);
  visit(ast, 'definition', aggregate);
  visit(ast, 'image', aggregate);

  return checkLinks(Object.keys(urlToNodes), options).then(results => {
    for (const url in results) {
      const result = results[url];
      if (result.status !== 'dead') continue;

      const nodes = urlToNodes[url];
      if (!nodes) continue;

      for (const node of nodes) {
        file.message(`Link to ${url} is dead`, node);
      }
    }
  });
}

function wrapper(ast, file, options) {
  options = options || {};
  return isOnline().then(online => {
    if (!online) {
      if (!options.skipOffline) {
        file.message('You are not online and have not set skipOffline: true.');
      }
      return;
    }
    return noDeadUrls(ast, file, options);
  });
}

module.exports = rule('remark-lint:no-dead-urls', wrapper);
