const base = require('./base');

/** @type {import('eslint').Linter.Config} */
const config = {
  ...base,
  rules: {
    ...base.rules,
    '@typescript-eslint/no-unsafe-assignment': 'warn',
    '@typescript-eslint/no-unsafe-member-access': 'warn',
  },
};

module.exports = config;
