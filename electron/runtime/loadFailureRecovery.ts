// electron/runtime/loadFailureRecovery.ts — Page load failure recovery (RC3.1 Blocker #4)
// Handles did-fail-load event with retry logic and recovery UI.

import { BrowserWindow } from 'electron'

interface LoadFailureState {
  errorCode: number
  errorDescription: string
  validatedURL: string
  retryCount: number
}

const MAX_RETRIES = 1
const RETRY_DELAY_MS = 3000
const failures = new WeakMap<BrowserWindow, LoadFailureState>()

/**
 * Attach load-failure recovery to a BrowserWindow.
 * Call after createWindow().
 */
export function attachLoadFailureRecovery(win: BrowserWindow): void {
  win.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    // Ignore abort errors (user cancelled navigation, page refresh, etc.)
    // errorCode -3 = ABORTED
    if (errorCode === -3) return

    console.error(
      `[LoadFailureRecovery] 页面加载失败: code=${errorCode}, ` +
      `desc="${errorDescription}", url=${validatedURL}`
    )

    const state: LoadFailureState = {
      errorCode,
      errorDescription,
      validatedURL,
      retryCount: (failures.get(win)?.retryCount ?? 0) + 1
    }
    failures.set(win, state)

    if (state.retryCount <= MAX_RETRIES) {
      // Auto-retry for transient failures (network errors: errorCode < -100)
      if (errorCode < -100) {
        console.log(
          `[LoadFailureRecovery] 自动重试 (${state.retryCount}/${MAX_RETRIES}) ` +
          `after ${RETRY_DELAY_MS / 1000}s...`
        )
        setTimeout(() => {
          if (win && !win.isDestroyed()) {
            win.webContents.reload()
          }
        }, RETRY_DELAY_MS)
      } else {
        // Non-network error — inject recovery UI
        injectRecoveryUI(win, state)
      }
    } else {
      // Max retries exceeded — show recovery UI
      injectRecoveryUI(win, state)
    }
  })

  // Reset retry count on successful load
  win.webContents.on('did-finish-load', () => {
    failures.delete(win)
  })

  console.log('[LoadFailureRecovery] 页面加载失败恢复已注册')
}

function injectRecoveryUI(win: BrowserWindow, state: LoadFailureState): void {
  const isOffline = state.errorCode === -106 || state.errorCode === -105 // ERR_INTERNET_DISCONNECTED or ERR_NAME_NOT_RESOLVED

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    background: #0a0a0f; color: #e0e0e0;
    display: flex; align-items: center; justify-content: center;
    height: 100vh; text-align: center;
  }
  .container { max-width: 480px; padding: 40px; }
  h1 { font-size: 24px; margin-bottom: 12px; color: #fff; }
  .icon { font-size: 48px; margin-bottom: 20px; }
  .detail { font-size: 13px; color: #888; margin-bottom: 24px; line-height: 1.6; }
  .detail code { background: #1a1a2e; padding: 2px 6px; border-radius: 3px; color: #aaa; }
  button {
    background: #4a6cf7; color: #fff; border: none; padding: 12px 32px;
    border-radius: 6px; font-size: 15px; cursor: pointer; margin: 4px;
  }
  button:hover { background: #5b7df8; }
  button.secondary { background: #2a2a3e; }
  button.secondary:hover { background: #3a3a4e; }
</style>
</head>
<body>
<div class="container">
  <div class="icon">${isOffline ? '🌐' : '⚠️'}</div>
  <h1>${isOffline ? '网络连接断开' : '页面加载失败'}</h1>
  <div class="detail">
    ${isOffline
      ? '请检查网络连接后重试。'
      : `错误: <code>${state.errorDescription}</code> (${state.errorCode})`
    }
    ${state.validatedURL ? `<br>URL: <code>${state.validatedURL}</code>` : ''}
  </div>
  <button onclick="location.reload()">🔄 重试</button>
  <button class="secondary" onclick="window.close()">✕ 关闭</button>
</div>
</body>
</html>`

  win.webContents.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`)
}
