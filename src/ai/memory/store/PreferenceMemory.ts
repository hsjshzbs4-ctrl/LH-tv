// src/ai/memory/store/PreferenceMemory.ts — 偏好记忆
// 从对话中提取用户偏好，永久保存 (用户可删除)

import { memoryStore } from './MemoryStore'
import { MemoryEntryType } from '../../governance/MemoryRetentionPolicy'

export interface UserPreference {
  key: string
  value: string
  confidence: number // 0~1
  extractedAt: number
  source: 'conversation' | 'behavior' | 'explicit'
}

export class PreferenceMemory {
  /**
   * 存储用户偏好 (允许 ✅，永久保存)
   */
  async savePreference(pref: UserPreference): Promise<string> {
    return memoryStore.store(
      MemoryEntryType.USER_PREFERENCE,
      JSON.stringify(pref),
      { preferenceKey: pref.key, confidence: pref.confidence },
    )
  }

  /** 获取所有用户偏好 */
  async getPreferences(): Promise<UserPreference[]> {
    const entries = memoryStore.query(MemoryEntryType.USER_PREFERENCE)
    return entries
      .map((e) => {
        try { return JSON.parse(e.content) as UserPreference }
        catch { return null }
      })
      .filter(Boolean) as UserPreference[]
  }

  /** 获取特定 key 的偏好 */
  async getPreference(key: string): Promise<UserPreference | null> {
    const prefs = await this.getPreferences()
    return prefs.find((p) => p.key === key) ?? null
  }

  /** 删除特定偏好 */
  async deletePreference(key: string): Promise<boolean> {
    const entries = memoryStore.query(MemoryEntryType.USER_PREFERENCE)
    const entry = entries.find((e) => {
      try {
        return (JSON.parse(e.content) as UserPreference).key === key
      } catch { return false }
    })
    if (entry) return memoryStore.delete(entry.id)
    return false
  }
}

export const preferenceMemory = new PreferenceMemory()
