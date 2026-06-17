// src/ai/orchestrator/AIOrchestrator.ts — AI 编排器
// PB6: 通过 ModelGateway 路由 + ContextEngine 上下文组装 + ToolRegistry 工具调用

import { AICapability, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'
import { promptManager } from '../prompt/PromptManager'
import { conversationManager } from '../conversation/ConversationManager'
import { modelGateway } from '../provider/ModelGateway'
import { MockAIProvider } from '../provider/MockAIProvider'
import { OpenAIProvider } from '../provider/OpenAIProvider'
import { AnthropicProvider } from '../provider/AnthropicProvider'
import { OllamaProvider } from '../provider/OllamaProvider'
import { contextEngine } from '../context/ContextEngine'
import { toolRegistry } from '../tools/registry/ToolRegistry'
import { invocationPipeline } from '../tools/pipeline/InvocationPipeline'
import { SearchTool } from '../tools/tools/SearchTool'
import { PlaybackInfoTool, PlaybackControlTool } from '../tools/tools/PlaybackTool'
import { memoryStore } from '../memory/store/MemoryStore'
import { featureFlagManager } from '@platform/flags'
import { storageService } from '@/shared/storage/storage.service'

export class AIOrchestrator {
  private initialized = false
  private activeProvider: string = 'mock'

  /** 初始化 — 注册 Provider + Tools + Memory */
  async initialize(config?: AIModelConfig): Promise<void> {
    if (!featureFlagManager.isEnabled('pb5.ai')) return
    if (this.initialized) return

    const providerConfig = config ?? { provider: 'mock' }

    // 0. 从持久化加载 AI 配置
    let savedConfig: Record<string, unknown> | null = null
    try {
      const settings = await storageService.getSettings()
      const raw = settings.pb6_ai_config
      if (raw && typeof raw === 'string') {
        savedConfig = JSON.parse(raw)
        if (savedConfig?.provider && savedConfig.provider !== providerConfig.provider) {
          providerConfig.provider = savedConfig.provider as AIModelConfig['provider']
          if (savedConfig.apiKey) providerConfig.apiKey = savedConfig.apiKey as string
          if (savedConfig.model) providerConfig.model = savedConfig.model as string
          if (savedConfig.temperature) providerConfig.temperature = savedConfig.temperature as number
          if (savedConfig.maxTokens) providerConfig.maxTokens = savedConfig.maxTokens as number
        }
      }
    } catch { /* no saved config */ }

    // 1. 初始化 MemoryStore
    await memoryStore.initialize()

    // 2. 注册 Providers 到 ModelGateway
    modelGateway.register('mock', new MockAIProvider())
    await modelGateway.initializeProvider('mock', { provider: 'mock' })

    // 注册真实 Provider
    modelGateway.register('openai', new OpenAIProvider())
    modelGateway.register('anthropic', new AnthropicProvider())
    modelGateway.register('ollama', new OllamaProvider())

    // 初始化已配置的 Provider
    if (providerConfig.provider !== 'mock' && providerConfig.apiKey) {
      try {
        await modelGateway.initializeProvider(providerConfig.provider, providerConfig)
        this.activeProvider = providerConfig.provider
      } catch { /* provider unavailable, stay with mock */ }
    }

    // 3. 注册 Tools 到 ToolRegistry
    try { toolRegistry.register(new SearchTool()) } catch { /* may already be registered */ }
    try { toolRegistry.register(new PlaybackInfoTool()) } catch { /* ok */ }
    try { toolRegistry.register(new PlaybackControlTool()) } catch { /* ok */ }

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

  /** 提问 — 通过 ModelGateway (含 ContextEngine 上下文丰富) */
  async ask(query: string, context?: AIContext): Promise<AIResponse> {
    this.ensureInitialized()

    // 从 ContextEngine 获取丰富上下文
    const richContext = await contextEngine.assemble()

    const mergedContext: AIContext = {
      ...context,
      currentMedia: context?.currentMedia ?? richContext.currentMedia,
      preferences: richContext.platform as Record<string, unknown>,
    }

    const prompt = promptManager.render('episode-query', {
      title: mergedContext.currentMedia?.title ?? '未知',
      episode: mergedContext.currentMedia?.episode ?? '未知',
      genre: mergedContext.currentMedia?.genre?.join(', ') ?? '未知',
      query,
    })

    // 确保有活跃的对话线程
    if (!conversationManager.getCurrentThread()) {
      conversationManager.createThread('AI 对话')
    }
    conversationManager.sendMessage(null, 'user', query)

    const result = await modelGateway.complete({
      prompt,
      context: mergedContext,
      providerName: this.activeProvider,
      config: { provider: this.activeProvider as AIModelConfig['provider'] },
      caller: 'AIOrchestrator',
    })

    conversationManager.sendMessage(null, 'assistant', result.response.text)
    return result.response
  }

  /** 执行 AI 工具调用 */
  async executeTool(toolName: string, params: Record<string, unknown>): Promise<unknown> {
    this.ensureInitialized()

    const result = await invocationPipeline.invoke({
      toolName,
      parameters: params,
      requestId: `ai_${Date.now().toString(36)}`,
      timestamp: Date.now(),
    })

    if (!result.success) {
      throw new Error(result.error ?? 'Tool execution failed')
    }

    return result.data
  }

  /** 获取可用工具列表 (供 AI Provider 使用) */
  getAvailableTools(): string[] {
    return toolRegistry.list().map((t) => t.schema.name)
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
