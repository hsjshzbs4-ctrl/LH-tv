// mobile/capacitor.config.ts — PB1.5 Android Migration Preparation
// 目标：将 LH-TV Vue 前端迁移到 Capacitor (Android)
// 当前状态：骨架配置，待 PB1.5 发布后执行实际迁移

import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.lhtv.app',
  appName: 'LH-TV',
  webDir: 'out/renderer',

  server: {
    // Android 使用本地文件加载，无需开发服务器
    androidScheme: 'https',
  },

  plugins: {
    // 本地存储（替代 Electron IPC 的 storage service）
    // 使用 Capacitor Preferences API 或 SQLite 插件
  },
}

export default config

// ── Android 迁移检查清单 ──
//
// 1. 移除 Electron 依赖：
//    - UI 层中的 window.app.invoke() 调用 → 替换为 Capacitor Plugin 或 HTTP API
//    - 移除 electron/ 目录和 Electron 相关 npm 依赖
//
// 2. 存储迁移：
//    - src/shared/storage/storage.service.ts → @capacitor/preferences 或 SQLite
//
// 3. IPC 替换：
//    - src/shared/ipc/ 中的 IPC 通道 → Capacitor Plugin 或直接 HTTP 调用
//
// 4. UI 层保持不动：
//    - Vue 3 组件、Pinia stores、路由、composables 保持原样
//    - 仅替换底层数据获取层
//
// 5. 原生功能：
//    - 播放器 → ExoPlayer (Android)
//    - 下载 → Android DownloadManager
//    - 文件系统 → @capacitor/filesystem
//
// 6. 安装命令：
//    npm install @capacitor/core @capacitor/cli @capacitor/android
//    npx cap add android
//    npx cap sync
//    npx cap open android
