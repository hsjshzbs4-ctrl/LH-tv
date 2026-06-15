// electron/runtime/rendererRecovery.ts — Renderer crash recovery (RC3.1 Blocker #1)
// Handles render-process-gone event with crash loop detection.

import { BrowserWindow, dialog } from 'electron'
import { gracefulShutdown } from './shutdownManager'

interface CrashRecord {
  timestamp: number
  reason: string
  exitCode: number
}

const CRASH_RESET_WINDOW_MS = 30_000 // Reset crash counter after 30s of stability
const MAX_CRASHES = 3
const crashes: CrashRecord[] = []

function pruneOldCrashes(): void {
  const now = Date.now()
  while (crashes.length > 0 && now - crashes[0].timestamp > CRASH_RESET_WINDOW_MS) {
    crashes.shift()
  }
}

/**
 * Attach renderer crash recovery to a BrowserWindow.
 * Call after createWindow().
 */
export function attachRendererRecovery(win: BrowserWindow): void {
  win.webContents.on('render-process-gone', (_event, details) => {
    const reason = details.reason
    const exitCode = details.exitCode

    console.error(
      `[RendererRecovery] 渲染进程崩溃: reason=${reason}, exitCode=${exitCode}`
    )

    // Record crash
    crashes.push({ timestamp: Date.now(), reason, exitCode })
    pruneOldCrashes()

    const crashCount = crashes.length
    console.log(`[RendererRecovery] 崩溃计数: ${crashCount}/${MAX_CRASHES} (${CRASH_RESET_WINDOW_MS / 1000}s 窗口)`)

    if (crashCount < MAX_CRASHES) {
      // Auto-reload — may be a transient issue
      console.log('[RendererRecovery] 自动重载渲染进程...')
      setTimeout(() => {
        if (win && !win.isDestroyed()) {
          win.webContents.reload()
        }
      }, 1000)
    } else {
      // Crash loop detected — show dialog and quit
      console.error('[RendererRecovery] 检测到崩溃循环 — 显示恢复对话框')
      dialog.showMessageBox({
        type: 'error',
        title: 'LH - 应用崩溃',
        message: '应用渲染进程多次崩溃，无法自动恢复。',
        detail: `崩溃原因: ${reason}\n退出代码: ${exitCode}\n\n建议重启应用。如果问题持续存在，请联系支持。`,
        buttons: ['重启应用', '退出']
      }).then((result) => {
        if (result.response === 0) {
          // Restart: reload instead of quit
          if (win && !win.isDestroyed()) {
            crashes.length = 0 // Reset counter for fresh start
            win.webContents.reload()
          }
        } else {
          gracefulShutdown('fatal-error')
        }
      })
    }
  })

  console.log('[RendererRecovery] 渲染进程崩溃恢复已注册')
}
