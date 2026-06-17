// src/platform/cloud/manager/ConflictResolver.ts — 冲突解决器
// 支持 4 种策略: LAST_WRITE_WINS / MERGE / KEEP_LOCAL / KEEP_REMOTE

import { ConflictStrategy, type SyncConflict, type SyncRecord } from '../types/cloud.types'

export class ConflictResolver {
  /**
   * 解决冲突
   * 返回最终应采用的记录
   */
  resolve<T>(conflict: SyncConflict<T>, strategy: ConflictStrategy): SyncRecord<T> {
    switch (strategy) {
      case ConflictStrategy.LAST_WRITE_WINS:
        return this.lastWriteWins(conflict)
      case ConflictStrategy.MERGE:
        return this.merge(conflict)
      case ConflictStrategy.KEEP_LOCAL:
        return conflict.local
      case ConflictStrategy.KEEP_REMOTE:
        return conflict.remote
      default:
        return conflict.local
    }
  }

  /** 最后写入胜: 比较 updatedAt */
  private lastWriteWins<T>(conflict: SyncConflict<T>): SyncRecord<T> {
    return conflict.local.updatedAt >= conflict.remote.updatedAt
      ? conflict.local
      : conflict.remote
  }

  /** 合并策略: local 为基础, remote 覆盖 (arrays union) */
  private merge<T>(conflict: SyncConflict<T>): SyncRecord<T> {
    const localData = conflict.local.data
    const remoteData = conflict.remote.data

    // 对数组类型做并集合并 (如 favorites)
    if (Array.isArray(localData) && Array.isArray(remoteData)) {
      const merged = this.mergeArrays(localData, remoteData)
      return {
        ...conflict.local,
        data: merged as T,
        updatedAt: Math.max(conflict.local.updatedAt, conflict.remote.updatedAt),
        version: conflict.local.version + 1,
      }
    }

    // 对对象类型做浅合并 (如 settings)
    if (typeof localData === 'object' && typeof remoteData === 'object'
        && localData !== null && remoteData !== null
        && !Array.isArray(localData) && !Array.isArray(remoteData)) {
      return {
        ...conflict.local,
        data: { ...localData, ...remoteData } as T,
        updatedAt: Math.max(conflict.local.updatedAt, conflict.remote.updatedAt),
        version: conflict.local.version + 1,
      }
    }

    // 默认: local wins
    return conflict.local
  }

  /** 数组并集 (基于 id 去重) */
  private mergeArrays<T>(local: T[], remote: T[]): T[] {
    const seen = new Set<string>()
    const result: T[] = []

    for (const item of remote) {
      const id = (item as Record<string, unknown>).id as string | undefined
      if (id) {
        seen.add(id)
        result.push(item)
      }
    }

    for (const item of local) {
      const id = (item as Record<string, unknown>).id as string | undefined
      if (id && !seen.has(id)) {
        seen.add(id)
        result.push(item)
      }
    }

    return result
  }
}
