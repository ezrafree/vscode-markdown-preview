export const env = { uriScheme: 'vscode' };

export const window = {
  uriHandler: undefined,
  registerUriHandler(handler) {
    window.uriHandler = handler;
    return { dispose() {} };
  },
};

export const workspace = {
  textDocuments: [],
  appliedEdits: [],
  async applyEdit(edit) {
    workspace.appliedEdits.push(edit);
    return true;
  },
};

export class Range {
  constructor(startLine, startCharacter, endLine, endCharacter) {
    this.start = { line: startLine, character: startCharacter };
    this.end = { line: endLine, character: endCharacter };
  }
}

export class WorkspaceEdit {
  constructor() {
    this.replacements = [];
  }

  replace(uri, range, newText) {
    this.replacements.push({ uri, range, newText });
  }
}
