import { defineConfig } from 'vitest/config'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@electron': resolve(__dirname, 'electron'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@provider-contracts': resolve(__dirname, 'src/provider-contracts/index.ts'),
      '@developer-platform': resolve(__dirname, 'developer-platform'),
      '@platform': resolve(__dirname, 'src/platform'),
      '@ai': resolve(__dirname, 'src/ai'),
    },
  },
  test: {
    // jsdom 提供 window / document / localStorage 等 DOM API
    environment: 'jsdom',
    // 显式导入 describe/it/expect/vi，避免全局变量污染
    globals: false,
    // 测试文件匹配
    include: [
      'tests/unit/**/*.spec.ts',
      'tests/integration/**/*.spec.ts',
      'tests/architecture/**/*.spec.ts',
      'tests/persistence/**/*.spec.ts',
      'tests/stress/**/*.spec.ts',
      'tests/plugin-marketplace/**/*.spec.ts',
      'tests/marketplace/**/*.spec.ts',
      'tests/developer-platform/**/*.spec.ts',
      'tests/performance/**/*.spec.ts',
    ],
    // 全局 setup 在每个测试文件前运行
    setupFiles: [
      'tests/setup/vitest.setup.ts',
    ],
    // 覆盖率配置
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
      reportsDirectory: 'tests/reports/coverage',
      include: ['src/**/*.ts'],
      exclude: [
        'src/**/*.types.ts',
        'src/**/types/**',
        'src/env.d.ts',
        'src/main.ts',
        'src/router/**',
        'src/stores/**',
        'src/components/**/*.vue',
        'src/views/**/*.vue',
        'src/composables/**',
        'src/types/index.ts',
      ],
      // 覆盖率阈值（RC 标准）
      thresholds: {
        'src/shared/storage/storage.service.ts': { lines: 95 },
        'src/core/cache/**/*.ts': { lines: 95 },
        'src/core/**/manager/**/*.ts': { lines: 95 },
        'src/core/**/facade/**/*.ts': { lines: 90 },
        'src/core/**/*.ts': { lines: 80 },
      },
    },
    // 超时
    testTimeout: 10000,
    hookTimeout: 10000,
  },
})
