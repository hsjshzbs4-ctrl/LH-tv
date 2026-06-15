// electron/services/updater.service.ts - 自动更新服务（v2 静默下载 + 更新日志）
import { autoUpdater, type UpdateInfo, type ProgressInfo } from 'electron-updater'
import type { BrowserWindow } from 'electron'
import { IPCChannel, IPCEvent } from '@shared/ipc/ipc.channels'

const UPDATE_CHECK_INTERVAL = 4 * 60 * 60 * 1000 // 4小时
let updateCheckTimer: ReturnType<typeof setInterval> | null = null
let updateConfigured = false

// ==================== RC3.1: Environment-Driven Update Provider ====================
const UPDATE_SERVER_URL = process.env.UPDATE_SERVER_URL?.trim()
const UPDATE_PROVIDER = (process.env.UPDATE_PROVIDER || 'generic').toLowerCase()
const UPDATE_CHANNEL = process.env.UPDATE_CHANNEL || 'latest'

function configureUpdaterFeed(): void {
  if (updateConfigured) return
  updateConfigured = true

  if (!UPDATE_SERVER_URL) {
    console.log('[更新] UPDATE_SERVER_URL 未设置 — 自动更新已禁用')
    return
  }

  console.log(`[更新] 配置更新源: provider=${UPDATE_PROVIDER}, channel=${UPDATE_CHANNEL}`)

  switch (UPDATE_PROVIDER) {
    case 'github':
      autoUpdater.setFeedURL({
        provider: 'github',
        owner: UPDATE_SERVER_URL.split('/')[0],
        repo: UPDATE_SERVER_URL.split('/')[1],
        token: process.env.GITHUB_TOKEN || undefined
      })
      break
    case 's3':
      autoUpdater.setFeedURL({
        provider: 's3',
        bucket: process.env.S3_BUCKET || '',
        region: process.env.S3_REGION || 'us-east-1',
        path: process.env.S3_PATH || '/'
      })
      break
    case 'generic':
    default:
      autoUpdater.setFeedURL({
        provider: 'generic',
        url: UPDATE_SERVER_URL,
        channel: UPDATE_CHANNEL !== 'latest' ? UPDATE_CHANNEL : undefined
      })
      break
  }
}

export function startAutoUpdate(mainWindow: BrowserWindow): void {
  // RC3.1: Configure update provider from environment
  configureUpdaterFeed()

  // v2: 自动下载（静默，不打扰用户）
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('error', (err: Error) => {
    console.error('[更新] 出错:', err.message)
    send(mainWindow, IPCEvent.UPDATE_ERROR, { message: err.message })
  })

  autoUpdater.on('update-available', (info: UpdateInfo) => {
    console.log('[更新] 新版本可用:', info.version,
      info.releaseName || '', '- 后台下载中...')
    send(mainWindow, IPCEvent.UPDATE_AVAILABLE, {
      version: info.version,
      releaseName: info.releaseName || '',
      releaseNotes: extractReleaseNotes(info),
      releaseDate: info.releaseDate || '',
      // 静默下载中
      downloading: true
    })
  })

  autoUpdater.on('update-not-available', (info: UpdateInfo) => {
    console.log('[更新] 已是最新版本:', info.version || '')
  })

  autoUpdater.on('download-progress', (progress: ProgressInfo) => {
    send(mainWindow, IPCEvent.UPDATE_PROGRESS, {
      percent: progress.percent,
      bytesPerSecond: progress.bytesPerSecond,
      total: progress.total,
      transferred: progress.transferred
    })
  })

  autoUpdater.on('update-downloaded', (info: UpdateInfo) => {
    console.log('[更新] 已下载:', info.version, '- 等待用户确认安装')
    send(mainWindow, IPCEvent.UPDATE_DOWNLOADED, {
      version: info.version,
      releaseName: info.releaseName || '',
      releaseNotes: extractReleaseNotes(info),
      releaseDate: info.releaseDate || '',
      // 提示用户重启安装
      ready: true
    })
  })

  // 启动 5 秒后首次检查
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err: Error) => {
      console.log('[更新] 检查更新失败:', err.message)
    })
  }, 5000)

  // 周期性检查
  updateCheckTimer = setInterval(() => {
    console.log('[更新] 定时检查触发')
    autoUpdater.checkForUpdates().catch((err: Error) => {
      console.log('[更新] 检查更新失败:', err.message)
    })
  }, UPDATE_CHECK_INTERVAL)

  // 注册更新控制 IPC
  const { ipcMain } = require('electron')
  ipcMain.handle(IPCChannel.CHECK_FOR_UPDATE, async () => {
    try {
      const result = await autoUpdater.checkForUpdates()
      return {
        ok: true,
        version: result?.updateInfo.version || null,
        releaseNotes: result ? extractReleaseNotes(result.updateInfo) : []
      }
    } catch (err) {
      return { ok: false, error: (err as Error).message }
    }
  })

  ipcMain.handle(IPCChannel.INSTALL_UPDATE, async () => {
    stopAutoUpdate()
    // RC3.1: Close Puppeteer browsers before update restart
    try {
      const { closeBrowsers } = await import('../ipc/bridge')
      await closeBrowsers()
    } catch (e) { /* ignore */ }
    autoUpdater.quitAndInstall()
  })

  // v2: 推迟更新（稍后提醒）
  ipcMain.handle(IPCChannel.POSTPONE_UPDATE, () => {
    // 1 小时后再次提示
    setTimeout(() => {
      send(mainWindow, IPCEvent.UPDATE_DOWNLOADED, {
        version: autoUpdater.currentVersion?.version || '',
        releaseNotes: [],
        ready: true,
        postponed: true
      })
    }, 60 * 60 * 1000)
  })
}

// ==================== 辅助函数 ====================

function send(win: BrowserWindow | null, channel: string, data: unknown) {
  if (win && !win.isDestroyed()) {
    win.webContents.send(channel, data)
  }
}

/**
 * 从 UpdateInfo 中提取更新日志
 * electron-updater 的 releaseNotes 可能是字符串或数组
 */
function extractReleaseNotes(info: UpdateInfo): string[] {
  const notes = (info as unknown as Record<string, unknown>).releaseNotes
  if (!notes) return []

  if (typeof notes === 'string') {
    // 按换行分割，过滤空行和 markdown 标题符号
    return notes.split('\n')
      .map(l => l.replace(/^#+\s*/, '').trim())
      .filter(l => l.length > 0)
      .slice(0, 10) // 最多显示 10 条
  }

  if (Array.isArray(notes)) {
    return notes
      .map(n => typeof n === 'object' ? (n as { note?: string }).note || '' : String(n))
      .filter(n => n.length > 0)
      .slice(0, 10)
  }

  return []
}

export function stopAutoUpdate(): void {
  if (updateCheckTimer) {
    clearInterval(updateCheckTimer)
    updateCheckTimer = null
  }
}
