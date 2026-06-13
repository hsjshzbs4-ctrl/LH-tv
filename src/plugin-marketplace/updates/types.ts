// src/plugin-marketplace/updates/types.ts — 更新系统类型
// P5.1 Plugin Marketplace Core

import type { PluginVersion } from '../repository/types'

/** 更新检查结果 */
export interface UpdateCheckResult {
  hasUpdate: boolean
  currentVersion: string
  latestVersion: string
  versions: PluginVersion[]
}

/** 更新状态 */
export enum UpdateStatus {
  CHECKING = 'checking',
  DOWNLOADING = 'downloading',
  VALIDATING = 'validating',
  BACKING_UP = 'backing_up',
  INSTALLING = 'installing',
  MIGRATING = 'migrating',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ROLLING_BACK = 'rolling_back',
}

/** 迁移任务 */
export interface MigrationTask {
  pluginId: string
  fromVersion: string
  toVersion: string
  /** 迁移函数列表 (按序执行) */
  migrations: MigrationStep[]
}

export interface MigrationStep {
  version: string
  description: string
  up: () => Promise<void>
  down: () => Promise<void>
}
