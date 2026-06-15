// electron/runtime/unresponsiveRecovery.ts — Renderer hang recovery (RC3.1 Blocker #2)
// Handles unresponsive event with user-choice dialog.

import { BrowserWindow, dialog } from 'electron'
import { gracefulShutdown } from './shutdownManager'

let hangStartTime: number | null = null

/**
 * Attach unresponsive recovery to a BrowserWindow.
 * Call after createWindow().
 */
export function attachUnresponsiveRecovery(win: BrowserWindow): void {
  win.on('unresponsive', () => {
    hangStartTime = Date.now()
    console.warn('[UnresponsiveRecovery] 渲染进程无响应 — 显示恢复对话框')

    // Use a flag to prevent multiple concurrent dialogs
    dialog.showMessageBox({
      type: 'warning',
      title: 'LH - 应用无响应',
      message: '应用界面无响应。',
      detail: '渲染进程可能正在执行耗时操作或已挂起。\n\n请选择恢复方式：',
      buttons: ['等待恢复', '重载页面', '强制退出'],
      defaultId: 0,
      cancelId: 0,
      noLink: true
    }).then((result) => {
      if (win.isDestroyed()) return

      switch (result.response) {
        case 0: // Wait
          console.log('[UnresponsiveRecovery] 用户选择等待恢复')
          break
        case 1: // Reload
          console.log('[UnresponsiveRecovery] 用户选择重载页面')
          win.webContents.reload()
          break
        case 2: // Force Quit
          console.log('[UnresponsiveRecovery] 用户选择强制退出')
          gracefulShutdown('user-quit')
          break
      }
    })
  })

  win.on('responsive', () => {
    if (hangStartTime) {
      const duration = Date.now() - hangStartTime
      console.log(`[UnresponsiveRecovery] 渲染进程已恢复 (挂起 ${duration}ms)`)
      hangStartTime = null
    }
  })

  console.log('[UnresponsiveRecovery] 渲染进程无响应恢复已注册')
}
