// src/plugin-marketplace/permissions/types.ts — 权限系统类型
// P5.1 Plugin Marketplace Core

/** 权限标识 */
export enum PluginPermission {
  PROVIDER_ACCESS = 'PROVIDER_ACCESS',
  DOWNLOAD_ACCESS = 'DOWNLOAD_ACCESS',
  LIBRARY_ACCESS = 'LIBRARY_ACCESS',
  SETTINGS_ACCESS = 'SETTINGS_ACCESS',
  NETWORK_ACCESS = 'NETWORK_ACCESS',
  STORAGE_ACCESS = 'STORAGE_ACCESS',
  NOTIFICATION_ACCESS = 'NOTIFICATION_ACCESS',
}

/** 权限描述 */
export const PERMISSION_DESCRIPTIONS: Record<PluginPermission, string> = {
  [PluginPermission.PROVIDER_ACCESS]: '访问影视内容提供源',
  [PluginPermission.DOWNLOAD_ACCESS]: '管理下载任务',
  [PluginPermission.LIBRARY_ACCESS]: '访问离线媒体库',
  [PluginPermission.SETTINGS_ACCESS]: '修改应用设置',
  [PluginPermission.NETWORK_ACCESS]: '发起网络请求',
  [PluginPermission.STORAGE_ACCESS]: '读写本地文件',
  [PluginPermission.NOTIFICATION_ACCESS]: '发送系统通知',
}

/** 权限检查结果 */
export interface PermissionCheckResult {
  granted: boolean
  denied: PluginPermission[]
  reason?: string
}
