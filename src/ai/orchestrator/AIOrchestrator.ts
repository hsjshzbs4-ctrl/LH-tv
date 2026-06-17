// src/ai/orchestrator/AIOrchestrator.ts — AI 编排器
// PB5 Auth v2: MockProvider only, 禁止真实模型

import { AICapability, type IAIProvider, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'
import { promptManager } from '../prompt/PromptManager'
import { conversationManager } from '../conversation/ConversationManager'
import { MockAIProvider } from '../provider/MockAIProvider'
import { featureFlagManager, FeatureState } from '@platform/flags'

export class AIOrchestrator {
  private provider: IAIProvider | null = null
  private initialized = false

  /** 初始化 (由应用启动调用) */
  async initialize(config?: AIModelConfig): Promise<void> {
    if (!featureFlagManager.isEnabled('pb5.ai')) return
    if (this.initialized) return

    const providerConfig = config ?? { provider: 'mock' }
    this.provider = this.createProvider(providerConfig.provider)
    await this.provider.initialize(providerConfig)

    this.initialized = true
  }

  /** 提问 */
  async ask(query: string, context?: AIContext): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('episode-query', {
      title: context?.currentMedia?.title ?? '未知',
      episode: context?.currentMedia?.episode ?? '未知',
      genre: context?.currentMedia?.genre?.join(', ') ?? '未知',
      query,
    })

    // 确保有活跃的对话线程
    if (!conversationManager.getCurrentThread()) {
      conversationManager.createThread('AI 对话')
    }
    conversationManager.sendMessage(null, 'user', query)
    const response = await this.provider!.complete(prompt, context)
    conversationManager.sendMessage(null, 'assistant', response.text)

    return response
  }

  /** 总结剧集 */
  async summarize(mediaTitle: string, year?: number, genre?: string[]): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('summary', {
      title: mediaTitle,
      year: String(year ?? ''),
      genre: genre?.join(', ') ?? '',
    })

    return this.provider!.complete(prompt, {
      currentMedia: { title: mediaTitle, year, genre },
    })
  }

  /** 推荐 */
  async suggest(limit: number = 5): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('suggestions', {
      preferences: '基于历史数据',
    })

    return this.provider!.complete(prompt)
  }

  /** 播放辅助 */
  async assist(command: string): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('playback-assistant', {
      command,
      playerState: 'playing',
    })

    return this.provider!.complete(prompt)
  }

  /** 是否可用 */
  isAvailable(): boolean {
    return this.initialized && this.provider?.isAvailable() === true
  }

  /** 销毁 */
  async dispose(): Promise<void> {
    if (this.provider) {
      await this.provider.dispose()
    }
    this.initialized = false
    this.provider = null
  }

  // ── 内部 ──

  private createProvider(type: string): IAIProvider {
    switch (type) {
      case 'mock':
      default:
        return new MockAIProvider()
    }
  }

  private ensureInitialized(): void {
    if (!this.initialized || !this.provider) {
      throw new Error('AI Orchestrator not initialized. Ensure pb5.ai flag is enabled.')
    }
  }
}

export const aiOrchestrator = new AIOrchestrator()
