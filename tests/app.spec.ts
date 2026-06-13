// tests/app.spec.ts - 新架构核心 E2E 测试
import { test, expect, _electron as electron } from '@playwright/test'
import { join } from 'path'
import {
  waitForAppWindow,
  waitForText,
  navigateTo,
  waitForSidebar,
  waitForContent
} from './helpers'

import { existsSync } from 'node:fs'
const ELECTRON_PATH_NEW = join(__dirname, '..', 'node_modules', 'electron', 'dist', 'electron.exe')
const ELECTRON_PATH_OLD = join(__dirname, '..', '..', 'LH-YS', 'node_modules', 'electron', 'dist', 'electron.exe')
const ELECTRON_PATH = existsSync(ELECTRON_PATH_NEW) ? ELECTRON_PATH_NEW : ELECTRON_PATH_OLD
const APP_DIR = join(__dirname, '..')

test.describe('应用启动和布局', () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>
  let page: Awaited<ReturnType<typeof waitForAppWindow>>

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      executablePath: ELECTRON_PATH,
      args: [APP_DIR]
    })
    page = await waitForAppWindow(electronApp)
  })

  test.afterEach(async () => {
    if (electronApp) await electronApp.close()
  })

  test('应用应成功启动并显示标题', async () => {
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title).toContain('LH')
  })

  test('侧边栏应存在', async () => {
    await waitForSidebar(page)
    const sidebar = page.locator('.sidebar')
    await expect(sidebar).toBeVisible()
  })

  test('侧边栏应有导航项', async () => {
    await waitForSidebar(page)
    const items = page.locator('.sidebar-item')
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(5) // 首页、电视剧、电影、动漫等
  })

  test('自定义标题栏应存在', async () => {
    const titlebar = page.locator('.titlebar')
    await expect(titlebar).toBeVisible()

    // 应有关闭按钮
    const closeBtn = page.locator('.titlebar-close')
    await expect(closeBtn).toBeVisible()
  })
})

test.describe('路由导航', () => {
  let electronApp: Awaited<ReturnType<typeof electron.launch>>
  let page: Awaited<ReturnType<typeof waitForAppWindow>>

  test.beforeEach(async () => {
    electronApp = await electron.launch({
      executablePath: ELECTRON_PATH,
      args: [APP_DIR]
    })
    page = await waitForAppWindow(electronApp)
    await waitForSidebar(page)
  })

  test.afterEach(async () => {
    if (electronApp) await electronApp.close()
  })

  test('首页应加载内容', async () => {
    await waitForContent(page)
    const title = await page.title()
    expect(title).toContain('首页')
  })

  test('点击电视剧导航应切换到电视剧页', async () => {
    const ok = await navigateTo(page, '电视剧')
    expect(ok).toBeTruthy()

    const title = await page.title()
    expect(title).toContain('电视剧')
  })

  test('点击电影导航应切换到电影页', async () => {
    const ok = await navigateTo(page, '电影')
    expect(ok).toBeTruthy()

    const title = await page.title()
    expect(title).toContain('电影')
  })

  test('点击搜索导航应切换到搜索页', async () => {
    const ok = await navigateTo(page, '搜索')
    expect(ok).toBeTruthy()

    // 搜索页应有搜索输入框
    const searchInput = page.locator('input[type="text"]').first()
    await expect(searchInput).toBeVisible()
  })

  test('点击设置导航应切换到设置页', async () => {
    const ok = await navigateTo(page, '设置')
    expect(ok).toBeTruthy()

    await waitForText(page, '设置', 5000)
  })
})
