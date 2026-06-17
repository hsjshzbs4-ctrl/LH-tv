// src/ai/provider/OpenAIProvider.ts — OpenAI Provider
// PB6: 通过 ModelGateway 调用，禁止直接使用

import { AICapability, type IAIProvider, type AIResponse, type AIContext, type AIModelConfig } from '../types/ai.types'

export class OpenAIProvider implements IAIProvider {
  readonly name = 'openai'
  readonly capabilities = [
    AICapability.ASK, AICapability.SUMMARIZE, AICapability.SUGGEST, AICapability.ASSIST,
  ]
  private config: AIModelConfig | null = null
  private available = false

  async initialize(config: AIModelConfig): Promise<void> {
    this.config = config
    // 验证 API Key
    if (config.apiKey) {
      this.available = true
    } else if (config.endpoint) {
      // 自定义端点 (如 LM Studio) 无需 key
      this.available = true
    }
  }

  async complete(prompt: string, context?: AIContext): Promise<AIResponse> {
    if (!this.available || !this.config) {
      return this.fallbackResponse(prompt)
    }

    const endpoint = this.config.endpoint ?? 'https://api.openai.com/v1/chat/completions'
    const model = this.config.model ?? 'gpt-4o-mini'

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey ? { Authorization: `Bearer ${this.config.apiKey}` } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'You are a helpful media assistant for LH-TV.' },
            { role: 'user', content: prompt },
          ],
          temperature: this.config.temperature ?? 0.7,
          max_tokens: this.config.maxTokens ?? 1024,
          top_p: this.config.topP ?? 1,
        }),
        signal: AbortSignal.timeout(this.config.timeout ?? 30000),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json() as {
        choices: Array<{ message: { content: string } }>
      }

      return {
        text: data.choices?.[0]?.message?.content ?? 'No response',
        confidence: 0.9,
        capability: AICapability.ASK,
      }
    } catch (err) {
      // 网络错误时回退到 safe response
      return {
        text: `[OpenAI Error] ${String(err)}. Please check your API key and network.`,
        confidence: 0,
        capability: AICapability.ASK,
      }
    }
  }

  isAvailable(): boolean { return this.available }
  async dispose(): Promise<void> { this.available = false; this.config = null }

  private fallbackResponse(prompt: string): AIResponse {
    return {
      text: '[OpenAI] Provider not configured. Please add API key in AI Settings.',
      confidence: 0,
      capability: AICapability.ASK,
    }
  }
}
