'use strict';

const url = require('url');
const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const linkCheck = require('link-check');
const isRelativeUrl = require('is-relative-url');
const isOnline = require('is-online');

const defaultCache = {};
const pending = new Map();
const protocolWhitelist = new Set(['https:', 'http:']);

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

  const skipUrl = subjectUrl => {
    if (isRelativeUrl(subjectUrl)) {
      return !baseUrl;
    } else {
      const parsedUrl = url.parse(subjectUrl);
      return !protocolWhitelist.has(parsedUrl.protocol);
    }
  };

  // Ensure there's at least one Promise to resolve
  const promises = [Promise.resolve()];
  const validate = node => {
    let subjectUrl = node.url;
    if (!subjectUrl) return;

    if (skipUrl(subjectUrl)) return;

    if (cache[subjectUrl] !== undefined) {
      if (cache[subjectUrl] !== 'alive') warn(node);
      return;
    }

    if (pending.has(subjectUrl)) {
      promises.push(
        pending.get(subjectUrl).then(status => {
          if (status !== 'alive') warn(node);
        })
      );
      return;
    }

    const checkUrl = new Promise((resolve, reject) => {
      linkCheck(subjectUrl, { baseUrl }, (error, result) => {
        if (error) return reject(error);
        if (result.status !== 'alive') {
          warn(node);
        }
        cache[subjectUrl] = result.status;
        pending.delete(subjectUrl);
        resolve(result.status);
      });
    });
    pending.set(subjectUrl, checkUrl);
    promises.push(checkUrl);
  };

  visit(ast, 'link', validate);
  visit(ast, 'definition', validate);
  visit(ast, 'image', validate);

  return Promise.all(promises);
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
