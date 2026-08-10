import eslint from '@eslint/js'
import { defineConfig } from 'eslint/config'
import tseslint from 'typescript-eslint'
import pluginVue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import eslintConfigPrettier from 'eslint-config-prettier'

export default defineConfig(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs['flat/recommended'],
  eslintConfigPrettier,
  {
    files: ['**/*.ts'],
    ignores: ['**/*.d.ts'],
    languageOptions: {
      parserOptions: {
        // Use TypeScript's project service instead of a static project glob.
        // Robust to lint-staged invocations on newly-added files that the
        // glob hasn't picked up yet.
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    files: ['**/*.vue'],
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: tseslint.parser,
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
    },
  },
  {
    files: ['**/*.{ts,vue}'],
    languageOptions: {
      globals: {
        window: 'readonly',
        document: 'readonly',
        getComputedStyle: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/semi': 'off',
      'no-undef': 'off',
      semi: 'off',
      'vue/multi-word-component-names': 'off',
      'vue/block-order': ['error', { order: ['template', 'script', 'style'] }],
      '@typescript-eslint/naming-convention': [
        'error',
        { selector: 'interface', format: ['PascalCase'], prefix: ['I'] },
        { selector: 'enum', format: ['PascalCase'], prefix: ['E'] },
        { selector: 'typeAlias', format: ['PascalCase'], prefix: ['T'] },
      ],
    },
  },
  {
    // src/global.d.ts augments `vue` with `interface GlobalComponents`. That
    // name is Vue's, not ours: its template checker looks up that exact
    // identifier to resolve tags that were never imported. Renaming it to fit
    // our `I` prefix produces a valid augmentation of an interface nothing
    // reads, which is how every <Nb*> tag silently stayed `any` for consumers
    // from 1.53.1 through 1.56.0. The file is generated, so the rule would
    // also be unfixable at the source. `scripts/verify-consumer-globals.mjs`
    // fails the build if the name ever drifts again.
    files: ['src/global.d.ts'],
    rules: {
      '@typescript-eslint/naming-convention': 'off',
    },
  },
  {
    ignores: [
      'dist/',
      'docs/.vitepress/**',
      '**/.vitepress/**',
      '.vitepress/',
      'node_modules/',
      '*.js',
      '*.mjs',
    ],
  },
)
