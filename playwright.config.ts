// playwright.config.ts - Playwright E2E 测试配置（LH-TV 新架构）
import { defineConfig } from '@playwright/test'
import { join } from 'path'

import { existsSync } from 'node:fs'
// Electron 二进制：新项目中 node_modules/electron 未完整下载，回退到旧项目
const ELECTRON_PATH_OLD = join(__dirname, '..', 'LH-YS', 'node_modules', 'electron', 'dist', 'electron.exe')
const ELECTRON_PATH_NEW = join(__dirname, 'node_modules', 'electron', 'dist', 'electron.exe')
const ELECTRON_PATH = existsSync(ELECTRON_PATH_NEW) ? ELECTRON_PATH_NEW : ELECTRON_PATH_OLD
const APP_DIR = __dirname

export default defineConfig({
  testDir: './tests',
  timeout: 60000,
  expect: { timeout: 10000 },
  retries: 1,
  workers: 1, // Electron 不支持并行
  reporter: [
    ['list'],
    ['json', { outputFile: 'test-results.json' }]
  ],
  use: {
    viewport: { width: 1280, height: 800 },
    actionTimeout: 15000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure'
  },
  projects: [
    {
      name: 'electron',
      use: {
        launchOptions: {
          executablePath: ELECTRON_PATH,
          args: [APP_DIR]
        }
      }
    }
  ]
})
