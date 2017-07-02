'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const linkCheck = require('link-check');
const isRelativeUrl = require('is-relative-url');

const defaultCache = {};
const pending = new Map();

function noDeadUrls(ast, file, options) {
  let baseUrl;
  if (typeof options === 'string') {
    baseUrl = options;
    options = {};
  } else {
    options = options || {};
    baseUrl = options.baseUrl;
  }
  const cache = options.cache || defaultCache;

  const warn = node => {
    file.message(`Link to ${node.url} is dead`, node);
  };

  // Ensure there's at least one Promise to resolve
  const promises = [Promise.resolve()];
  const validate = node => {
    let url = node.url;
    if (!url) return;

    if (cache[url] !== undefined) {
      if (cache[url] !== 'alive') warn(node);
      return;
    }

    if (pending.has(url)) {
      promises.push(
        pending.get(url).then(status => {
          if (status !== 'alive') warn(node);
        })
      );
      return;
    }

    if (isRelativeUrl(url) && !baseUrl) return;
    const checkUrl = new Promise((resolve, reject) => {
      linkCheck(url, { baseUrl }, (error, result) => {
        if (error) return reject(error);
        if (result.status !== 'alive') {
          warn(node);
        }
        cache[url] = result.status;
        pending.delete(url);
        resolve(result.status);
      });
    });
    pending.set(url, checkUrl);
    promises.push(checkUrl);
  };

  visit(ast, 'link', validate);
  visit(ast, 'definition', validate);
  visit(ast, 'image', validate);

  return Promise.all(promises);
}

module.exports = rule('remark-lint:no-dead-urls', noDeadUrls);
