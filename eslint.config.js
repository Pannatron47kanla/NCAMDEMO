import js from '@eslint/js';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import boundaries from './eslint.boundaries.js';

export default [
  { ignores: ['dist/**', 'node_modules/**', '.claude/**', '.superpowers/**', '.code-review-graph/**', 'docs/**', 'playwright-report/**', 'test-results/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { globals: { ...globals.browser } },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    files: ['*.config.{js,ts}', 'eslint.boundaries.js', 'tests/**/*.ts'],
    languageOptions: { globals: { ...globals.node } },
  },
  ...boundaries,
];
