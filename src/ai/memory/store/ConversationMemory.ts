// src/ai/memory/store/ConversationMemory.ts — 对话记忆管理
// 增强 ConversationManager：持久化 + 摘要生成 + token 估计

import { memoryStore } from './MemoryStore'
import { MemoryEntryType } from '../../governance/MemoryRetentionPolicy'

export interface ConversationSummary {
  threadId: string
  title: string
  messageCount: number
  lastMessageAt: number
  keyTopics: string[]
  summary: string
}

export class ConversationMemory {
  /**
   * 存储对话摘要 (不是完整对话)
   * Governance: 禁止 full_prompt_archive
   */
  async saveSummary(threadId: string, summary: ConversationSummary): Promise<string> {
    return memoryStore.store(
      MemoryEntryType.CONVERSATION_SUMMARY,
      JSON.stringify(summary),
      { threadId, messageCount: summary.messageCount },
    )
  }

  /** 查询所有对话摘要 */
  async getSummaries(): Promise<ConversationSummary[]> {
    const entries = memoryStore.query(MemoryEntryType.CONVERSATION_SUMMARY)
    return entries
      .map((e) => {
        try { return JSON.parse(e.content) as ConversationSummary }
        catch { return null }
      })
      .filter(Boolean) as ConversationSummary[]
  }

  /** 估计 token 数量 (粗略: 1 token ≈ 4 chars for Chinese, ≈ 4 chars for English) */
  static estimateTokens(text: string): number {
    // 中文字符 ≈ 1.5 tokens each, 英文 ≈ 0.25 tokens each
    const chineseChars = (text.match(/[一-鿿]/g) ?? []).length
    const otherChars = text.length - chineseChars
    return Math.ceil(chineseChars * 1.5 + otherChars * 0.25)
  }

  /** 检查是否超出上下文窗口 */
  static exceedsContextWindow(text: string, maxTokens: number = 8000): boolean {
    return ConversationMemory.estimateTokens(text) > maxTokens
  }

  /** 截断文本到指定 token 限制 */
  static truncateToTokens(text: string, maxTokens: number): string {
    if (!ConversationMemory.exceedsContextWindow(text, maxTokens)) {
      return text
    }

    // 二分查找合适的截断点
    let lo = 0, hi = text.length
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2)
      if (ConversationMemory.estimateTokens(text.slice(0, mid)) > maxTokens) {
        hi = mid
      } else {
        lo = mid + 1
      }
    }
    return text.slice(0, lo) + '...'
  }
}

export const conversationMemory = new ConversationMemory()
