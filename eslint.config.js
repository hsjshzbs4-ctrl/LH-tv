import tseslint from '@typescript-eslint/eslint-plugin';
import tsparser from '@typescript-eslint/parser';
import pluginVue from 'eslint-plugin-vue';
import vueparser from 'vue-eslint-parser';

export default [
  // 全局忽略
  {
    ignores: [
      'out/**',
      'dist/**',
      'node_modules/**',
      '*.config.*',
      'scripts/**',
      'developer-platform/**',
      'mobile/**',
    ],
  },

  // TypeScript + Vue 文件
  {
    files: ['src/**/*.ts', 'src/**/*.vue', 'electron/**/*.ts'],
    languageOptions: {
      parser: vueparser,
      parserOptions: {
        parser: tsparser,
        ecmaVersion: 2022,
        sourceType: 'module',
        extraFileExtensions: ['.vue'],
      },
      globals: {
        console: 'readonly',
        document: 'readonly',
        window: 'readonly',
        process: 'readonly',
        NodeJS: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
      vue: pluginVue,
    },
    rules: {
      // 基础检查
      'no-console': 'warn',
      'no-debugger': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-empty-function': 'warn',
      // Vue
      'vue/multi-word-component-names': 'off',
      'vue/no-v-html': 'warn',
      'vue/require-default-prop': 'off',
    },
  },
];
