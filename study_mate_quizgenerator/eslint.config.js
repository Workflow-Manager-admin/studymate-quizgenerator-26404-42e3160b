/** @type {import("eslint").FlatConfig[]} */
const jsConfig = {
  files: ['**/*.js'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'commonjs',
  },
  rules: {
    semi: ['error', 'always'],
    quotes: ['error', 'single'],
  },
};

const ignoreConfig = {
  // Ignore node_modules and frontend client folder from backend linting
  ignores: ['node_modules/**', 'client/**'],
};

module.exports = [ignoreConfig, jsConfig];