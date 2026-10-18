import assert from 'assert';
import markdownit from 'markdown-it';
import { window, workspace } from 'vscode';
import { activate } from '../../extension.js';

const documentUri = { toString: () => 'file:///notes/todo.md' };

function createContext() {
  return { subscriptions: [], extension: { id: 'ezrafree.markdown-preview' } };
}

// VS Code parses (and caches tokens) without the document, then renders with it.
function render(source, env = { currentDocument: documentUri }) {
  const { extendMarkdownIt } = activate(createContext());
  const md = extendMarkdownIt(markdownit());
  return md.renderer.render(md.parse(source, {}), md.options, env);
}

function toggleLinks(html) {
  return [...html.matchAll(/class="task-list-item-toggle" href="([^"]+)"/g)].map((match) => new URL(match[1]));
}

function decodeLink(link) {
  return JSON.parse(Buffer.from(link.search.slice(1), 'base64url').toString());
}

function openDocument(source) {
  const lines = source.split('\n');
  workspace.textDocuments = [
    { uri: documentUri, lineCount: lines.length, lineAt: (line) => ({ text: lines[line] }) },
  ];
}

function applyEdits(source) {
  const lines = source.split('\n');
  for (const edit of workspace.appliedEdits) {
    for (const { range, newText } of edit.replacements) {
      const text = lines[range.start.line];
      lines[range.start.line] = text.slice(0, range.start.character) + newText + text.slice(range.end.character);
    }
  }
  return lines.join('\n');
}

async function click(source, index = 0, current = source) {
  const link = toggleLinks(render(source))[index];
  openDocument(current);
  await window.uriHandler.handleUri({ path: link.pathname, query: link.search.slice(1) });
  return applyEdits(current);
}

suite('task list rendering', () => {
  test('renders an unchecked task as a checkbox link', () => {
    const html = render('- [ ] buy milk');
    assert.ok(html.includes('<input class="task-list-item-checkbox" type="checkbox" tabindex="-1">'), html);
    assert.ok(html.includes('href="vscode://ezrafree.markdown-preview/toggle?'), html);
    assert.ok(!html.includes('[ ]'), html);
  });

  test('renders [x] and [X] as checked', () => {
    const html = render('- [x] one\n- [X] two');
    assert.strictEqual(html.match(/type="checkbox" checked/g).length, 2, html);
  });

  test('adds task list classes to the item and its list', () => {
    const html = render('- [ ] one\n- [x] two\n- plain');
    assert.ok(html.includes('<ul class="contains-task-list">'), html);
    assert.strictEqual(html.match(/<li class="task-list-item">/g).length, 2, html);
    assert.ok(html.includes('<li>plain</li>'), html);
  });

  test('leaves other brackets alone', () => {
    const html = render('- plain item [ ]\n- [x]no space\n\n[ ] not in a list');
    assert.ok(!html.includes('checkbox'), html);
  });

  test('renders a disabled checkbox without a document', () => {
    const html = render('- [x] task', {});
    assert.ok(html.includes('<input class="task-list-item-checkbox" type="checkbox" checked disabled>'), html);
    assert.ok(!html.includes('task-list-item-toggle'), html);
  });

  test('links each checkbox to its source line', () => {
    const source = '# Todo\n\n- [ ] first\n  - [x] nested\n\n1. [ ] ordered';
    const targets = toggleLinks(render(source)).map(decodeLink);
    assert.deepStrictEqual(targets, [
      { document: 'file:///notes/todo.md', line: 2, text: '- [ ] first' },
      { document: 'file:///notes/todo.md', line: 3, text: '  - [x] nested' },
      { document: 'file:///notes/todo.md', line: 5, text: '1. [ ] ordered' },
    ]);
  });
});

suite('task toggling', () => {
  setup(() => {
    workspace.textDocuments = [];
    workspace.appliedEdits = [];
  });

  test('registers a URI handler', () => {
    const context = createContext();
    activate(context);
    assert.strictEqual(context.subscriptions.length, 1);
    assert.strictEqual(typeof window.uriHandler.handleUri, 'function');
  });

  test('checks an unchecked task', async () => {
    assert.strictEqual(await click('- [ ] one\n- [ ] two', 1), '- [ ] one\n- [x] two');
  });

  test('unchecks [x] and [X]', async () => {
    assert.strictEqual(await click('- [x] one'), '- [ ] one');
    workspace.appliedEdits = [];
    assert.strictEqual(await click('* [X] one'), '* [ ] one');
  });

  test('toggles tasks in blockquotes and nested ordered lists', async () => {
    assert.strictEqual(await click('> 1. [ ] quoted'), '> 1. [x] quoted');
    workspace.appliedEdits = [];
    assert.strictEqual(await click('- parent\n    1) [x] child'), '- parent\n    1) [ ] child');
  });

  test('ignores a click when the line changed since rendering', async () => {
    const current = '- [ ] inserted\n- [ ] one';
    assert.strictEqual(await click('- [ ] one\n- [ ] two', 1, current), current);
    assert.strictEqual(workspace.appliedEdits.length, 0);
  });

  test('ignores a click when the document is not open', async () => {
    const link = toggleLinks(render('- [ ] one'))[0];
    await window.uriHandler.handleUri({ path: link.pathname, query: link.search.slice(1) });
    assert.strictEqual(workspace.appliedEdits.length, 0);
  });

  test('ignores malformed links', async () => {
    openDocument('- [ ] one');
    const payload = Buffer.from(JSON.stringify({ document: 'file:///notes/todo.md', line: 0, text: '- [ ] one' }));
    await window.uriHandler.handleUri({ path: '/toggle', query: 'not-json' });
    await window.uriHandler.handleUri({ path: '/other', query: payload.toString('base64url') });
    await window.uriHandler.handleUri({ path: '/toggle', query: Buffer.from('{"line":-1}').toString('base64url') });
    assert.strictEqual(workspace.appliedEdits.length, 0);
  });
});
