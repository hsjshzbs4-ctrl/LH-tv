// src/ai/orchestrator/AIOrchestrator.ts — AI 编排器
// PB6: 通过 ModelGateway 路由，不再硬编码 createProvider()

import { AICapability, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'
import { promptManager } from '../prompt/PromptManager'
import { conversationManager } from '../conversation/ConversationManager'
import { modelGateway } from '../provider/ModelGateway'
import { MockAIProvider } from '../provider/MockAIProvider'
import { featureFlagManager } from '@platform/flags'

export class AIOrchestrator {
  private initialized = false
  private activeProvider: string = 'mock'

  /** 初始化 — 注册 Provider 到 ModelGateway */
  async initialize(config?: AIModelConfig): Promise<void> {
    if (!featureFlagManager.isEnabled('pb5.ai')) return
    if (this.initialized) return

    const providerConfig = config ?? { provider: 'mock' }

    // 注册 Mock Provider (安全回退)
    modelGateway.register('mock', new MockAIProvider())
    await modelGateway.initializeProvider('mock', { provider: 'mock' })

    // 如果配置了真实 Provider，注册并初始化
    if (providerConfig.provider !== 'mock') {
      // Provider 由 ModelGateway.register() 外部注册 (通过 UI Settings)
      // 这里只设置活跃 Provider
      this.activeProvider = providerConfig.provider
    }

    this.initialized = true
  }

  /** 设置活跃 Provider */
  setActiveProvider(providerName: string): void {
    if (modelGateway.getProvider(providerName)) {
      this.activeProvider = providerName
    } else {
      throw new Error(`Provider "${providerName}" not registered in ModelGateway`)
    }
  }

  /** 提问 — 通过 ModelGateway */
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

    const result = await modelGateway.complete({
      prompt,
      context,
      providerName: this.activeProvider,
      config: { provider: this.activeProvider as AIModelConfig['provider'] },
      caller: 'AIOrchestrator',
    })

    conversationManager.sendMessage(null, 'assistant', result.response.text)
    return result.response
  }

  /** 总结剧集 */
  async summarize(mediaTitle: string, year?: number, genre?: string[]): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('summary', {
      title: mediaTitle,
      year: String(year ?? ''),
      genre: genre?.join(', ') ?? '',
    })

    const result = await modelGateway.complete({
      prompt,
      context: { currentMedia: { title: mediaTitle, year, genre } },
      providerName: this.activeProvider,
      config: { provider: this.activeProvider as AIModelConfig['provider'] },
      caller: 'AIOrchestrator',
    })

    return result.response
  }

  /** 推荐 */
  async suggest(limit: number = 5): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('suggestions', {
      preferences: '基于历史数据',
    })

    const result = await modelGateway.complete({
      prompt,
      providerName: this.activeProvider,
      config: { provider: this.activeProvider as AIModelConfig['provider'] },
      caller: 'AIOrchestrator',
    })

    return result.response
  }

  /** 播放辅助 */
  async assist(command: string): Promise<AIResponse> {
    this.ensureInitialized()

    const prompt = promptManager.render('playback-assistant', {
      command,
      playerState: 'playing',
    })

    const result = await modelGateway.complete({
      prompt,
      providerName: this.activeProvider,
      config: { provider: this.activeProvider as AIModelConfig['provider'] },
      caller: 'AIOrchestrator',
    })

    return result.response
  }

  /** 是否可用 */
  isAvailable(): boolean {
    return this.initialized
  }

  /** 获取活跃 Provider 名 */
  getActiveProvider(): string {
    return this.activeProvider
  }

  /** 销毁 */
  async dispose(): Promise<void> {
    await modelGateway.disposeAll()
    this.initialized = false
  }

  // ── 内部 ──

  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new Error('AI Orchestrator not initialized. Ensure pb5.ai flag is enabled.')
    }
  }
}

export const aiOrchestrator = new AIOrchestrator()
