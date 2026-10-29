import js from '@eslint/js';
import jsdoc from 'eslint-plugin-jsdoc';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
  {
    ignores: [
      'dist/**',
      'coverage/**',
      'playwright-report/**',
      'test-results/**',
      'blob-report/**',
    ],
  },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      jsdoc,
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
    rules: {
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      eqeqeq: ['error', 'always', { null: 'ignore' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'prefer-const': 'error',
      'no-var': 'error',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'react/prop-types': 'off',
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            FunctionDeclaration: true,
            ArrowFunctionExpression: false,
            FunctionExpression: false,
          },
        },
      ],
      'jsdoc/require-param': 'error',
      'jsdoc/require-returns': [
        'error',
        {
          contexts: ['FunctionDeclaration[id.name=/^[a-z]/]'],
        },
      ],
    },
  },
  {
    files: ['*.config.js', 'eslint.config.js', 'playwright.config.js', 'e2e/**/*.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  prettier,
];
