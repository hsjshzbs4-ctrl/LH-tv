// tests/helpers.ts - LH-TV E2E 测试辅助函数（新架构）
import type { ElectronApplication, Page } from '@playwright/test'

/**
 * 启动 Electron 应用并返回第一个窗口的 Page 对象
 */
export async function waitForAppWindow(electronApp: ElectronApplication): Promise<Page> {
  const page = await electronApp.firstWindow()
  // 等待 SPA 渲染完成
  await page.waitForTimeout(3000)
  return page
}

/**
 * 等待指定文本出现在页面上
 */
export async function waitForText(page: Page, text: string, timeout = 10000): Promise<void> {
  await page.waitForFunction(
    (t: string) => document.body.innerText.indexOf(t) !== -1,
    text,
    { timeout }
  )
}

/**
 * 通过侧边栏导航到指定页面
 */
export async function navigateTo(page: Page, pageName: string): Promise<boolean> {
  // 新架构使用侧边栏 .sidebar-item（文本包含 emoji 前缀，如 "📺 电视剧"）
  const items = page.locator('.sidebar-item')
  const count = await items.count()
  for (let i = 0; i < count; i++) {
    const text = await items.nth(i).textContent()
    if (text && text.includes(pageName)) {
      await items.nth(i).click()
      await page.waitForTimeout(1500)
      return true
    }
  }
  return false
}

/**
 * 等待侧边栏出现
 */
export async function waitForSidebar(page: Page): Promise<void> {
  await page.waitForSelector('.sidebar', { timeout: 10000 })
}

/**
 * 等待内容区出现卡片或加载状态
 */
export async function waitForContent(page: Page): Promise<void> {
  await page.waitForFunction(() => {
    const cards = document.querySelectorAll('.poster-card, .show-card')
    const skeletons = document.querySelectorAll('.skeleton-card, .skeleton-shimmer')
    const spinners = document.querySelectorAll('.spinner')
    const empties = document.querySelectorAll('.empty-state')
    return cards.length + skeletons.length + spinners.length + empties.length > 0
  }, { timeout: 15000 })
}
