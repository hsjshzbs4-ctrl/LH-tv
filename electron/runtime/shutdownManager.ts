// electron/runtime/shutdownManager.ts — Graceful shutdown manager (RC3.1 Blocker #3)
// Replaces process.exit(1) with ordered cleanup sequence.
// Only handles paths that can leak child processes (per PROCESS_EXIT_AUDIT.md).

import { app } from 'electron'
import { closeBrowsers } from '../ipc/bridge'
import { stopAutoUpdate } from '../services/updater.service'

type ShutdownReason = 'fatal-error' | 'user-quit' | 'updater-restart'

let isShuttingDown = false

/**
 * Graceful shutdown sequence.
 * Closes Puppeteer browsers, stops auto-update, then quits.
 * Only called from paths classified in PROCESS_EXIT_AUDIT.md.
 */
export async function gracefulShutdown(reason: ShutdownReason): Promise<void> {
  if (isShuttingDown) return
  isShuttingDown = true

  console.log(`[Shutdown] 开始优雅关闭 (reason: ${reason})`)

  // 1. Close Puppeteer browsers (poster-fetcher, video-scraper)
  try {
    await closeBrowsers()
    console.log('[Shutdown] Puppeteer 浏览器已关闭')
  } catch (err) {
    console.error('[Shutdown] 关闭浏览器失败:', (err as Error).message)
  }

  // 2. Stop auto-update polling
  try {
    stopAutoUpdate()
    console.log('[Shutdown] 自动更新已停止')
  } catch (err) {
    console.error('[Shutdown] 停止更新失败:', (err as Error).message)
  }

  // 3. Quit
  if (reason === 'updater-restart') {
    // quitAndInstall is called separately by updater — just ensure cleanup ran
    console.log('[Shutdown] 更新重启 — 清理完成')
  } else {
    console.log('[Shutdown] 退出应用')
    app.quit()
  }
}

/**
 * Register lifecycle hooks for shutdown on normal quit paths.
 * Call once during app startup, before createWindow().
 */
export function registerShutdownHooks(): void {
  // before-quit: fires before window-all-closed, covers macOS Cmd+Q
  app.on('before-quit', async (event) => {
    if (isShuttingDown) return
    // Prevent default quit until cleanup completes
    event.preventDefault()
    await gracefulShutdown('user-quit')
  })

  // will-quit: last-chance cleanup (fire-and-forget — cannot prevent)
  app.on('will-quit', () => {
    console.log('[Shutdown] 应用即将退出 — 最终清理')
  })
}
