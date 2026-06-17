// src/platform/cloud/provider/LocalCloudProvider.ts — 本地云服务提供者 (no-op)
// PB5 Auth v2: 默认实现，零网络调用，所有 push/pull 均为 no-op
// 用户配置真实云后端前，CloudSyncManager 处于 Local Only Mode

import type { ICloudProvider, SyncRecord } from '../types/cloud.types'

export class LocalCloudProvider implements ICloudProvider {
  readonly name = 'local'
  readonly configured = false

  async push<T>(_records: SyncRecord<T>[]): Promise<boolean> {
    // Local mode: no push needed
    return true
  }

  async pull<T>(_type: unknown, _since: number): Promise<SyncRecord<T>[]> {
    // Local mode: no remote data
    return []
  }

  async isConnected(): Promise<boolean> {
    return false
  }
}
