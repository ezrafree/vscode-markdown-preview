const assert = require('assert');
const { activate } = require('../../extension');

function createMockMd(fenceHtml) {
  return {
    renderer: {
      rules: {
        fence: () => fenceHtml,
      },
    },
  };
}

suite('activate()', () => {
  test('returns an object with extendMarkdownIt', () => {
    const result = activate({});
    assert.strictEqual(typeof result.extendMarkdownIt, 'function');
  });
});

suite('extendMarkdownIt()', () => {
  test('returns the md instance', () => {
    const md = createMockMd('<pre><code>hello</code></pre>');
    const { extendMarkdownIt } = activate({});
    const result = extendMarkdownIt(md);
    assert.strictEqual(result, md);
  });

  test('overrides the fence renderer', () => {
    const original = () => '';
    const md = { renderer: { rules: { fence: original } } };
    const { extendMarkdownIt } = activate({});
    extendMarkdownIt(md);
    assert.notStrictEqual(md.renderer.rules.fence, original);
  });

  test('wraps fence output in .code-block-wrapper', () => {
    const md = createMockMd('<pre><code>hello</code></pre>');
    const { extendMarkdownIt } = activate({});
    extendMarkdownIt(md);
    const output = md.renderer.rules.fence([], 0, {}, {}, {});
    assert.ok(output.includes('code-block-wrapper'), 'missing code-block-wrapper');
  });

  test('includes copy button', () => {
    const md = createMockMd('<pre><code>hello</code></pre>');
    const { extendMarkdownIt } = activate({});
    extendMarkdownIt(md);
    const output = md.renderer.rules.fence([], 0, {}, {}, {});
    assert.ok(output.includes('copy-code-btn'), 'missing copy-code-btn');
  });

  test('preserves original fence html', () => {
    const fenceHtml = '<pre><code>const x = 1;</code></pre>';
    const md = createMockMd(fenceHtml);
    const { extendMarkdownIt } = activate({});
    extendMarkdownIt(md);
    const output = md.renderer.rules.fence([], 0, {}, {}, {});
    assert.ok(output.includes(fenceHtml), 'original fence html was not preserved');
  });
});
