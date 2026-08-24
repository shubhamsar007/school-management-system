const base = require('./base');

/** @type {import('eslint').Linter.Config} */
const config = {
  ...base,
  extends: [
    ...base.extends,
    'next/core-web-vitals',
  ],
  rules: {
    ...base.rules,
    '@next/next/no-html-link-for-pages': 'error',
  },
};

module.exports = config;
