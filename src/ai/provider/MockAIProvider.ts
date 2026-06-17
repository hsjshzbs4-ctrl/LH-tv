// src/ai/provider/MockAIProvider.ts — Mock AI Provider
// PB5 Auth v2: 默认实现，返回预设响应，不接入真实模型

import { AICapability, type IAIProvider, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'

export class MockAIProvider implements IAIProvider {
  readonly name = 'mock'
  readonly capabilities = [
    AICapability.ASK,
    AICapability.SUMMARIZE,
    AICapability.SUGGEST,
    AICapability.ASSIST,
  ]

  private available = false

  async initialize(_config: AIModelConfig): Promise<void> {
    this.available = true
  }

  async complete(prompt: string, context?: AIContext): Promise<AIResponse> {
    const mediaTitle = context?.currentMedia?.title ?? '未知剧集'

    // 检测提示意图
    if (prompt.includes('总结') || prompt.includes('概括')) {
      return {
        text: `[Mock AI] ${mediaTitle} 是一部精彩的影视作品。此功能将在 PB6 接入真实 AI 模型后提供完整摘要。`,
        confidence: 0.5,
        capability: AICapability.SUMMARIZE,
      }
    }

    if (prompt.includes('推荐') || prompt.includes('建议')) {
      return {
        text: `[Mock AI] 基于您的观看历史，推荐一些相似内容。完整推荐功能将在 PB6 开放。`,
        confidence: 0.5,
        capability: AICapability.SUGGEST,
      }
    }

    return {
      text: `[Mock AI] 您好！AI 助手目前处于预览模式。关于 "${prompt.substring(0, 50)}" 的完整回答将在 PB6 接入真实模型后提供。`,
      confidence: 0.5,
      capability: AICapability.ASK,
    }
  }

  isAvailable(): boolean {
    return this.available
  }

  async dispose(): Promise<void> {
    this.available = false
  }
}
