// src/plugin-marketplace/storage/types.ts — 本地存储类型定义
// P5.1 Plugin Marketplace Core

/** 已安装插件本地元数据 */
export interface InstalledPluginMeta {
  id: string
  name: string
  version: string
  /** 安装时间 */
  installedAt: number
  /** 最后更新时间 */
  updatedAt: number
  /** 启用状态 */
  enabled: boolean
  /** 授予的权限 */
  grantedPermissions: string[]
  /** 安装路径 */
  installPath: string
  /** 更新历史 */
  updateHistory: UpdateRecord[]
}

/** 更新记录 */
export interface UpdateRecord {
  fromVersion: string
  toVersion: string
  updatedAt: number
  success: boolean
  error?: string
}

/** 已安装插件状态 */
export enum PluginState {
  INSTALLED = 'installed',
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  STARTING = 'starting',
  RUNNING = 'running',
  STOPPING = 'stopping',
  FAILED = 'failed',
}
