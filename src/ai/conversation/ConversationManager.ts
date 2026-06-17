// src/ai/conversation/ConversationManager.ts — 对话线程管理

import type { ConversationThread, ConversationMessage } from '../types/ai.types'

export class ConversationManager {
  private threads = new Map<string, ConversationThread>()
  private currentThreadId: string | null = null

  /** 创建新线程 */
  createThread(title?: string): ConversationThread {
    const thread: ConversationThread = {
      id: `conv_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`,
      title: title ?? '新对话',
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }
    this.threads.set(thread.id, thread)
    this.currentThreadId = thread.id
    return thread
  }

  /** 发送消息 */
  sendMessage(threadId: string | null, role: ConversationMessage['role'], content: string): ConversationMessage {
    const tid = threadId ?? this.currentThreadId
    if (!tid) throw new Error('No active conversation thread')

    const thread = this.threads.get(tid)
    if (!thread) throw new Error(`Thread not found: ${tid}`)

    const msg: ConversationMessage = {
      role,
      content,
      timestamp: Date.now(),
    }
    thread.messages.push(msg)
    thread.updatedAt = Date.now()
    return msg
  }

  /** 获取线程历史 */
  getHistory(threadId?: string): ConversationMessage[] {
    const tid = threadId ?? this.currentThreadId
    if (!tid) return []

    const thread = this.threads.get(tid)
    return thread?.messages ?? []
  }

  /** 获取当前线程 */
  getCurrentThread(): ConversationThread | null {
    if (!this.currentThreadId) return null
    return this.threads.get(this.currentThreadId) ?? null
  }

  /** 切换线程 */
  switchThread(threadId: string): void {
    if (!this.threads.has(threadId)) {
      throw new Error(`Thread not found: ${threadId}`)
    }
    this.currentThreadId = threadId
  }

  /** 清空线程 */
  clearThread(threadId?: string): void {
    const tid = threadId ?? this.currentThreadId
    if (!tid) return

    const thread = this.threads.get(tid)
    if (thread) {
      thread.messages = []
      thread.updatedAt = Date.now()
    }
  }

  /** 删除线程 */
  deleteThread(threadId: string): boolean {
    if (this.currentThreadId === threadId) {
      this.currentThreadId = null
    }
    return this.threads.delete(threadId)
  }

  /** 列出所有线程 */
  listThreads(): ConversationThread[] {
    return Array.from(this.threads.values())
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }
}

export const conversationManager = new ConversationManager()
