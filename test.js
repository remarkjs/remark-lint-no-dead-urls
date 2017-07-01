'use strict';

const remark = require('remark');
const dedent = require('dedent');
const plugin = require('./index');

const processMarkdown = (md, baseUrl) => {
  return remark()
    .use(plugin, baseUrl)
    .process(md);
};

describe('remark-lint-no-dead-links', () => {
  test('works', () => {
    return processMarkdown(dedent`
      # Title

      Here is a [good link](https://www.github.com).

      Here is a [bad link](https://github.com/unified/oops).
    `).then(vFile => {
      expect(vFile.messages.length).toBe(1);
      expect(vFile.messages[0].reason).toBe('Link to https://github.com/unified/oops is dead');
    });
  });

  test('skips relative URL without baseUrl', () => {
    return processMarkdown(dedent`
      Here is a [good relative link](/wooorm/remark).

      Here is a [bad relative link](/wooorm/reeeemark).
    `).then(vFile => {
      expect(vFile.messages.length).toBe(0);
    });
  });

  test('checks relative URL with baseUrl', () => {
    return processMarkdown(dedent`
      Here is a [good relative link](/wooorm/remark).

      Here is a [bad relative link](/wooorm/reeeemark).
    `, 'https://www.github.com').then(vFile => {
      expect(vFile.messages.length).toBe(1);
      expect(vFile.messages[0].reason).toBe('Link to /wooorm/reeeemark is dead');
    });
  });
});
