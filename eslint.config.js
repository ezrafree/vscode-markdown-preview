const globals = require('globals');

module.exports = [
  {
    ignores: ['.vscode-test/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      'no-const-assign': 'error',
      'no-this-before-super': 'error',
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
      'constructor-super': 'error',
      'valid-typeof': 'error',
    },
  },
  {
    files: ['test/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.mocha,
      },
    },
  },
  {
    files: ['preview.js'],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
