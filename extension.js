import * as vscode from "vscode";

const TASK_PREFIX = /^\[([ xX])\][ \t]/;
const TASK_LINE = /^([ \t>*+\-\d.)]*)\[([ xX])\]/;

function encodeTarget(target) {
  return Buffer.from(JSON.stringify(target)).toString("base64url");
}

function decodeTarget(query) {
  try {
    const target = JSON.parse(Buffer.from(query, "base64url").toString());
    return Number.isInteger(target.line) && target.line >= 0 ? target : undefined;
  } catch {
    return undefined;
  }
}

function isTaskItem(tokens, index) {
  const first = tokens[index].children?.[0];
  return (
    tokens[index].type === "inline" &&
    tokens[index - 1].type === "paragraph_open" &&
    tokens[index - 2].type === "list_item_open" &&
    first?.type === "text" &&
    TASK_PREFIX.test(first.content)
  );
}

function findParent(tokens, index) {
  const level = tokens[index].level - 1;
  for (let i = index - 1; i >= 0; i--) {
    if (tokens[i].level === level) return tokens[i];
  }
  return undefined;
}

function renderCheckbox(token, env, toggleBase, escapeHtml) {
  const { checked, line, text } = token.meta;
  const state = checked ? " checked" : "";
  const document = env.currentDocument?.toString();
  if (!document) return `<input class="task-list-item-checkbox" type="checkbox"${state} disabled>`;

  const href = escapeHtml(`${toggleBase}?${encodeTarget({ document, line, text })}`);
  return `<a class="task-list-item-toggle" href="${href}"><input class="task-list-item-checkbox" type="checkbox"${state} tabindex="-1"></a>`;
}

function addTaskCheckboxes(state) {
  const { tokens } = state;
  const lists = new Set();
  let lines;

  for (let i = 2; i < tokens.length; i++) {
    if (!isTaskItem(tokens, i)) continue;

    const inline = tokens[i];
    const text = inline.children[0];
    const line = tokens[i - 1].map[0];
    lines = lines || state.src.split("\n");

    const checkbox = new state.Token("task_list_checkbox", "", 0);
    checkbox.meta = { checked: text.content[1] !== " ", line, text: lines[line] };
    inline.children.unshift(checkbox);
    text.content = text.content.slice(3);
    inline.content = inline.content.slice(3);

    tokens[i - 2].attrJoin("class", "task-list-item");
    lists.add(findParent(tokens, i - 2));
  }

  for (const list of lists) list?.attrJoin("class", "contains-task-list");
}

async function toggleTask(uri) {
  if (uri.path !== "/toggle") return;

  const target = decodeTarget(uri.query);
  if (!target) return;

  const document = vscode.workspace.textDocuments.find((doc) => doc.uri.toString() === target.document);
  if (!document || target.line >= document.lineCount) return;

  const { text } = document.lineAt(target.line);
  if (text !== target.text) return;

  const match = TASK_LINE.exec(text);
  if (!match) return;

  const column = match[1].length + 1;
  const edit = new vscode.WorkspaceEdit();
  edit.replace(
    document.uri,
    new vscode.Range(target.line, column, target.line, column + 1),
    match[2] === " " ? "x" : " ",
  );
  await vscode.workspace.applyEdit(edit);
}

function activate(context) {
  const toggleBase = `${vscode.env.uriScheme}://${context.extension.id}/toggle`;
  context.subscriptions.push(vscode.window.registerUriHandler({ handleUri: toggleTask }));

  return {
    extendMarkdownIt(md) {
      const defaultFence = md.renderer.rules.fence;

      md.renderer.rules.fence = (tokens, idx, options, env, self) => {
        const defaultHtml = defaultFence(tokens, idx, options, env, self);

        return `<div class="code-block-wrapper">
          <button class="copy-code-btn" aria-label="Copy code">
            <svg class="copy-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <svg class="check-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          ${defaultHtml}
        </div>`;
      };

      md.core.ruler.after("inline", "task_list_checkboxes", addTaskCheckboxes);
      md.renderer.rules.task_list_checkbox = (tokens, idx, _options, env) =>
        renderCheckbox(tokens[idx], env, toggleBase, md.utils.escapeHtml);

      return md;
    },
  };
}

function deactivate() {}

export { activate, deactivate };
