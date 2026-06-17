// src/ai/memory/store/SessionMemory.ts — 会话记忆 (当前观看、上下文)

import { memoryStore } from './MemoryStore'
import { MemoryEntryType } from '../../governance/MemoryRetentionPolicy'

export interface SessionSnapshot {
  currentMedia?: { title: string; episode?: string; provider?: string }
  lastQuery?: string
  lastResponse?: string
  toolCalls: Array<{ tool: string; result: string; timestamp: number }>
}

export class SessionMemory {
  /**
   * 存储工具调用结果快照 (允许 ✅)
   */
  async saveToolResult(toolName: string, result: string): Promise<string> {
    return memoryStore.store(
      MemoryEntryType.TOOL_RESULT_SNAPSHOT,
      JSON.stringify({ toolName, result, timestamp: Date.now() }),
      { toolName },
    )
  }

  /** 获取当前会话的快照 */
  async getSnapshot(): Promise<SessionSnapshot> {
    const results = memoryStore.query(MemoryEntryType.TOOL_RESULT_SNAPSHOT)
    const prefs = memoryStore.query(MemoryEntryType.USER_PREFERENCE)

    return {
      toolCalls: results.slice(0, 10).map((e) => {
        try {
          const parsed = JSON.parse(e.content)
          return { tool: parsed.toolName, result: parsed.result, timestamp: e.createdAt }
        } catch {
          return { tool: 'unknown', result: '', timestamp: e.createdAt }
        }
      }),
    }
  }
}

export const sessionMemory = new SessionMemory()
