# ~/.claude/CLAUDE.md

Markdown Preview - A VS Code extension that enhances the Markdown Preview panel which is shown when previewing a markdown file.

## Stack

- JavaScript
- CSS
- JSON

## Structure

- `test/` – Unit tests
- `images/` – Images which are used in this project's `README.md` document
- `extension.js`
- `preview.js`
- `style.css`

## Commands

- `yarn test` - Run the unit tests

## Verification

After every change, run in this order:

- `yarn test` - Run the unit tests
- When ready, if the user indicates we are ready to release, bump the version number in `package.json`
- When ready, if the user indicates we are ready to release, update the `CHANGELOG.md` file with a new section defining a version number and a bulleted list of the changes that were made

## Conventions

- Use SemVer version numbers. Use a minor version bump if the changes included features, or use a patch version bump if the changes were only bug fixes.
- Namings of variables, functions, files and directories should be descriptive but concise.
- Use `yarn` in this project.
