import { defineConfig, globalIgnores } from 'eslint/config';
import tseslint from 'typescript-eslint';
import js from '@eslint/js';
import solid from 'eslint-plugin-solid/configs/recommended';
import eslint from '@eslint/js';
import globals from 'globals';

import wxtAutoImports from './.wxt/eslint-auto-imports.mjs';

export default defineConfig([
  globalIgnores(['**/node_modules/**', '.wxt/**', '.output/**']),
  wxtAutoImports,
  js.configs.recommended,
  solid,
  eslint.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['scripts/**/*.{ts,js}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
  },
  {
    rules: {
      'no-empty-pattern': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          args: 'all',
          argsIgnorePattern: '^_',
          caughtErrors: 'all',
          caughtErrorsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          ignoreRestSiblings: true,
        },
      ],
    },
  },
]);
