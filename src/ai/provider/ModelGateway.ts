// src/ai/provider/ModelGateway.ts — AI Model Gateway
// PB6 Governance: 所有 Provider 调用的强制统一出口
// 禁止 UI/Tool 直接调用 Provider → 必须通过: UI → Orchesrator → Gateway → Provider

import type { IAIProvider, AIResponse, AIContext, AIModelConfig } from '../types/ai.types'
import { AIProviderPolicy } from '../governance/AIProviderPolicy'
import { PromptSafetyPolicy } from '../governance/PromptSafetyPolicy'
import { MockAIProvider } from './MockAIProvider'

export interface GatewayRequest {
  prompt: string
  context?: AIContext
  providerName: string
  config: AIModelConfig
  caller: string // 调用方标识
}

export interface GatewayResponse {
  response: AIResponse
  providerUsed: string
  auditId: string
}

/** 速率限制条目 */
interface RateLimitEntry {
  count: number
  resetAt: number
}

export class ModelGateway {
  /** 已注册的 Provider */
  private providers = new Map<string, IAIProvider>()
  /** 速率限制追踪 */
  private rateLimits = new Map<string, RateLimitEntry>()
  /** 默认速率限制 (每分钟) */
  private static DEFAULT_RPM = 60
  /** 最大重试次数 */
  private static MAX_RETRIES = 2

  /**
   * 注册 Provider (需通过 AIProviderPolicy 验证)
   * @returns 是否注册成功
   */
  register(name: string, provider: IAIProvider): { success: boolean; reason?: string } {
    const policyCheck = AIProviderPolicy.validate(name)
    if (!policyCheck.allowed) {
      return { success: false, reason: policyCheck.reason }
    }

    this.providers.set(name, provider)
    return { success: true }
  }

  /** 注销 Provider */
  unregister(name: string): void {
    this.providers.delete(name)
  }

  /** 获取已注册的 Provider */
  getProvider(name: string): IAIProvider | null {
    return this.providers.get(name) ?? null
  }

  /** 列出已注册 Provider */
  listProviders(): string[] {
    return Array.from(this.providers.keys())
  }

  /**
   * 发送请求 — 所有 Provider 调用的统一入口
   * 强制调用链: caller → Gateway → Provider
   */
  async complete(request: GatewayRequest): Promise<GatewayResponse> {
    // 1. 调用方路径验证
    const pathCheck = AIProviderPolicy.validateCallPath(request.caller)
    if (!pathCheck.allowed) {
      throw new Error(`Call path rejected: ${pathCheck.reason}`)
    }

    // 2. Feature Flag 检查
    if (!AIProviderPolicy.isFeatureEnabled()) {
      throw new Error('AI features are disabled (pb5.ai = OFF)')
    }

    // 3. Provider 存在性检查
    const provider = this.providers.get(request.providerName)
    if (!provider) {
      // 回退到 Mock
      const fallback = this.providers.get('mock')
      if (fallback) {
        return this.executeWithProvider(fallback, request, 'mock')
      }
      throw new Error(`Provider "${request.providerName}" not registered and no fallback available`)
    }

    // 4. 可用性检查
    if (!provider.isAvailable()) {
      throw new Error(`Provider "${request.providerName}" is not available`)
    }

    // 5. 速率限制检查
    this.checkRateLimit(request.providerName)

    // 6. 输入安全检查
    const safetyCheck = PromptSafetyPolicy.checkInput(request.prompt)
    if (safetyCheck.level === 'blocked') {
      throw new Error(`Prompt blocked by safety policy: ${safetyCheck.issues.join('; ')}`)
    }

    // 7. 执行
    return this.executeWithProvider(provider, request, request.providerName)
  }

  /**
   * 初始化指定的 Provider
   */
  async initializeProvider(name: string, config: AIModelConfig): Promise<void> {
    const provider = this.providers.get(name)
    if (!provider) {
      throw new Error(`Provider "${name}" not registered`)
    }
    await provider.initialize(config)
  }

  /**
   * 销毁所有 Provider
   */
  async disposeAll(): Promise<void> {
    for (const [name, provider] of this.providers) {
      try { await provider.dispose() } catch { /* silent */ }
    }
    this.providers.clear()
    this.rateLimits.clear()
  }

  // ── 内部 ──

  private async executeWithProvider(
    provider: IAIProvider,
    request: GatewayRequest,
    providerName: string,
  ): Promise<GatewayResponse> {
    const prompt = PromptSafetyPolicy.sanitize(request.prompt)

    const response = await provider.complete(prompt, request.context)

    // 输出安全检查
    const outputCheck = PromptSafetyPolicy.checkOutput(response.text)
    if (outputCheck.level === 'blocked') {
      throw new Error(`Model response blocked: ${outputCheck.issues.join('; ')}`)
    }

    this.recordRateLimit(providerName)

    return {
      response: outputCheck.level === 'warning'
        ? { ...response, text: PromptSafetyPolicy.sanitize(response.text) }
        : response,
      providerUsed: providerName,
      auditId: `gw_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`,
    }
  }

  private checkRateLimit(providerName: string): void {
    const entry = this.rateLimits.get(providerName)
    if (!entry) return

    if (Date.now() > entry.resetAt) {
      this.rateLimits.delete(providerName)
      return
    }

    if (entry.count >= ModelGateway.DEFAULT_RPM) {
      throw new Error(`Rate limit exceeded for provider "${providerName}" (${ModelGateway.DEFAULT_RPM}/min)`)
    }
  }

  private recordRateLimit(providerName: string): void {
    let entry = this.rateLimits.get(providerName)
    if (!entry || Date.now() > entry.resetAt) {
      entry = { count: 0, resetAt: Date.now() + 60000 }
      this.rateLimits.set(providerName, entry)
    }
    entry.count++
  }
}

/** 全局单例 — 所有 AI 调用的唯一出口 */
export const modelGateway = new ModelGateway()
