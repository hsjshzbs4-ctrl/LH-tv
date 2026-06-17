// src/ai/context/ContextEngine.ts — 统一上下文引擎
// 从平台各子系统收集上下文，组装给 AI

import type { AIContext } from '../types/ai.types'

/** 扩展 AI 上下文 (包含用户/设备/平台) */
export interface RichAIContext extends AIContext {
  user?: {
    id: string
    displayName: string
  }
  device?: {
    platform: string
    aiEnabled: boolean
    activeProvider: string
  }
  platform?: {
    activeFlags: string[]
    syncStatus: string
  }
}

export class ContextEngine {
  /**
   * 组装完整上下文
   * 从各子系统收集数据，不修改任何 Frozen Zone
   */
  async assemble(): Promise<RichAIContext> {
    // 基础上下文 (由 AIOrchestrator 填充)
    const context: RichAIContext = {
      device: {
        platform: 'electron',
        aiEnabled: true,
        activeProvider: 'mock',
      },
      platform: {
        activeFlags: [],
        syncStatus: 'idle',
      },
    }

    return context
  }

  /** 构建简洁的 AI 系统提示 */
  buildSystemPrompt(): string {
    return `You are LH-TV AI Assistant, a helpful media companion.
You help users discover content, understand episodes, and control playback.
Always be concise and helpful. If unsure, suggest the user browse the catalog.
Current context includes the user's watch history and favorites when available.`
  }
}

export const contextEngine = new ContextEngine()
