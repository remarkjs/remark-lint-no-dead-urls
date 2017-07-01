'use strict';

const rule = require('unified-lint-rule');
const visit = require('unist-util-visit');
const linkCheck = require('link-check');
const isRelativeUrl = require('is-relative-url');

function noDeadLinks(ast, file, baseUrl) {
  const promises = [];

  function validate(node) {
    let url = node.url;
    if (!url) return;
    if (isRelativeUrl(url) && !baseUrl) return;
    const nodePromise = new Promise((resolve, reject) => {
      linkCheck(url, { baseUrl }, (error, result) => {
        if (error) return reject(error);
        if (result.status !== 'alive') {
          file.message(`Link to ${node.url} is dead`, node);
        }
        resolve();
      });
    });
    promises.push(nodePromise);
  }

  visit(ast, 'link', validate);

  return Promise.all(promises);
}

module.exports = rule('remark-lint:no-dead-links', noDeadLinks);
