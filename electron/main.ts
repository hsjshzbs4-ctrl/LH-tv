// electron/main.ts - Electron 主进程（模块化架构）
// 复用 LH-YS 项目 shared/ 业务逻辑，TS 封装层
import { app, BrowserWindow, ipcMain, Menu, shell } from 'electron'
import { join } from 'path'
import { IPCChannel, IPCEvent } from '@shared/ipc/ipc.channels'
import { WIN, ALLOWED_HOSTS, FALLBACK_SOURCES } from './utils/config'
import { createLogger } from './utils/logger'
import { encrypt, decrypt } from './utils/secrets'
import { startAutoUpdate, stopAutoUpdate } from './services/updater.service'
import {
  getSearchIpc,
  getAnimeIpc,
  getDownloadIpc,
  getCatalogIpc,
  getPosterIpc,
  closeBrowsers,
  refreshAllPosters,
  forceRefreshAllPosters,
  setPosterNotifyWindow
} from './ipc/bridge'
import {
  loadUserData,
  saveUserData,
  exportUserData,
  importUserData,
  getStorageStats
} from './services/storage.service'

// 桥接旧项目 shared/ 中的 IPC 注册模块（运行时 require）

const log = createLogger('Main')

let mainWindow: BrowserWindow | null = null

// ==================== 全局异常捕获 ====================
process.on('uncaughtException', (err: NodeJS.ErrnoException) => {
  log.error('未捕获异常', err)

  const isNonFatal =
    (err.code === 'ENOENT' || err.code === 'EACCES' || err.code === 'EPERM') ||
    (err.message && err.message.includes('asar')) ||
    (err.message && err.message.includes('poster')) ||
    (err.message && err.message.includes('downloads'))

  if (isNonFatal) {
    console.error('[WARN] 非致命异常，继续运行:', err.message)
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send(IPCEvent.APP_ERROR, { message: err.message, nonFatal: true })
    }
    return
  }

  console.error('[FATAL] 未捕获异常，进程即将退出:', err.stack || err.message)
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send(IPCEvent.APP_ERROR, { message: err.message, fatal: true })
  }
  setTimeout(() => process.exit(1), 1000)
})

process.on('unhandledRejection', (reason) => {
  log.error('未处理Promise拒绝', reason instanceof Error ? reason : { message: String(reason) })
})

// ==================== 窗口创建 ====================
function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: WIN.width,
    height: WIN.height,
    minWidth: WIN.minWidth,
    minHeight: WIN.minHeight,
    title: WIN.title,
    icon: join(__dirname, '../../resources/icon.png'),
    frame: false,
    backgroundColor: WIN.backgroundColor,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true,
      webSecurity: false,
      preload: join(__dirname, '../preload/index.js')
    }
  })

  // CSP 安全头
  mainWindow.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    callback({
      responseHeaders: {
        ...details.responseHeaders,
        'Content-Security-Policy': [
          "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: file:; " +
          "img-src 'self' https: file: data:; " +
          "media-src 'self' https: blob:;"
        ]
      }
    })
  })

  // 开发模式加载 dev server，生产模式加载打包文件
  if (process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ==================== 注册全部 IPC ====================
function registerIpc(): void {
  // ---- 基础 IPC ----
  ipcMain.handle(IPCChannel.SECRETS_ENCRYPT, (_event, text: string) => encrypt(text))
  ipcMain.handle(IPCChannel.SECRETS_DECRYPT, (_event, encoded: string) => decrypt(encoded))

  // 窗口控制
  ipcMain.handle(IPCChannel.WIN_MINIMIZE, () => { mainWindow?.minimize() })
  ipcMain.handle(IPCChannel.WIN_MAXIMIZE, () => {
    if (!mainWindow) return false
    if (mainWindow.isMaximized()) { mainWindow.unmaximize(); return false }
    else { mainWindow.maximize(); return true }
  })
  ipcMain.handle(IPCChannel.WIN_CLOSE, () => { mainWindow?.close() })
  ipcMain.handle(IPCChannel.WIN_IS_MAXIMIZED, () => mainWindow?.isMaximized() ?? false)

  // 外部链接
  ipcMain.handle(IPCChannel.OPEN_EXTERNAL, (_event, url: string) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url)
  })

  // 应用配置
  ipcMain.handle(IPCChannel.GET_APP_CONFIG, () => ({
    ALLOWED_HOSTS,
    FALLBACK_SOURCES,
    WIN,
    APP_VERSION: app.getVersion()
  }))

  // ---- 请求队列状态 ----
  ipcMain.handle(IPCChannel.QUEUE_STATS, () => {
    try {
      const queue = require(join(__dirname, '../shared-legacy/request-queue.js'))
      return queue.getStats()
    } catch { return { activeCount: 0, pendingCount: 0 } }
  })

  // ---- 海报全量刷新（使用 Puppeteer 搜索最新海报）----
  ipcMain.handle(IPCChannel.REFRESH_ALL_POSTERS, async () => {
    return refreshAllPosters()
  })

  // ---- 海报强制全量刷新（清除旧缓存，从豆瓣等官方源重新抓取）----
  ipcMain.handle(IPCChannel.FORCE_REFRESH_ALL_POSTERS, async () => {
    return forceRefreshAllPosters()
  })

  // ---- 文件存储（替代 localStorage）----
  ipcMain.handle(IPCChannel.STORAGE_LOAD, () => loadUserData())
  ipcMain.handle(IPCChannel.STORAGE_SAVE, (_event, data) => saveUserData(data))
  ipcMain.handle(IPCChannel.STORAGE_EXPORT, () => exportUserData())
  ipcMain.handle(IPCChannel.STORAGE_IMPORT, (_event, json: string) => importUserData(json))
  ipcMain.handle(IPCChannel.STORAGE_STATS, () => getStorageStats())

  // ---- 业务 IPC（运行时加载旧项目 shared/ 模块）----
  getSearchIpc().registerSearchIpc(ipcMain)
  getAnimeIpc().registerAnimeIpc(ipcMain)
  getDownloadIpc().registerDownloadIpc(ipcMain)
  getCatalogIpc().registerCatalogIpc(ipcMain)
  getPosterIpc().registerPosterIpc(ipcMain)

  // 设置下载模块的主窗口引用
  getDownloadIpc().setMainWindow(mainWindow)
}

// ==================== 单实例锁 ====================
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })
}

// ==================== 生命周期 ====================
Menu.setApplicationMenu(null)

app.whenReady().then(() => {
  registerIpc()
  createWindow()
  startAutoUpdate(mainWindow!)

  // 主进程准备好后通知渲染进程，并自动后台抓取缺失海报
  if (mainWindow) {
    mainWindow.webContents.on('did-finish-load', () => {
      mainWindow?.webContents.send(IPCEvent.MAIN_READY)

      // 启动后延迟2秒，自动后台抓取缺失海报（不阻塞UI）
      setTimeout(async () => {
        try {
          log.info('启动自动海报抓取...')
          const result = await refreshAllPosters(mainWindow)
          if (result.toRefresh > 0) {
            log.info('自动海报抓取已启动: ' + result.toRefresh + '/' + result.total + ' 部')
          } else {
            log.info('海报缓存完整，无需抓取')
          }
        } catch (e) {
          log.warn('自动海报抓取失败: ' + (e as Error).message)
        }
      }, 2000)
    })
  }
})

app.on('window-all-closed', async () => {
  stopAutoUpdate()
  await closeBrowsers()
  app.quit()
})

app.on('activate', () => {
  if (mainWindow === null) createWindow()
})
